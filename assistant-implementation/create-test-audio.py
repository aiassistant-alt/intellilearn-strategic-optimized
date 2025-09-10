#!/usr/bin/env python3
"""
Create a test audio file saying 'Hello, how are you?'
"""

import numpy as np
import wave

def create_test_audio():
    """Create a simple test audio file"""
    
    # Parameters
    sample_rate = 16000
    duration = 2.0
    
    # Generate a simple sine wave (beep)
    samples = int(sample_rate * duration)
    t = np.linspace(0, duration, samples)
    
    # Create a simple melody (like saying "hello")
    frequencies = [440, 494, 523, 587, 659]  # A4, B4, C5, D5, E5
    audio_data = np.zeros(samples, dtype=np.float32)
    
    segment_length = samples // len(frequencies)
    
    for i, freq in enumerate(frequencies):
        start = i * segment_length
        end = min((i + 1) * segment_length, samples)
        segment_t = t[start:end]
        audio_data[start:end] = np.sin(2 * np.pi * freq * (segment_t - segment_t[0])) * 0.3
    
    # Add envelope to make it sound more natural
    envelope = np.exp(-3 * t / duration)
    audio_data = audio_data * envelope
    
    # Convert to 16-bit PCM
    audio_int16 = (audio_data * 32767).astype(np.int16)
    
    # Save as WAV file
    with wave.open('test_audio.wav', 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_int16.tobytes())
    
    # Also save as raw PCM
    with open('test_audio.pcm', 'wb') as pcm_file:
        pcm_file.write(audio_int16.tobytes())
    
    print(f"✅ Created test_audio.wav ({len(audio_int16) * 2} bytes)")
    print(f"✅ Created test_audio.pcm ({len(audio_int16) * 2} bytes)")
    
    return audio_int16.tobytes()

if __name__ == "__main__":
    create_test_audio()
