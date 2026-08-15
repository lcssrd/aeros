/**
 * Medical thresholds and simulation configuration constants.
 */

export const MEDICAL_THRESHOLDS = {
  BPM: {
    MIN_SAFE: 50,
    MAX_SAFE: 90,
    MIN_INPUT: 0,
    MAX_INPUT: 250,
  },
  SPO2: {
    MIN_SAFE: 95,
    MIN_INPUT: 70,
    MAX_INPUT: 100,
  },
  SYS: {
    MIN_SAFE: 100,
    MAX_SAFE: 140,
    MIN_INPUT: 50,
    MAX_INPUT: 230,
  },
  DIA: {
    MIN_SAFE: 65,
    MAX_SAFE: 90,
    MIN_INPUT: 20,
    MAX_INPUT: 150,
  },
};

export const DEFAULT_VITALS = {
  bpm: 80,
  spo2: 98,
  sys: 120,
  dia: 80,
};

export const SIMULATION_TIMINGS = {
  NIBP_MEASUREMENT_DURATION_MS: 7000,
  SPO2_SENSOR_CONNECT_DURATION_MS: 3000,
  NIBP_AUTO_CYCLE_INTERVAL_SEC: 120,
  BPM_JITTER_INTERVAL_MS: 5000,
  FEEDBACK_ANIMATION_DURATION_MS: 800,
};
