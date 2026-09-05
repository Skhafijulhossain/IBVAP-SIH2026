/**
 * Tactical audio synthesizer using Web Audio API
 * Works completely offline without external audio assets.
 * Includes rate-limiting / audio cooldown to prevent overlapping distortion.
 */
class TacticalAudioService {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private lastCriticalAlarmTime = 0;
  private lastWarningChirpTime = 0;
  private lastRadioBeepTime = 0;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Autoplay policy: will resume on next user gesture
      });
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * High-priority intrusion alarm (two-tone alternating frequency)
   * Throttled with a 2.5-second cooldown to prevent notification audio spam
   */
  public playCriticalAlarm() {
    if (!this.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - this.lastCriticalAlarmTime < 2500) {
      return;
    }
    this.lastCriticalAlarmTime = nowMs;

    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.15); // D6
      osc.frequency.setValueAtTime(880, now + 0.3);
      osc.frequency.setValueAtTime(1174.66, now + 0.45);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // Audio might be blocked until user gesture
    }
  }

  /**
   * Warning pulse chirp
   * Throttled with a 1.5-second cooldown
   */
  public playWarningChirp() {
    if (!this.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - this.lastWarningChirpTime < 1500) {
      return;
    }
    this.lastWarningChirpTime = nowMs;

    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.2);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore audio block
    }
  }

  /**
   * Radio dispatch ack tone
   * Throttled with an 800ms cooldown
   */
  public playRadioBeep() {
    if (!this.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - this.lastRadioBeepTime < 800) {
      return;
    }
    this.lastRadioBeepTime = nowMs;

    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(1600, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignore
    }
  }
}

export const tacticalAudio = new TacticalAudioService();
