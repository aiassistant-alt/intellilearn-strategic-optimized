/**
 * ^SonicPCMPlayer - Production Jitter Buffer  
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-01-23
 * Usage: Reproductor con jitter-buffer y resample 24k→48k para Nova Sonic
 * Business Context: Elimina underruns, clicks y garantiza audio continuo sin cortes
 * Relations: VoiceSessionViewerNew.tsx audioOutput handler
 * Reminders: 250ms lead time, resample a AudioContext.sampleRate, scheduling preciso
 */

export class SonicPCMPlayer {
  private ctx: AudioContext
  private nextStartTime: number
  private readonly leadTime = 0.25 // 250ms jitter buffer
  private readonly minLeadTime = 0.02 // evita start en pasado
  
  constructor() {
    this.ctx = new AudioContext()
    this.nextStartTime = this.ctx.currentTime
    console.log('🎵 SonicPCMPlayer initialized:', {
      sampleRate: this.ctx.sampleRate,
      leadTime: this.leadTime + 's'
    })
  }

  /**
   * ✅ FIX D: Push audio chunk con jitter-buffer y resample
   */
  async pushBase64LPCM24k(b64: string): Promise<void> {
    try {
      // Decode base64 → PCM16 bytes
      const bin = atob(b64)
      const u8 = new Uint8Array(bin.length)
      for (let i = 0; i < u8.length; i++) {
        u8[i] = bin.charCodeAt(i)
      }
      
      const pcm16 = new Int16Array(u8.buffer, u8.byteOffset, u8.byteLength / 2)
      
      // Int16 → Float32 [-1,1] 
      const f24 = new Float32Array(pcm16.length)
      for (let i = 0; i < pcm16.length; i++) {
        f24[i] = Math.max(-1, Math.min(1, pcm16[i] / 32768))
      }

      // ✅ FIX D: Resample 24kHz → AudioContext.sampleRate (normalmente 48kHz)
      const outRate = this.ctx.sampleRate
      const ratio = 24000 / outRate
      const outLen = Math.floor(f24.length / ratio)
      const fOut = new Float32Array(outLen)
      
      for (let i = 0; i < outLen; i++) {
        const idx = i * ratio
        const i0 = Math.floor(idx)
        const i1 = Math.min(i0 + 1, f24.length - 1)
        const frac = idx - i0
        fOut[i] = f24[i0] * (1 - frac) + f24[i1] * frac
      }

      // Create AudioBuffer
      const audioBuffer = this.ctx.createBuffer(1, fOut.length, outRate)
      audioBuffer.getChannelData(0).set(fOut)

      // ✅ FIX D: Scheduling con jitter-buffer 
      const source = this.ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.ctx.destination)

      const now = this.ctx.currentTime
      
      // Ensure we don't start in the past
      this.nextStartTime = Math.max(this.nextStartTime, now + this.minLeadTime)
      
      // Maintain jitter buffer lead time
      if (this.nextStartTime - now < this.leadTime) {
        this.nextStartTime = now + this.leadTime
      }
      
      source.start(this.nextStartTime)
      this.nextStartTime += audioBuffer.duration
      
      console.log(`🔊 Audio scheduled: start=${this.nextStartTime.toFixed(3)}s duration=${audioBuffer.duration.toFixed(3)}s lead=${(this.nextStartTime - now).toFixed(3)}s`)
      
    } catch (error) {
      console.error('❌ SonicPCMPlayer error:', error)
    }
  }

  /**
   * ✅ FIX D: Reset del timing para nueva sesión
   */
  reset() {
    this.nextStartTime = this.ctx.currentTime
    console.log('🔄 SonicPCMPlayer timing reset')
  }

  /**
   * ✅ FIX D: Cleanup de recursos
   */
  async close() {
    try {
      await this.ctx.close()
      console.log('🛑 SonicPCMPlayer closed')
    } catch (error) {
      console.error('❌ Error closing SonicPCMPlayer:', error)
    }
  }
}
