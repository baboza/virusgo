"use client";

// Simple 8-bit sound generator using Web Audio API
class SoundFX {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // UI Sounds
  hover() {
    this.playTone(800, 'square', 0.05, 0.02);
  }

  click() {
    this.playTone(1200, 'square', 0.1, 0.05);
  }

  // Game Sounds
  correct() {
    this.init();
    if (!this.ctx) return;
    // Arpeggio for correct
    setTimeout(() => this.playTone(440, 'square', 0.1, 0.05), 0);
    setTimeout(() => this.playTone(554, 'square', 0.1, 0.05), 100);
    setTimeout(() => this.playTone(659, 'square', 0.2, 0.05), 200);
  }

  wrong() {
    this.init();
    if (!this.ctx) return;
    this.playTone(150, 'sawtooth', 0.3, 0.1);
    setTimeout(() => this.playTone(120, 'sawtooth', 0.4, 0.1), 150);
  }

  attack() {
    this.init();
    if (!this.ctx) return;
    // Pew pew sound
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  damage() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    // Noise-like using low freq sawtooth
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

export const sfx = new SoundFX();
