export class AudioSystem {
  constructor() {
    this.audioContext = null;
    this.initialized = false;
    this.sounds = {};
  }

  async init() {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      console.log('Audio system initialized');
    } catch (e) {
      console.warn('Audio not supported:', e);
    }
  }

  playShoot() {
    if (!this.initialized || !this.audioContext) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // === LAYER 1: Initial crack (the "bang") ===
    const crack = ctx.createOscillator();
    crack.type = 'square';
    crack.frequency.setValueAtTime(2500, now);
    crack.frequency.exponentialRampToValueAtTime(100, now + 0.015);
    
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.8, now);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
    
    crack.connect(crackGain);
    crackGain.connect(ctx.destination);
    crack.start(now);
    crack.stop(now + 0.025);

    // === LAYER 2: Main gunshot body (low-mid punch) ===
    const noise = ctx.createBufferSource();
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(6000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.08);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.18);

    // === LAYER 3: Sub-bass thump (felt more than heard) ===
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(120, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.08);
    
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.12);

    // === LAYER 4: High frequency snap ===
    const snap = ctx.createOscillator();
    snap.type = 'sawtooth';
    snap.frequency.setValueAtTime(3000, now);
    snap.frequency.exponentialRampToValueAtTime(500, now + 0.01);
    
    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.3, now);
    snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.015);
    
    snap.connect(snapGain);
    snapGain.connect(ctx.destination);
    snap.start(now);
    snap.stop(now + 0.02);
  }

  playHit() {
    if (!this.initialized || !this.audioContext) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Impact thud
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
    
    // High ping
    const ping = ctx.createOscillator();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(2000, now);
    
    const pingGain = ctx.createGain();
    pingGain.gain.setValueAtTime(0.2, now);
    pingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    ping.connect(pingGain);
    pingGain.connect(ctx.destination);
    ping.start(now);
    ping.stop(now + 0.06);
  }

  playEmpty() {
    if (!this.initialized || !this.audioContext) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Dry click
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  playReload() {
    if (!this.initialized || !this.audioContext) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Magazine release click
    const click1 = ctx.createOscillator();
    click1.type = 'square';
    click1.frequency.setValueAtTime(800, now);
    
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    click1.connect(gain1);
    gain1.connect(ctx.destination);
    click1.start(now);
    click1.stop(now + 0.06);

    // Magazine insert
    setTimeout(() => {
      const insert = ctx.createOscillator();
      insert.type = 'sine';
      insert.frequency.setValueAtTime(400, ctx.currentTime);
      
      const gainInsert = ctx.createGain();
      gainInsert.gain.setValueAtTime(0.2, ctx.currentTime);
      gainInsert.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      
      insert.connect(gainInsert);
      gainInsert.connect(ctx.destination);
      insert.start();
      insert.stop(ctx.currentTime + 0.1);
    }, 200);

    // Slide release
    setTimeout(() => {
      const release = ctx.createOscillator();
      release.type = 'square';
      release.frequency.setValueAtTime(600, ctx.currentTime);
      
      const gainRelease = ctx.createGain();
      gainRelease.gain.setValueAtTime(0.25, ctx.currentTime);
      gainRelease.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      
      release.connect(gainRelease);
      gainRelease.connect(ctx.destination);
      release.start();
      release.stop(ctx.currentTime + 0.08);
    }, 500);
  }

  playWaveComplete() {
    if (!this.initialized || !this.audioContext) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Victory fanfare
    const frequencies = [523.25, 659.25, 783.99, 1046.50];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.3);
    });
  }

  playGameOver() {
    if (!this.initialized || !this.audioContext) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Sad descending tones
    const frequencies = [392, 349.23, 329.63, 293.66];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.25);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + i * 0.25);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.25 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.25 + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.25);
      osc.stop(now + i * 0.25 + 0.4);
    });
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const audioSystem = new AudioSystem();
