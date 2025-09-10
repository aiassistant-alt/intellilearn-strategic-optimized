/**
 * ^PCM16AudioWorklet - Production Grade
 * Author: Luis Arturo Parra - Telmo AI  
 * Created: 2025-01-23
 * Usage: Stable 100ms chunking for Nova Sonic (no micro-frames)
 * Business Context: Elimina overhead de 375 msg/s, genera frames estables 1600 samples
 * Relations: novaConversationalService.ts
 * Reminders: Transferable buffers, downmix, resample 48k→16k in-worklet
 */

class PCM16Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 16000;          // Nova Sonic input rate
    this.postSize = 1600;             // 100ms @ 16kHz = stable chunks
    this.buffer = new Float32Array(this.postSize * 4); // buffer con holgura
    this.len = 0;
    this.frameCount = 0;
    this.lastRms = 0;
    
    console.log('🎤 PCM16Processor initialized: targetRate=16kHz, chunkSize=100ms');
  }

  /**
   * Downmix stereo to mono (L+R)/2
   */
  downmix(inputs) {
    const input = inputs[0] || [];
    const L = input[0] || new Float32Array(0);
    const R = input[1];
    
    if (!R || R.length === 0) return L; // Already mono
    
    const out = new Float32Array(L.length);
    for (let i = 0; i < L.length; i++) {
      out[i] = 0.5 * (L[i] + R[i]);
    }
    return out;
  }

  /**
   * Resample to 16kHz with linear interpolation
   */
  resampleTo16k(samples, inRate) {
    if (Math.abs(inRate - 16000) < 1) return samples;
    
    const ratio = inRate / 16000;
    const outLen = Math.floor(samples.length / ratio);
    const out = new Float32Array(outLen);
    
    for (let i = 0; i < outLen; i++) {
      const idx = i * ratio;
      const i0 = Math.floor(idx);
      const i1 = Math.min(i0 + 1, samples.length - 1);
      const frac = idx - i0;
      out[i] = samples[i0] * (1 - frac) + samples[i1] * frac;
    }
    
    return out;
  }

  /**
   * Flush stable 100ms chunks when ready
   */
  flushIfReady() {
    while (this.len >= this.postSize) {
      const slice = this.buffer.subarray(0, this.postSize);
      
      // Shift remaining data left (efficient for small arrays)
      this.buffer.copyWithin(0, this.postSize, this.len);
      this.len -= this.postSize;

      // Convert Float32 -> PCM16
      const pcm16 = new Int16Array(this.postSize);
      for (let i = 0; i < this.postSize; i++) {
        const s = Math.max(-1, Math.min(1, slice[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Send as Transferable (zero-copy)
      this.port.postMessage({
        type: 'audio',
        pcm16: pcm16.buffer,     // Transferable buffer
        rms: this.lastRms || 0,
        timestamp: currentTime,
        samples: this.postSize
      }, [pcm16.buffer]);
      
      // Strategic logging: reduce spam in AudioWorklet
      if (this.frameCount % 10 === 0) {
        console.log(`🎤 Stable chunk sent: ${this.postSize} samples @ ${currentTime}s (rms: ${this.lastRms.toFixed(4)})`);
      }
    }
  }

  /**
   * Process audio frames - stable 100ms output
   */
  process(inputs) {
    const mono = this.downmix(inputs);
    if (!mono.length) return true;

    // Calculate RMS for VAD
    let sum = 0;
    for (let i = 0; i < mono.length; i++) {
      sum += mono[i] * mono[i];
    }
    this.lastRms = Math.sqrt(sum / mono.length);

    // Resample to 16kHz
    const resampled = this.resampleTo16k(mono, sampleRate);

    // Ensure buffer capacity
    if (this.len + resampled.length > this.buffer.length) {
      const newBuffer = new Float32Array((this.len + resampled.length) * 2);
      newBuffer.set(this.buffer.subarray(0, this.len), 0);
      this.buffer = newBuffer;
    }

    // Append to accumulation buffer
    this.buffer.set(resampled, this.len);
    this.len += resampled.length;

    // Flush stable chunks when ready
    this.flushIfReady();
    
    this.frameCount++;
    return true;
  }
}

registerProcessor('pcm16-processor', PCM16Processor);
