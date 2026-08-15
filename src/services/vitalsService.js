/**
 * Service providing pure functions for vital signs calculations,
 * validations, and alarm threshold evaluations.
 */

import { MEDICAL_THRESHOLDS, DEFAULT_VITALS } from '../constants/medical.js';

/**
 * Calculates the Mean Arterial Pressure (MAP / PAM) using the standard formula:
 * MAP = (Systolic + 2 * Diastolic) / 3
 *
 * @param {number|string} sys - Systolic blood pressure (mmHg)
 * @param {number|string} dia - Diastolic blood pressure (mmHg)
 * @returns {number|null} Calculated rounded MAP or null if inputs are invalid
 */
export function calculateMAP(sys, dia) {
  const sysNum = Number(sys);
  const diaNum = Number(dia);

  if (isNaN(sysNum) || isNaN(diaNum) || sys === null || dia === null || sys === '' || dia === '') {
    return null;
  }

  if (sysNum <= 0 || diaNum <= 0) {
    return null;
  }

  return Math.round((sysNum + 2 * diaNum) / 3);
}

/**
 * Sanitizes and validates a payload of vital signs.
 * Clamps values within physiological bounds.
 *
 * @param {object} payload - Vital signs object { bpm, spo2, sys, dia }
 * @returns {{ bpm: number, spo2: number, sys: number, dia: number }} Sanitized vital signs
 */
export function validateVitals(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ...DEFAULT_VITALS };
  }

  const clamp = (val, min, max, fallback) => {
    const num = Number(val);
    if (isNaN(num)) {
      return fallback;
    }
    return Math.min(Math.max(num, min), max);
  };

  return {
    bpm: clamp(
      payload.bpm,
      MEDICAL_THRESHOLDS.BPM.MIN_INPUT,
      MEDICAL_THRESHOLDS.BPM.MAX_INPUT,
      DEFAULT_VITALS.bpm
    ),
    spo2: clamp(
      payload.spo2,
      MEDICAL_THRESHOLDS.SPO2.MIN_INPUT,
      MEDICAL_THRESHOLDS.SPO2.MAX_INPUT,
      DEFAULT_VITALS.spo2
    ),
    sys: clamp(
      payload.sys,
      MEDICAL_THRESHOLDS.SYS.MIN_INPUT,
      MEDICAL_THRESHOLDS.SYS.MAX_INPUT,
      DEFAULT_VITALS.sys
    ),
    dia: clamp(
      payload.dia,
      MEDICAL_THRESHOLDS.DIA.MIN_INPUT,
      MEDICAL_THRESHOLDS.DIA.MAX_INPUT,
      DEFAULT_VITALS.dia
    ),
  };
}

/**
 * Evaluates alarm conditions based on current vitals and sensor activation states.
 *
 * NOTE ON NIBP (Blood Pressure):
 * Blood pressure only triggers an acoustic alarm and visual threshold evaluation
 * at the specific moment a measurement is performed (`fromNibp: true`).
 * Continuous SpO2/pulse monitoring or parameter changes must NOT sound the tension alarm.
 *
 * @param {object} options
 * @param {{ bpm: number|string, spo2: number|string, sys: number|string, dia: number|string }} options.vitals
 * @param {boolean} [options.isSpo2Active=false]
 * @param {boolean} [options.fromNibp=false]
 * @returns {{ triggerAlert: boolean, alerts: { bpm: boolean, spo2: boolean, sys: boolean, dia: boolean } }}
 */
export function evaluateAlerts({ vitals, isSpo2Active = false, fromNibp = false }) {
  const alerts = {
    bpm: false,
    spo2: false,
    sys: false,
    dia: false,
  };

  let triggerAlert = false;
  const bpm = Number(vitals.bpm);
  const spo2 = Number(vitals.spo2);
  const sys = Number(vitals.sys);
  const dia = Number(vitals.dia);

  // Heart Rate (BPM) alarm
  if (isSpo2Active && !isNaN(bpm)) {
    if (bpm < MEDICAL_THRESHOLDS.BPM.MIN_SAFE || bpm > MEDICAL_THRESHOLDS.BPM.MAX_SAFE) {
      alerts.bpm = true;
      triggerAlert = true;
    }
  }

  // SpO2 alarm
  if (isSpo2Active && !isNaN(spo2)) {
    if (spo2 < MEDICAL_THRESHOLDS.SPO2.MIN_SAFE) {
      alerts.spo2 = true;
      triggerAlert = true;
    }
  }

  // NIBP (Blood pressure) alarm - ONLY evaluated when fromNibp is explicitly true
  if (fromNibp && !isNaN(sys) && !isNaN(dia)) {
    if (sys < MEDICAL_THRESHOLDS.SYS.MIN_SAFE || sys > MEDICAL_THRESHOLDS.SYS.MAX_SAFE) {
      alerts.sys = true;
      triggerAlert = true;
    }
    if (dia < MEDICAL_THRESHOLDS.DIA.MIN_SAFE || dia > MEDICAL_THRESHOLDS.DIA.MAX_SAFE) {
      alerts.dia = true;
      triggerAlert = true;
    }
  }

  return {
    triggerAlert,
    alerts,
  };
}

/**
 * Generates physiological pulse jitter (-1, 0, +1 bpm).
 *
 * @param {number} baseBpm - Baseline heart rate
 * @returns {number} Jittered heart rate
 */
export function applyBpmJitter(baseBpm) {
  const num = Number(baseBpm) || 0;
  const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
  return Math.max(0, num + variation);
}
