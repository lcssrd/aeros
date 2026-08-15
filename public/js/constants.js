/**
 * Frontend constants for vital signs simulation.
 */

export const MEDICAL_THRESHOLDS = {
  BPM: {
    MIN_SAFE: 50,
    MAX_SAFE: 90,
  },
  SPO2: {
    MIN_SAFE: 95,
  },
  SYS: {
    MIN_SAFE: 100,
    MAX_SAFE: 140,
  },
  DIA: {
    MIN_SAFE: 65,
    MAX_SAFE: 90,
  },
};

export const SIMULATION_CONFIG = {
  NIBP_DURATION_MS: 7000,
  SPO2_CONNECT_DURATION_MS: 3000,
  NIBP_CYCLE_INTERVAL_SEC: 120,
  PULSE_JITTER_INTERVAL_MS: 5000,
  TRANSMIT_FEEDBACK_DURATION_MS: 800,
};
