import { describe, it, expect } from 'vitest';
import {
  calculateMAP,
  evaluateAlerts,
  validateVitals,
  applyBpmJitter,
} from '../src/services/vitalsService.js';
import { MEDICAL_THRESHOLDS, DEFAULT_VITALS } from '../src/constants/medical.js';

describe('Vitals Service', () => {
  describe('calculateMAP (Mean Arterial Pressure)', () => {
    it('calculates MAP correctly for normal values (120/80)', () => {
      // (120 + 2*80)/3 = (120 + 160)/3 = 280/3 = 93.33 -> 93
      expect(calculateMAP(120, 80)).toBe(93);
    });

    it('calculates MAP correctly for hypertension (160/100)', () => {
      // (160 + 200)/3 = 360/3 = 120
      expect(calculateMAP(160, 100)).toBe(120);
    });

    it('handles numeric string inputs cleanly', () => {
      expect(calculateMAP('120', '80')).toBe(93);
    });

    it('returns null if inputs are invalid or missing', () => {
      expect(calculateMAP('--', '--')).toBeNull();
      expect(calculateMAP(null, 80)).toBeNull();
      expect(calculateMAP(undefined, undefined)).toBeNull();
      expect(calculateMAP('abc', 80)).toBeNull();
    });
  });

  describe('validateVitals', () => {
    it('validates and sanitizes standard valid payload', () => {
      const input = { bpm: '80', spo2: '98', sys: '120', dia: '80' };
      const result = validateVitals(input);
      expect(result).toEqual({
        bpm: 80,
        spo2: 98,
        sys: 120,
        dia: 80,
      });
    });

    it('clamps values within acceptable physiological ranges', () => {
      const input = { bpm: 999, spo2: 150, sys: 300, dia: 10 };
      const result = validateVitals(input);
      expect(result.bpm).toBe(MEDICAL_THRESHOLDS.BPM.MAX_INPUT);
      expect(result.spo2).toBe(MEDICAL_THRESHOLDS.SPO2.MAX_INPUT);
      expect(result.sys).toBe(MEDICAL_THRESHOLDS.SYS.MAX_INPUT);
      expect(result.dia).toBe(MEDICAL_THRESHOLDS.DIA.MIN_INPUT);
    });

    it('falls back to default vitals for completely invalid inputs', () => {
      expect(validateVitals(null)).toEqual(DEFAULT_VITALS);
      expect(validateVitals({})).toEqual(DEFAULT_VITALS);
      expect(validateVitals('invalid')).toEqual(DEFAULT_VITALS);
    });
  });

  describe('evaluateAlerts', () => {
    it('returns no alerts for normal values', () => {
      const vitals = { bpm: 75, spo2: 98, sys: 120, dia: 80 };
      const result = evaluateAlerts({
        vitals,
        isSpo2Active: true,
        isNibpMeasured: true,
      });

      expect(result.triggerAlert).toBe(false);
      expect(result.alerts).toEqual({
        bpm: false,
        spo2: false,
        sys: false,
        dia: false,
      });
    });

    it('triggers SpO2 alarm when saturation is below 95%', () => {
      const vitals = { bpm: 75, spo2: 92, sys: 120, dia: 80 };
      const result = evaluateAlerts({
        vitals,
        isSpo2Active: true,
        isNibpMeasured: false,
      });

      expect(result.triggerAlert).toBe(true);
      expect(result.alerts.spo2).toBe(true);
    });

    it('does not trigger SpO2 alarm if SpO2 sensor is inactive', () => {
      const vitals = { bpm: 75, spo2: 90, sys: 120, dia: 80 };
      const result = evaluateAlerts({
        vitals,
        isSpo2Active: false,
        isNibpMeasured: false,
      });

      expect(result.triggerAlert).toBe(false);
      expect(result.alerts.spo2).toBe(false);
    });

    it('triggers Bradycardia / Tachycardia alerts correctly', () => {
      const tachy = evaluateAlerts({
        vitals: { bpm: 110, spo2: 99, sys: 120, dia: 80 },
        isSpo2Active: true,
      });
      expect(tachy.triggerAlert).toBe(true);
      expect(tachy.alerts.bpm).toBe(true);

      const brady = evaluateAlerts({
        vitals: { bpm: 45, spo2: 99, sys: 120, dia: 80 },
        isSpo2Active: true,
      });
      expect(brady.triggerAlert).toBe(true);
      expect(brady.alerts.bpm).toBe(true);
    });

    it('triggers NIBP alert when blood pressure is abnormal after measurement', () => {
      const hypo = evaluateAlerts({
        vitals: { bpm: 75, spo2: 98, sys: 90, dia: 55 },
        isSpo2Active: true,
        isNibpMeasured: true,
      });
      expect(hypo.triggerAlert).toBe(true);
      expect(hypo.alerts.sys).toBe(true);
      expect(hypo.alerts.dia).toBe(true);
    });
  });

  describe('applyBpmJitter', () => {
    it('applies subtle variation (-1, 0, or +1)', () => {
      const base = 80;
      for (let i = 0; i < 50; i++) {
        const jittered = applyBpmJitter(base);
        expect(jittered).toBeGreaterThanOrEqual(base - 1);
        expect(jittered).toBeLessThanOrEqual(base + 1);
      }
    });

    it('does not drop below 0', () => {
      const jittered = applyBpmJitter(0);
      expect(jittered).toBeGreaterThanOrEqual(0);
    });
  });
});
