/**
 * Logic for the Aeros Monitor (Student Display) Simulator.
 */

import { AudioManager } from './audio-manager.js';
import { SIMULATION_CONFIG } from './constants.js';
import { calculateMAP, evaluateAlerts, applyBpmJitter } from '/src/services/vitalsService.js';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');

  if (!roomCode) {
    window.location.href = 'index.html';
    return;
  }

  // Display room code
  const displayRoomEl = document.getElementById('display-room');
  if (displayRoomEl) {
    displayRoomEl.textContent = roomCode;
  }

  // Audio Manager Setup
  const audioManager = new AudioManager({
    cuffAudioEl: document.getElementById('audio-cuff'),
    alertAudioEl: document.getElementById('alert-player'),
  });

  // DOM Elements Cache
  const els = {
    bpm: document.getElementById('bpm-disp'),
    spo2: document.getElementById('spo2-disp'),
    sys: document.getElementById('sys-disp'),
    dia: document.getElementById('dia-disp'),
    map: document.getElementById('map-disp'),
    heartIcon: document.getElementById('heart-icon'),
    spo2Wave: document.getElementById('spo2-wave'),
    btnSpo2: document.getElementById('btn-spo2'),
    btnOne: document.getElementById('btn-oneshot'),
    btnCont: document.getElementById('btn-continue'),
    btnStop: document.getElementById('btn-stop'),
    btnMute: document.getElementById('btn-mute'),
    btnFs: document.getElementById('btn-fs'),
    clock: document.getElementById('clock'),
  };

  // State
  let serverBuffer = { bpm: '--', spo2: '--', sys: '--', dia: '--' };
  let isSpo2Monitoring = false;
  let isNibpAnalyzing = false;
  let isContinuous = false;
  let isNibpMeasured = false;
  let beepInterval = null;
  let bpmVariationInterval = null;
  let countdownTimer = null;

  // Live Clock Update
  function updateClock() {
    if (els.clock) {
      const now = new Date();
      els.clock.textContent = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Fullscreen toggle
  if (els.btnFs) {
    els.btnFs.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  // Mute button toggle
  if (els.btnMute) {
    els.btnMute.addEventListener('click', () => {
      const isMuted = audioManager.toggleMute();
      if (isMuted) {
        els.btnMute.classList.add('muted');
        els.btnMute.textContent = '🔇';
        els.btnMute.setAttribute('aria-label', 'Activer le son');
      } else {
        els.btnMute.classList.remove('muted');
        els.btnMute.textContent = '🔊';
        els.btnMute.setAttribute('aria-label', 'Couper le son');
      }
    });
  }

  // Socket.IO Connection
  const socket = window.io ? window.io() : null;
  if (socket) {
    socket.on('connect', () => {
      socket.emit('joinRoom', roomCode);
    });

    socket.on('updateParams', data => {
      if (!data) {
        return;
      }
      serverBuffer = { ...data };

      // If SpO2 is currently active, update display in real time
      if (isSpo2Monitoring) {
        els.spo2.textContent = serverBuffer.spo2;
        els.bpm.textContent = serverBuffer.bpm;
        updateBeepInterval();
        checkAlerts(false);
      }
    });
  }

  // Animation updates (heart beat and waveform)
  function updateAnimations() {
    if (isSpo2Monitoring) {
      els.heartIcon?.classList.add('heart-active');
      els.spo2Wave?.classList.add('wave-visible');
    } else {
      els.heartIcon?.classList.remove('heart-active');
      els.spo2Wave?.classList.remove('wave-visible');
    }
  }

  // Audio beep synchronized with Heart Rate
  function updateBeepInterval() {
    if (beepInterval) {
      clearInterval(beepInterval);
      beepInterval = null;
    }

    if (!isSpo2Monitoring) {
      return;
    }

    const currentBpm = parseInt(els.bpm?.textContent, 10) || parseInt(serverBuffer.bpm, 10);
    if (!currentBpm || isNaN(currentBpm) || currentBpm <= 0) {
      return;
    }

    const intervalMs = Math.max(200, (60 / currentBpm) * 1000);
    audioManager.playPulseBeep();
    beepInterval = setInterval(() => {
      if (isSpo2Monitoring) {
        audioManager.playPulseBeep();
      }
    }, intervalMs);
  }

  function stopBeeping() {
    if (beepInterval) {
      clearInterval(beepInterval);
      beepInterval = null;
    }
  }

  // Pulse subtle physiological jitter
  function startBpmVariation() {
    stopBpmVariation();
    bpmVariationInterval = setInterval(() => {
      if (isSpo2Monitoring && serverBuffer.bpm !== '--') {
        const baseBpm = parseInt(serverBuffer.bpm, 10);
        const jitteredBpm = applyBpmJitter(baseBpm);
        if (els.bpm) {
          els.bpm.textContent = jitteredBpm;
        }
        updateBeepInterval();
        checkAlerts(false);
      }
    }, SIMULATION_CONFIG.PULSE_JITTER_INTERVAL_MS);
  }

  function stopBpmVariation() {
    if (bpmVariationInterval) {
      clearInterval(bpmVariationInterval);
      bpmVariationInterval = null;
    }
  }

  // Alert Checking
  // fromNibp = true : déclenché uniquement lors d'une prise de tension (la tension peut sonner).
  // fromNibp = false : déclenché par SpO2 / variation de pouls (la tension ne sonne pas).
  function checkAlerts(fromNibp = false) {
    const currentVitals = {
      bpm: els.bpm?.textContent !== '--' ? els.bpm?.textContent : serverBuffer.bpm,
      spo2: els.spo2?.textContent !== '--' ? els.spo2?.textContent : serverBuffer.spo2,
      sys: serverBuffer.sys,
      dia: serverBuffer.dia,
    };

    const evaluation = evaluateAlerts({
      vitals: currentVitals,
      isSpo2Active: isSpo2Monitoring,
      fromNibp: fromNibp,
    });

    // Alertes visuelles SpO2 et Fréquence cardiaque
    els.bpm?.classList.toggle('alert-active', evaluation.alerts.bpm);
    els.spo2?.classList.toggle('alert-active', evaluation.alerts.spo2);

    // Le rouge de la tension n'est recalculé qu'au moment d'une prise de tension
    if (fromNibp) {
      els.sys?.classList.toggle('alert-active', evaluation.alerts.sys);
      els.dia?.classList.toggle('alert-active', evaluation.alerts.dia);
    }

    if (evaluation.triggerAlert) {
      audioManager.playAlarm();
    } else {
      audioManager.stopAlarm();
    }
  }

  // SpO2 Sensor Activation Logic
  function startSpo2() {
    if (!els.btnSpo2) {
      return;
    }
    els.btnSpo2.textContent = 'Capteur...';
    els.btnSpo2.classList.add('active-spo2');
    if (els.btnStop) {
      els.btnStop.disabled = false;
    }

    setTimeout(() => {
      isSpo2Monitoring = true;
      els.btnSpo2.textContent = 'SpO2 Stop';

      if (els.spo2) {
        els.spo2.textContent = serverBuffer.spo2;
        els.spo2.classList.remove('value-blur');
      }
      if (els.bpm) {
        els.bpm.textContent = serverBuffer.bpm;
        els.bpm.classList.remove('value-blur');
      }

      updateAnimations();
      checkAlerts(false);
      startBpmVariation();
      updateBeepInterval();
    }, SIMULATION_CONFIG.SPO2_CONNECT_DURATION_MS);
  }

  function stopSpo2() {
    isSpo2Monitoring = false;
    if (els.btnSpo2) {
      els.btnSpo2.textContent = 'SpO2 + Pouls';
      els.btnSpo2.classList.remove('active-spo2');
    }

    stopBpmVariation();
    stopBeeping();

    if (els.spo2) {
      els.spo2.textContent = '--';
      els.spo2.classList.add('value-blur');
      els.spo2.classList.remove('alert-active');
    }

    if (!isNibpAnalyzing && !isNibpMeasured) {
      if (els.bpm) {
        els.bpm.textContent = '--';
        els.bpm.classList.add('value-blur');
        els.bpm.classList.remove('alert-active');
      }
    }

    updateAnimations();
    checkAlerts(false);

    if (!isContinuous && !isNibpAnalyzing && els.btnStop) {
      els.btnStop.disabled = true;
    }
  }

  if (els.btnSpo2) {
    els.btnSpo2.addEventListener('click', () => {
      if (!isSpo2Monitoring) {
        startSpo2();
      } else {
        stopSpo2();
      }
    });
  }

  // NIBP Display Updater
  function updateDisplayTensionOnly() {
    [els.sys, els.dia, els.map].forEach(el => {
      el?.classList.remove('value-blur');
      el?.classList.add('value-visible');
    });

    if (!isSpo2Monitoring && els.bpm) {
      els.bpm.classList.remove('value-blur');
      els.bpm.textContent = serverBuffer.bpm;
    }

    if (els.sys) {
      els.sys.textContent = serverBuffer.sys;
    }
    if (els.dia) {
      els.dia.textContent = serverBuffer.dia;
    }

    if (els.map && serverBuffer.sys !== '--' && serverBuffer.dia !== '--') {
      const mapVal = calculateMAP(serverBuffer.sys, serverBuffer.dia);
      els.map.textContent = mapVal !== null ? mapVal : '--';
    }
  }

  // Measurement Execution
  function performMeasurement() {
    audioManager.playCuffSound();
    isNibpAnalyzing = true;

    if (els.sys) {
      els.sys.style.opacity = '0.5';
    }
    if (els.dia) {
      els.dia.style.opacity = '0.5';
    }

    setTimeout(() => {
      isNibpAnalyzing = false;
      isNibpMeasured = true;

      audioManager.playNibpBeep();
      updateDisplayTensionOnly();

      if (els.sys) {
        els.sys.style.opacity = '1';
      }
      if (els.dia) {
        els.dia.style.opacity = '1';
      }

      // La prise de tension s'achève : évaluation explicite de la tension (fromNibp = true)
      checkAlerts(true);

      if (!isContinuous) {
        els.btnOne?.classList.remove('active-btn');
        if (!isSpo2Monitoring && els.btnStop) {
          els.btnStop.disabled = true;
        }
      }
    }, SIMULATION_CONFIG.NIBP_DURATION_MS);
  }

  // Countdown timer for automatic cycles
  function startCycleCountdown(durationSeconds) {
    let timeLeft = durationSeconds;
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }

    countdownTimer = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(countdownTimer);
        if (isContinuous) {
          performMeasurement();
          startCycleCountdown(SIMULATION_CONFIG.NIBP_CYCLE_INTERVAL_SEC);
        }
      }
    }, 1000);
  }

  function stopCycleTension() {
    isContinuous = false;
    isNibpAnalyzing = false;
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }

    els.btnCont?.classList.remove('active-mode');
    els.btnOne?.classList.remove('active-btn');
    audioManager.stopCuffSound();

    if (els.sys) {
      els.sys.style.opacity = '1';
      els.sys.classList.remove('alert-active');
    }
    if (els.dia) {
      els.dia.style.opacity = '1';
      els.dia.classList.remove('alert-active');
    }

    checkAlerts(false);
  }

  // Button Listeners for NIBP
  if (els.btnOne) {
    els.btnOne.addEventListener('click', () => {
      stopCycleTension();
      els.btnOne.classList.add('active-btn');
      if (els.btnStop) {
        els.btnStop.disabled = false;
      }
      performMeasurement();
    });
  }

  if (els.btnCont) {
    els.btnCont.addEventListener('click', () => {
      stopCycleTension();
      isContinuous = true;
      if (els.btnStop) {
        els.btnStop.disabled = false;
      }
      els.btnCont.classList.add('active-mode');
      performMeasurement();
      startCycleCountdown(SIMULATION_CONFIG.NIBP_CYCLE_INTERVAL_SEC);
    });
  }

  if (els.btnStop) {
    els.btnStop.addEventListener('click', () => {
      stopCycleTension();
      stopSpo2();
      els.btnStop.disabled = true;
    });
  }
});
