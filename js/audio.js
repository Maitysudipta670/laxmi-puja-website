/**
 * Puja Audio Synthesizer using Web Audio API
 * Provides authentic, zero-dependency temple soundscapes:
 * 1. Shankha Dhwani (Conch Shell)
 * 2. Pujo Ghanta (Temple Brass Bell)
 * 3. Traditional Dhaak Beats (Bengali Festive Drums)
 * 4. Ambient Om / Tanpura Drone
 */

class PujaSoundEngine {
  constructor() {
    this.ctx = null;
    this.droneGain = null;
    this.droneOscillators = [];
    this.isDronePlaying = false;
    this.isDhaakPlaying = false;
    this.dhaakInterval = null;
  }

  // Initialize AudioContext on first user interaction (browser policy)
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Sacred Shankha Dhwani (Conch Shell Sound)
   * Simulates the low-frequency drone rising into a powerful resonant blow
   */
  playShankh() {
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const duration = 4.2;

    // Master gain for conch
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.65, now + 0.6);
    masterGain.gain.setValueAtTime(0.65, now + 2.8);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Filter to emulate conch internal cavity resonance
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.linearRampToValueAtTime(490, now + 0.8);
    filter.frequency.linearRampToValueAtTime(440, now + 3.2);
    filter.Q.value = 5.0;

    // Base fundamental oscillator (conch lip vibration)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(215, now);
    osc1.frequency.linearRampToValueAtTime(245, now + 0.8);
    osc1.frequency.linearRampToValueAtTime(220, now + 3.5);

    // Sub-harmonic oscillator
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(430, now);
    osc2.frequency.linearRampToValueAtTime(490, now + 0.8);
    osc2.frequency.linearRampToValueAtTime(440, now + 3.5);

    // Air breath noise generator
    const bufferSize = ctx.sampleRate * duration;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 850;
    noiseFilter.Q.value = 3.0;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, now);
    noiseGain.gain.linearRampToValueAtTime(0.12, now + 0.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.2);

    // Connect graph
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterGain);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    noise.start(now);

    osc1.stop(now + duration);
    osc2.stop(now + duration);
    noise.stop(now + duration);
  }

  /**
   * Temple Ghanta (Brass Bell)
   * High pure strike with long sparkling harmonic decay
   */
  playTempleBell() {
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const duration = 3.0;

    // Harmonic frequencies typical of a sacred brass temple bell
    const baseFreq = 880; // A5
    const ratios = [1.0, 1.5, 2.0, 2.76, 3.8, 5.4];
    const gains = [0.45, 0.25, 0.18, 0.12, 0.08, 0.05];

    ratios.forEach((ratio, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq * ratio, now);

      // Strike attack and long natural exponential ring-down
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(gains[index], now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / (1 + index * 0.25));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  /**
   * Single Dhaak (Bengali Drum) Strike
   * @param {string} type 'open' or 'slap' or 'rim'
   */
  playSingleDhaakStrike(type = 'open') {
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'open') {
      // Deep resonant drum body
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.15);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Snappy stick strike / kanshi accent
      const bufferSize = ctx.sampleRate * 0.1;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1800;

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.4, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.12);
    }
  }

  /**
   * Rhythmic Bengali Pujo Dhaak loop
   */
  toggleDhaak(onUpdate) {
    this.init();
    if (this.isDhaakPlaying) {
      clearInterval(this.dhaakInterval);
      this.isDhaakPlaying = false;
      if (onUpdate) onUpdate(false);
      return false;
    }

    this.isDhaakPlaying = true;
    if (onUpdate) onUpdate(true);

    // Traditional 4-beat rhythm (Dha-tin-tin-ta...)
    const rhythmPattern = ['open', 'slap', 'open', 'slap', 'open', 'slap', 'open', 'open'];
    let step = 0;

    this.dhaakInterval = setInterval(() => {
      const beat = rhythmPattern[step % rhythmPattern.length];
      this.playSingleDhaakStrike(beat);
      step++;
    }, 220);

    return true;
  }

  /**
   * Soothing Ambient Tanpura Drone
   */
  toggleAmbientDrone(onUpdate) {
    this.init();
    const ctx = this.ctx;

    if (this.isDronePlaying) {
      if (this.droneGain) {
        this.droneGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        setTimeout(() => {
          this.droneOscillators.forEach(o => {
            try { o.stop(); } catch(e) {}
          });
          this.droneOscillators = [];
        }, 1300);
      }
      this.isDronePlaying = false;
      if (onUpdate) onUpdate(false);
      return false;
    }

    this.isDronePlaying = true;
    if (onUpdate) onUpdate(true);

    const now = ctx.currentTime;
    this.droneGain = ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.001, now);
    this.droneGain.gain.linearRampToValueAtTime(0.2, now + 2);
    this.droneGain.connect(ctx.destination);

    // Root D3 (146.8 Hz), Pa A3 (220 Hz), and upper overtone octaves
    const freqs = [146.83, 220.0, 293.66, 440.0];
    this.droneOscillators = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      const localGain = ctx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now);

      // Subtle slow detune vibrato
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.2 + i * 0.1;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 1.2;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);

      localGain.gain.value = 0.25 / (i + 1);
      osc.connect(localGain);
      localGain.connect(this.droneGain);
      osc.start(now);
      return osc;
    });

    return true;
  }

  /**
   * Soft flower offering whoosh / chime
   */
  playFlowerChime() {
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const timeOffset = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, timeOffset);

      gain.gain.setValueAtTime(0, timeOffset);
      gain.gain.linearRampToValueAtTime(0.18, timeOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, timeOffset + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(timeOffset);
      osc.stop(timeOffset + 0.9);
    });
  }
}

// Global instance
window.pujaAudio = new PujaSoundEngine();
