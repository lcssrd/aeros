/**
 * Web Audio API synthesizer configuration constants.
 */

export const AUDIO_CONFIG = {
  PULSE_BEEP: {
    FREQUENCY: 880, // A5 sine wave, soft pulse oximeter beep
    GAIN: 0.08,
    DURATION: 0.08, // seconds
    WAVE_TYPE: 'sine',
  },
  NIBP_BEEP_1: {
    FREQUENCY: 440, // A4 lower tone
    GAIN: 0.12,
    DURATION: 0.1,
    OFFSET: 0,
    WAVE_TYPE: 'sine',
  },
  NIBP_BEEP_2: {
    FREQUENCY: 523.25, // C5 higher tone
    GAIN: 0.12,
    DURATION: 0.1,
    OFFSET: 0.15,
    WAVE_TYPE: 'sine',
  },
};
