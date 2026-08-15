/**
 * Audio Manager using Web Audio API for tone synthesis
 * and HTML5 Audio for sound effects.
 */

export class AudioManager {
  constructor({ cuffAudioEl, alertAudioEl }) {
    this.cuffAudio = cuffAudioEl;
    this.alertAudio = alertAudioEl;
    this.audioContext = null;
    this.isMuted = false;
  }

  /**
   * Initializes or resumes the AudioContext after user interaction.
   *
   * @returns {AudioContext}
   */
  getAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Toggles mute state.
   *
   * @returns {boolean} New mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.alertAudio) {
      this.alertAudio.pause();
      this.alertAudio.currentTime = 0;
    }
    return this.isMuted;
  }

  /**
   * Plays soft pulse beep tone (Oximeter sound).
   */
  playPulseBeep() {
    if (this.isMuted) {
      return;
    }

    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = 880; // A5 sine wave
      osc.type = 'sine';

      gain.gain.value = 0.08;

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (error) {
      console.warn('[Audio] Failed to play pulse beep:', error);
    }
  }

  /**
   * Plays NIBP dual-tone chime when blood pressure measurement finishes.
   */
  playNibpBeep() {
    if (this.isMuted) {
      return;
    }

    try {
      const ctx = this.getAudioContext();

      // First tone (A4, 440Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 440;
      osc1.type = 'sine';
      gain1.gain.value = 0.12;
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.1);

      // Second tone (C5, 523Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 523.25;
      osc2.type = 'sine';
      gain2.gain.value = 0.12;
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.25);
    } catch (error) {
      console.warn('[Audio] Failed to play NIBP chime:', error);
    }
  }

  /**
   * Plays cuff inflation audio (always audible unless stopped).
   */
  playCuffSound() {
    if (this.cuffAudio) {
      this.cuffAudio.currentTime = 0;
      this.cuffAudio.play().catch(e => console.warn('[Audio] Cuff playback blocked:', e));
    }
  }

  /**
   * Stops cuff sound.
   */
  stopCuffSound() {
    if (this.cuffAudio) {
      this.cuffAudio.pause();
      this.cuffAudio.currentTime = 0;
    }
  }

  /**
   * Plays continuous alarm sound if not muted.
   */
  playAlarm() {
    if (this.isMuted || !this.alertAudio) {
      return;
    }
    this.alertAudio.currentTime = 0;
    this.alertAudio.play().catch(e => console.warn('[Audio] Alarm playback blocked:', e));
  }

  /**
   * Stops alarm sound.
   */
  stopAlarm() {
    if (this.alertAudio) {
      this.alertAudio.pause();
      this.alertAudio.currentTime = 0;
    }
  }
}
