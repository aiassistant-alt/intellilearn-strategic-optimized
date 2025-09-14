"""
Quality Check Lambda for Course Content
Author: Luis Arturo Parra - Telmo AI
Created: 2025-09-13
Purpose: Verify CEFR alignment and content uniqueness
"""

import json
import boto3
import os
from typing import Dict, List, Any
import re
from datetime import datetime

# Initialize AWS clients
s3_vectors_client = boto3.client('s3vectors', region_name='us-east-1')
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')

# Configuration
VECTOR_BUCKET = os.environ.get('VECTOR_BUCKET', 'intellilearn-course-vectors')
VECTOR_INDEX = os.environ.get('VECTOR_INDEX', 'courses-semantic-index')

# CEFR Level Characteristics
CEFR_PATTERNS = {
    'A1': {
        'vocabulary_complexity': 0.2,
        'sentence_length_avg': 8,
        'grammar_patterns': ['present_simple', 'to_be', 'basic_questions'],
        'topics': ['greetings', 'numbers', 'family', 'basic_needs'],
        'max_words': 500
    },
    'A2': {
        'vocabulary_complexity': 0.35,
        'sentence_length_avg': 12,
        'grammar_patterns': ['present_continuous', 'past_simple', 'future_going_to'],
        'topics': ['daily_routine', 'shopping', 'travel', 'hobbies'],
        'max_words': 1000
    },
    'B1': {
        'vocabulary_complexity': 0.5,
        'sentence_length_avg': 15,
        'grammar_patterns': ['present_perfect', 'conditionals_1st', 'passive_voice'],
        'topics': ['work', 'education', 'culture', 'opinions'],
        'max_words': 2000
    },
    'B2': {
        'vocabulary_complexity': 0.65,
        'sentence_length_avg': 18,
        'grammar_patterns': ['past_perfect', 'conditionals_2nd_3rd', 'reported_speech'],
        'topics': ['abstract_concepts', 'news', 'technology', 'environment'],
        'max_words': 4000
    },
    'C1': {
        'vocabulary_complexity': 0.8,
        'sentence_length_avg': 22,
        'grammar_patterns': ['subjunctive', 'inversion', 'complex_clauses'],
        'topics': ['academic', 'professional', 'philosophy', 'politics'],
        'max_words': 8000
    },
    'C2': {
        'vocabulary_complexity': 0.95,
        'sentence_length_avg': 25,
        'grammar_patterns': ['all_structures', 'idiomatic', 'nuanced'],
        'topics': ['any_topic', 'specialized', 'literary', 'scientific'],
        'max_words': 10000
    }
}

def lambda_handler(event: Dict, context: Any) -> Dict:
    """
    Main Lambda handler for quality checks
    """
    action = event.get('action')
    
    try:
        if action == 'verify_cefr_alignment':
            return verify_cefr_alignment(event)
        elif action == 'check_uniqueness':
            return check_uniqueness(event)
        elif action == 'calculate_quality_score':
            return calculate_quality_score(event)
        else:
            raise ValueError(f"Unknown action: {action}")
    
    except Exception as e:
        print(f"Error in quality check: {str(e)}")
        return {
            'statusCode': 500,
            'error': str(e)
        }

def verify_cefr_alignment(event: Dict) -> Dict:
    """
    Verify content aligns with target CEFR level
    """
    try:
        content = event['content']
        target_level = event['targetLevel']
        language = event['language']
        
        # Combine all content
        full_content = ""
        if isinstance(content, dict):
            full_content = " ".join(str(v) for v in content.values())
        else:
            full_content = str(content)
        
        # Analyze content characteristics
        analysis = analyze_content(full_content, target_level)
        
        # Get reference embeddings for target level
        reference_score = check_level_similarity(full_content, target_level, language)
        
        # Calculate alignment score
        alignment_score = calculate_alignment(analysis, reference_score, target_level)
        
        # Determine if correction needed
        needs_correction = alignment_score < 0.70
        
        # Generate recommendations if needed
        recommendations = []
        if needs_correction:
            recommendations = generate_recommendations(analysis, target_level)
        
        print(f"📊 CEFR Alignment: {alignment_score:.2%} for {target_level}")
        
        return {
            'statusCode': 200,
            'score': alignment_score,
            'targetLevel': target_level,
            'analysis': analysis,
            'needsCorrection': needs_correction,
            'recommendations': recommendations,
            'referenceScore': reference_score
        }
    
    except Exception as e:
        print(f"Error verifying CEFR alignment: {str(e)}")
        raise

def check_uniqueness(event: Dict) -> Dict:
    """
    Check content uniqueness across the course
    """
    try:
        course_id = event['courseId']
        duplicate_threshold = event.get('duplicateThreshold', 0.95)
        
        # Get all vectors for this course
        response = s3_vectors_client.list_vectors(
            VectorBucketName=VECTOR_BUCKET,
            IndexName=VECTOR_INDEX,
            FilterExpression=f"course_id = '{course_id}'",
            MaxItems=100
        )
        
        vectors = response.get('Vectors', [])
        
        # Calculate pairwise similarities
        duplicates = []
        total_comparisons = 0
        high_similarity_count = 0
        
        for i, vector1 in enumerate(vectors):
            for j, vector2 in enumerate(vectors[i+1:], i+1):
                similarity = calculate_vector_similarity(
                    vector1.get('Data', {}).get('Float32', []),
                    vector2.get('Data', {}).get('Float32', [])
                )
                total_comparisons += 1
                
                if similarity >= duplicate_threshold:
                    duplicates.append({
                        'key1': vector1['Key'],
                        'key2': vector2['Key'],
                        'similarity': similarity
                    })
                    high_similarity_count += 1
        
        # Calculate uniqueness score
        uniqueness_score = 1 - (high_similarity_count / max(total_comparisons, 1))
        
        print(f"✅ Uniqueness Score: {uniqueness_score:.2%}")
        
        return {
            'statusCode': 200,
            'score': uniqueness_score,
            'totalVectors': len(vectors),
            'duplicatesFound': len(duplicates),
            'duplicates': duplicates[:5],  # Return top 5 duplicates
            'needsVariation': uniqueness_score < 0.80
        }
    
    except Exception as e:
        print(f"Error checking uniqueness: {str(e)}")
        raise

def calculate_quality_score(event: Dict) -> Dict:
    """
    Calculate overall quality score for content
    """
    try:
        content = event['content']
        cefr_score = event.get('cefrScore', 0)
        uniqueness_score = event.get('uniquenessScore', 0)
        
        # Content analysis
        content_score = analyze_content_quality(content)
        
        # Pedagogical structure score
        structure_score = analyze_pedagogical_structure(content)
        
        # Calculate weighted quality score
        quality_score = (
            cefr_score * 0.3 +
            uniqueness_score * 0.2 +
            content_score * 0.3 +
            structure_score * 0.2
        )
        
        # Determine quality level
        quality_level = "Excellent" if quality_score >= 0.85 else \
                       "Good" if quality_score >= 0.70 else \
                       "Needs Improvement"
        
        print(f"🏆 Quality Score: {quality_score:.2%} - {quality_level}")
        
        return {
            'statusCode': 200,
            'score': quality_score,
            'level': quality_level,
            'components': {
                'cefr': cefr_score,
                'uniqueness': uniqueness_score,
                'content': content_score,
                'structure': structure_score
            }
        }
    
    except Exception as e:
        print(f"Error calculating quality score: {str(e)}")
        raise

def analyze_content(content: str, target_level: str) -> Dict:
    """
    Analyze content characteristics
    """
    # Word and sentence analysis
    sentences = re.split(r'[.!?]+', content)
    words = content.split()
    
    avg_sentence_length = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
    total_words = len(words)
    
    # Vocabulary complexity (simplified)
    unique_words = len(set(words))
    vocabulary_complexity = unique_words / max(total_words, 1)
    
    # Grammar pattern detection (simplified)
    detected_patterns = []
    pattern_keywords = {
        'present_simple': ['do', 'does', 'don\'t', 'doesn\'t'],
        'present_continuous': ['am', 'is', 'are', 'ing'],
        'past_simple': ['did', 'didn\'t', 'was', 'were', 'ed'],
        'present_perfect': ['have', 'has', 'been', 'since', 'for'],
        'conditionals': ['if', 'would', 'could', 'should'],
        'passive_voice': ['is', 'are', 'was', 'were', 'been', 'by']
    }
    
    for pattern, keywords in pattern_keywords.items():
        if any(keyword in content.lower() for keyword in keywords):
            detected_patterns.append(pattern)
    
    return {
        'avgSentenceLength': avg_sentence_length,
        'totalWords': total_words,
        'uniqueWords': unique_words,
        'vocabularyComplexity': vocabulary_complexity,
        'detectedPatterns': detected_patterns
    }

def check_level_similarity(content: str, target_level: str, language: str) -> float:
    """
    Check similarity with canonical level examples
    """
    try:
        # Generate embedding for content
        embedding = generate_embedding(content)
        
        # Search for similar content at target level
        response = s3_vectors_client.query_vectors(
            VectorBucketName=VECTOR_BUCKET,
            IndexName=VECTOR_INDEX,
            TopK=10,
            QueryVector={'Float32': embedding},
            FilterExpression=f"cefr_level = '{target_level}' AND language = '{language}' AND quality_score >= 0.85",
            ReturnDistance=True
        )
        
        # Calculate average similarity
        similarities = []
        for result in response.get('Results', []):
            similarity = 1 - result['Distance']
            similarities.append(similarity)
        
        avg_similarity = sum(similarities) / len(similarities) if similarities else 0.5
        
        return avg_similarity
    
    except Exception as e:
        print(f"Error checking level similarity: {str(e)}")
        return 0.5

def calculate_alignment(analysis: Dict, reference_score: float, target_level: str) -> float:
    """
    Calculate overall alignment score
    """
    target_specs = CEFR_PATTERNS[target_level]
    
    # Sentence length alignment
    sentence_diff = abs(analysis['avgSentenceLength'] - target_specs['sentence_length_avg'])
    sentence_score = max(0, 1 - (sentence_diff / target_specs['sentence_length_avg']))
    
    # Vocabulary complexity alignment
    vocab_diff = abs(analysis['vocabularyComplexity'] - target_specs['vocabulary_complexity'])
    vocab_score = max(0, 1 - (vocab_diff / target_specs['vocabulary_complexity']))
    
    # Word count alignment
    word_score = 1.0 if analysis['totalWords'] <= target_specs['max_words'] else \
                 target_specs['max_words'] / analysis['totalWords']
    
    # Grammar pattern coverage
    expected_patterns = set(target_specs['grammar_patterns'])
    detected_patterns = set(analysis['detectedPatterns'])
    pattern_score = len(expected_patterns & detected_patterns) / max(len(expected_patterns), 1)
    
    # Weighted alignment score
    alignment_score = (
        sentence_score * 0.2 +
        vocab_score * 0.2 +
        word_score * 0.1 +
        pattern_score * 0.2 +
        reference_score * 0.3
    )
    
    return min(1.0, alignment_score)

def generate_recommendations(analysis: Dict, target_level: str) -> List[str]:
    """
    Generate recommendations for improvement
    """
    recommendations = []
    target_specs = CEFR_PATTERNS[target_level]
    
    if analysis['avgSentenceLength'] > target_specs['sentence_length_avg'] * 1.3:
        recommendations.append(f"Simplify sentences. Target average: {target_specs['sentence_length_avg']} words")
    
    if analysis['vocabularyComplexity'] > target_specs['vocabulary_complexity'] * 1.2:
        recommendations.append(f"Use simpler vocabulary appropriate for {target_level} level")
    
    if analysis['totalWords'] > target_specs['max_words']:
        recommendations.append(f"Reduce content length. Maximum for {target_level}: {target_specs['max_words']} words")
    
    missing_patterns = set(target_specs['grammar_patterns']) - set(analysis['detectedPatterns'])
    if missing_patterns:
        recommendations.append(f"Include grammar patterns: {', '.join(missing_patterns)}")
    
    return recommendations

def analyze_content_quality(content: str) -> float:
    """
    Analyze content quality metrics
    """
    score = 0.5  # Base score
    
    # Check for structure
    if 'objective' in content.lower() or 'goal' in content.lower():
        score += 0.1
    
    # Check for examples
    if 'example' in content.lower() or 'e.g.' in content.lower():
        score += 0.1
    
    # Check for exercises
    if 'exercise' in content.lower() or 'practice' in content.lower():
        score += 0.1
    
    # Check for assessment
    if 'quiz' in content.lower() or 'test' in content.lower():
        score += 0.1
    
    # Check for variety
    if len(set(content.split())) > 100:
        score += 0.1
    
    return min(1.0, score)

def analyze_pedagogical_structure(content: str) -> float:
    """
    Analyze pedagogical structure
    """
    score = 0.5  # Base score
    
    # Check for learning progression
    if any(word in content.lower() for word in ['basic', 'intermediate', 'advanced']):
        score += 0.15
    
    # Check for scaffolding
    if 'step' in content.lower() or 'first' in content.lower() and 'then' in content.lower():
        score += 0.15
    
    # Check for interaction
    if 'speak' in content.lower() or 'listen' in content.lower() or 'voice' in content.lower():
        score += 0.1
    
    # Check for cultural elements
    if 'culture' in content.lower() or 'tradition' in content.lower():
        score += 0.1
    
    return min(1.0, score)

def calculate_vector_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors
    """
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = sum(a * a for a in vec1) ** 0.5
    norm2 = sum(b * b for b in vec2) ** 0.5
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return dot_product / (norm1 * norm2)

def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding using Amazon Titan
    """
    try:
        response = bedrock_runtime.invoke_model(
            modelId='amazon.titan-embed-text-v1',
            body=json.dumps({
                'inputText': text[:8000]  # Titan max input
            })
        )
        
        result = json.loads(response['body'].read())
        return result['embedding']
    
    except Exception as e:
        print(f"Error generating embedding: {str(e)}")
        return [0.0] * DIMENSION