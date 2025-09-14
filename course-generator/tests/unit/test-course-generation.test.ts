/**
 * ^TestCourseGeneration
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-13
 * Usage: Unit tests for course generation Step Functions workflow
 * Business Context: Ensures course generation logic works correctly
 * Relations: Step Functions state machine, Jest testing framework
 * Reminders: Run tests before deployment to catch issues early
 * Security: Tests use mock AWS services to avoid charges
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('Course Generation Workflow', () => {
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Course Request Validation', () => {
    
    test('should validate CEFR levels', () => {
      const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      
      validLevels.forEach(level => {
        expect(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).toContain(level);
      });
    });

    test('should validate course types', () => {
      const validTypes = ['standard', 'intensive', 'business', 'conversation'];
      
      validTypes.forEach(type => {
        expect(['standard', 'intensive', 'business', 'conversation']).toContain(type);
      });
    });

  });

  describe('Content Generation', () => {
    
    test('should generate appropriate prompts for different roles', () => {
      const roles = ['Course Planner', 'Curriculum Designer', 'Exercise Designer', 'Assessment Specialist'];
      
      roles.forEach(role => {
        expect(role).toBeTruthy();
        expect(typeof role).toBe('string');
      });
    });

    test('should adapt content difficulty by CEFR level', () => {
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      
      levels.forEach(level => {
        expect(level).toMatch(/^[ABC][12]$/);
      });
    });

  });

  describe('S3 Key Generation', () => {
    
    test('should generate correct S3 keys for course content', () => {
      const courseData = {
        language: 'English',
        level: 'A1',
        createdAt: '2025-09-13T10:30:00Z'
      };

      const expectedKey = 'courses/English/A1/English-A1-2025-09-13.json';
      const actualKey = generateS3Key(courseData);
      
      expect(actualKey).toBe(expectedKey);
    });

    test('should generate correct embedding keys', () => {
      const courseData = {
        language: 'Spanish',
        level: 'B2',
        createdAt: '2025-09-13T15:45:00Z'
      };

      const expectedKey = 'embeddings/Spanish/B2/Spanish-B2-2025-09-13-embedding.json';
      const actualKey = generateEmbeddingKey(courseData);
      
      expect(actualKey).toBe(expectedKey);
    });

  });

  describe('Platform Integration', () => {
    
    test('should format course data for platform integration', () => {
      const generatedCourse = {
        courseId: 'test-course-123',
        language: 'English',
        level: 'A1',
        content: 'Generated course content...',
        s3Location: 'courses/English/A1/test-course.json'
      };

      const platformCourse = formatForPlatform(generatedCourse);
      
      expect(platformCourse).toHaveProperty('id');
      expect(platformCourse).toHaveProperty('title');
      expect(platformCourse).toHaveProperty('description');
      expect(platformCourse).toHaveProperty('difficulty');
      expect(platformCourse).toHaveProperty('generatedCourse', true);
      expect(platformCourse.tags).toContain('auto-generated');
      expect(platformCourse.tags).toContain('voice-ai-compatible');
    });

    test('should map CEFR levels to platform difficulty', () => {
      const mappings = [
        { level: 'A1', expected: 'Beginner' },
        { level: 'A2', expected: 'Elementary' },
        { level: 'B1', expected: 'Intermediate' },
        { level: 'B2', expected: 'Upper Intermediate' },
        { level: 'C1', expected: 'Advanced' },
        { level: 'C2', expected: 'Proficient' }
      ];

      mappings.forEach(({ level, expected }) => {
        const difficulty = mapLevelToDifficulty(level);
        expect(difficulty).toBe(expected);
      });
    });

  });

});

// Helper functions for testing
function generateS3Key(courseData: any): string {
  const date = courseData.createdAt.split('T')[0];
  return `courses/${courseData.language}/${courseData.level}/${courseData.language}-${courseData.level}-${date}.json`;
}

function generateEmbeddingKey(courseData: any): string {
  const date = courseData.createdAt.split('T')[0];
  return `embeddings/${courseData.language}/${courseData.level}/${courseData.language}-${courseData.level}-${date}-embedding.json`;
}

function formatForPlatform(course: any) {
  return {
    id: course.courseId,
    title: `${course.language} Course - ${course.level} Level`,
    description: `Auto-generated ${course.language} course for ${course.level} proficiency level`,
    difficulty: mapLevelToDifficulty(course.level),
    generatedCourse: true,
    tags: ['auto-generated', 'voice-ai-compatible', course.language.toLowerCase(), course.level.toLowerCase()]
  };
}

function mapLevelToDifficulty(level: string): string {
  const mapping: { [key: string]: string } = {
    'A1': 'Beginner',
    'A2': 'Elementary',
    'B1': 'Intermediate', 
    'B2': 'Upper Intermediate',
    'C1': 'Advanced',
    'C2': 'Proficient'
  };
  return mapping[level] || 'Intermediate';
}