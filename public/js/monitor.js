/**
 * Logic for the Aeros A100 Vital Signs Monitor.
 * Fully synchronized with the instructor pilot.
 */

import { AudioManager } from './audio-manager.js';
import { SIMULATION_CONFIG } from './constants.js';
import { calculateMAP, evaluateAlerts, applyBpmJitter } from '/src/services/vitalsService.js';

// 7-Segment SVG Segment Definition
const SEGMENTS_LOOKUP = {
  0: ['a', 'b', 'c', 'd', 'e', 'f'],
  1: ['b', 'c'],
  2: ['a', 'b', 'g', 'e', 'd'],
  3: ['a', 'b', 'g', 'c', 'd'],
  4: ['f', 'g', 'b', 'c'],
  5: ['a', 'f', 'g', 'c', 'd'],
  6: ['a', 'f', 'g', 'e', 'c', 'd'],
  7: ['a', 'b', 'c'],
  8: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  9: ['a', 'b', 'c', 'd', 'f', 'g'],
  '-': ['g'],
  ' ': [], // unlit digit with visible faint ghost segments
};

function generateDigitSVG(char, size = 'large') {
  const activeSegs = SEGMENTS_LOOKUP[char] || [];
  const isLit = s => (activeSegs.includes(s) ? 'seg-on' : 'seg-off');
  const sizeClass = size === 'small' ? 'small' : size === 'medium' ? 'medium' : 'large';

  return `
    <svg class="seg-digit-svg ${sizeClass}" viewBox="0 0 42 70" xmlns="http://www.w3.org/2000/svg" style="transform: skewX(-4deg);">
      <!-- a: top horizontal -->
      <polygon class="${isLit('a')}" points="8,4 32,4 27,10 13,10" />
      <!-- b: top right vertical -->
      <polygon class="${isLit('b')}" points="33,5 37,9 34,31 29,27 29,11" />
      <!-- c: bottom right vertical -->
      <polygon class="${isLit('c')}" points="34,37 37,41 33,63 29,57 29,41" />
      <!-- d: bottom horizontal -->
      <polygon class="${isLit('d')}" points="13,58 27,58 32,64 8,64" />
      <!-- e: bottom left vertical -->
      <polygon class="${isLit('e')}" points="11,41 11,57 7,63 3,41 6,37" />
      <!-- f: top left vertical -->
      <polygon class="${isLit('f')}" points="11,11 11,27 6,31 3,9 7,5" />
      <!-- g: middle horizontal -->
      <polygon class="${isLit('g')}" points="8,34 12,30 28,30 32,34 28,38 12,38" />
    </svg>
  `;
}

function renderCluster(elementId, valueStr, totalDigits = 3, size = 'large') {
  const el = document.getElementById(elementId);
  if (!el) {
    return;
  }

  const padded = (valueStr !== undefined && valueStr !== null ? valueStr.toString() : '').padStart(
    totalDigits,
    ' '
  );
  let html = '';
  for (const ch of padded) {
    html += generateDigitSVG(ch, size);
  }
  el.innerHTML = html;
}

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
    chassis: document.getElementById('v100-chassis'),
    clock: document.getElementById('clock'),
    btnFs: document.getElementById('btn-fs'),
    btnMuteTop: document.getElementById('btn-mute-top'),
    btnSilence: document.getElementById('btn-silence'),
    btnStopHw: document.getElementById('btn-stop-hw'),
    btnPlus: document.getElementById('btn-plus'),
    btnMinus: document.getElementById('btn-minus'),
    btnMenu: document.getElementById('btn-menu'),
    btnInflate: document.getElementById('btn-inflate'),
    btnCycle: document.getElementById('btn-cycle'),
    btnSpo2Hw: document.getElementById('btn-spo2-hw'),
    btnOnoff: document.getElementById('btn-onoff'),
    portSpo2: document.getElementById('port-spo2'),
    portNibp: document.getElementById('port-nibp'),
    boxSys: document.getElementById('box-sys'),
    boxDia: document.getElementById('box-dia'),
    boxMap: document.getElementById('box-map'),
    boxPulse: document.getElementById('box-pulse'),
    boxSpo2: document.getElementById('box-spo2'),
    boxHist: document.getElementById('box-hist'),
    pulseBargraph: document.getElementById('pulse-bargraph'),
  };

  // State
  let serverBuffer = { bpm: '--', spo2: '--', sys: '--', dia: '--' };
  let isPowered = true;
  let isSpo2Monitoring = false;
  let isNibpAnalyzing = false;
  let isContinuous = false;
  let isNibpMeasured = false;
  let beepInterval = null;
  let bpmVariationInterval = null;
  let countdownTimer = null;
  let cuffPressureTimer = null;
  let elapsedMinutes = 0;
  let historyElapsedInterval = null;

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

  // Mute toggle (syncs both the top toolbar button and the physical Silence button)
  function handleToggleMute() {
    const isMuted = audioManager.toggleMute();
    if (isMuted) {
      els.btnMuteTop?.classList.add('muted');
      if (els.btnMuteTop) {
        els.btnMuteTop.textContent = '🔇';
      }
      els.btnSilence?.classList.add('muted-state');
    } else {
      els.btnMuteTop?.classList.remove('muted');
      if (els.btnMuteTop) {
        els.btnMuteTop.textContent = '🔊';
      }
      els.btnSilence?.classList.remove('muted-state');
    }
  }

  if (els.btnMuteTop) {
    els.btnMuteTop.addEventListener('click', handleToggleMute);
  }
  if (els.btnSilence) {
    els.btnSilence.addEventListener('click', () => {
      flashKey(els.btnSilence);
      handleToggleMute();
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
        renderCluster('cluster-spo2', serverBuffer.spo2, 3, 'medium');
        renderCluster('cluster-pulse', serverBuffer.bpm, 3, 'medium');
        updateBeepInterval();
        checkAlerts(false);
      }
    });
  }

  // Green LED Pulse Bargraph Animation (Plethysmograph Wave)
  function triggerPulseBeatVisual() {
    if (!isSpo2Monitoring || !els.pulseBargraph) {
      return;
    }
    const segs = els.pulseBargraph.querySelectorAll('.pulse-bar-seg');
    if (!segs || segs.length === 0) {
      return;
    }

    const totalSegs = segs.length; // 8
    const peakLevel = 7 + (Math.random() > 0.4 ? 1 : 0);

    // Instant Systolic upstroke
    segs.forEach((seg, idx) => {
      const segLevel = totalSegs - idx;
      if (segLevel <= peakLevel) {
        seg.classList.add('lit');
      } else {
        seg.classList.remove('lit');
      }
    });

    // Diastolic gradual decay
    setTimeout(() => {
      if (!isSpo2Monitoring) {
        return;
      }
      segs.forEach((seg, idx) => {
        const segLevel = totalSegs - idx;
        if (segLevel > 5) {
          seg.classList.remove('lit');
        }
      });
    }, 90);

    setTimeout(() => {
      if (!isSpo2Monitoring) {
        return;
      }
      segs.forEach((seg, idx) => {
        const segLevel = totalSegs - idx;
        if (segLevel > 3) {
          seg.classList.remove('lit');
        }
      });
    }, 180);

    setTimeout(() => {
      if (!isSpo2Monitoring) {
        return;
      }
      segs.forEach((seg, idx) => {
        const segLevel = totalSegs - idx;
        if (segLevel > 1) {
          seg.classList.remove('lit');
        }
      });
    }, 280);

    setTimeout(() => {
      if (!isSpo2Monitoring) {
        return;
      }
      segs.forEach(seg => seg.classList.remove('lit'));
    }, 380);
  }

  function clearPulseBargraph() {
    if (!els.pulseBargraph) {
      return;
    }
    const segs = els.pulseBargraph.querySelectorAll('.pulse-bar-seg');
    segs.forEach(seg => seg.classList.remove('lit'));
  }

  // Audio beep synchronized with Heart Rate (Oximeter tone) & Pulse Bargraph
  function updateBeepInterval() {
    if (beepInterval) {
      clearInterval(beepInterval);
      beepInterval = null;
    }

    if (!isSpo2Monitoring) {
      return;
    }

    const currentBpm = parseInt(serverBuffer.bpm, 10);
    if (!currentBpm || isNaN(currentBpm) || currentBpm <= 0) {
      return;
    }

    const intervalMs = Math.max(200, (60 / currentBpm) * 1000);
    audioManager.playPulseBeep();
    triggerPulseBeatVisual();
    beepInterval = setInterval(() => {
      if (isSpo2Monitoring) {
        audioManager.playPulseBeep();
        triggerPulseBeatVisual();
      }
    }, intervalMs);
  }

  function stopBeeping() {
    if (beepInterval) {
      clearInterval(beepInterval);
      beepInterval = null;
    }
  }

  // Pulse physiological subtle variation
  function startBpmVariation() {
    stopBpmVariation();
    bpmVariationInterval = setInterval(() => {
      if (isSpo2Monitoring && serverBuffer.bpm !== '--') {
        const baseBpm = parseInt(serverBuffer.bpm, 10);
        const jitteredBpm = applyBpmJitter(baseBpm);
        renderCluster('cluster-pulse', jitteredBpm, 3, 'medium');
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

  // Alert Evaluation & Visual Warning
  function checkAlerts(fromNibp = false) {
    const currentVitals = {
      bpm: serverBuffer.bpm,
      spo2: serverBuffer.spo2,
      sys: serverBuffer.sys,
      dia: serverBuffer.dia,
    };

    const evaluation = evaluateAlerts({
      vitals: currentVitals,
      isSpo2Active: isSpo2Monitoring,
      fromNibp: fromNibp,
    });

    // Visual Alert Flashing on SpO2 and Pulse Rate clusters
    els.boxPulse?.classList.toggle('alert-active', evaluation.alerts.bpm);
    els.boxSpo2?.classList.toggle('alert-active', evaluation.alerts.spo2);

    // Blood Pressure alerts only evaluated after measurement
    if (fromNibp) {
      els.boxSys?.classList.toggle('alert-active', evaluation.alerts.sys);
      els.boxDia?.classList.toggle('alert-active', evaluation.alerts.dia);
    }

    if (evaluation.triggerAlert) {
      audioManager.playAlarm();
    } else {
      audioManager.stopAlarm();
    }
  }

  // SpO2 Sensor Connect / Disconnect
  function startSpo2() {
    els.btnSpo2Hw?.classList.add('active-spo2');

    // Show faint connecting state
    renderCluster('cluster-spo2', '   ', 3, 'medium');
    renderCluster('cluster-pulse', '   ', 3, 'medium');

    setTimeout(() => {
      isSpo2Monitoring = true;
      renderCluster('cluster-spo2', serverBuffer.spo2, 3, 'medium');
      renderCluster('cluster-pulse', serverBuffer.bpm, 3, 'medium');

      checkAlerts(false);
      startBpmVariation();
      updateBeepInterval();
    }, SIMULATION_CONFIG.SPO2_CONNECT_DURATION_MS);
  }

  function stopSpo2() {
    isSpo2Monitoring = false;
    els.btnSpo2Hw?.classList.remove('active-spo2');

    stopBpmVariation();
    stopBeeping();
    clearPulseBargraph();

    renderCluster('cluster-spo2', '   ', 3, 'medium');
    els.boxSpo2?.classList.remove('alert-active');

    if (!isNibpAnalyzing && !isNibpMeasured) {
      renderCluster('cluster-pulse', '   ', 3, 'medium');
      els.boxPulse?.classList.remove('alert-active');
    }

    checkAlerts(false);
  }

  if (els.btnSpo2Hw) {
    els.btnSpo2Hw.addEventListener('click', () => {
      flashKey(els.btnSpo2Hw);
      if (!isSpo2Monitoring) {
        startSpo2();
      } else {
        stopSpo2();
      }
    });
  }
  if (els.portSpo2) {
    els.portSpo2.addEventListener('click', () => {
      if (!isSpo2Monitoring) {
        startSpo2();
      } else {
        stopSpo2();
      }
    });
  }

  // Update Tension Displays
  function updateDisplayTensionOnly() {
    renderCluster('cluster-sys', serverBuffer.sys, 3, 'large');
    renderCluster('cluster-dia', serverBuffer.dia, 3, 'large');

    if (serverBuffer.sys !== '--' && serverBuffer.dia !== '--') {
      const mapVal = calculateMAP(serverBuffer.sys, serverBuffer.dia);
      renderCluster('cluster-map', mapVal !== null ? mapVal : '--', 3, 'medium');
    }

    if (!isSpo2Monitoring && serverBuffer.bpm !== '--') {
      renderCluster('cluster-pulse', serverBuffer.bpm, 3, 'medium');
    }

    // Reset History Elapsed Display to 0 min
    elapsedMinutes = 0;
    renderCluster('cluster-hist', '- 0', 3, 'small');
    startHistoryTimer();
  }

  function startHistoryTimer() {
    if (historyElapsedInterval) {
      clearInterval(historyElapsedInterval);
    }
    historyElapsedInterval = setInterval(() => {
      if (isNibpMeasured) {
        elapsedMinutes++;
        renderCluster('cluster-hist', `-${elapsedMinutes}`, 3, 'small');
      }
    }, 60000);
  }

  // NIBP Measurement Execution (with dynamic cuff pressure animation)
  function performMeasurement() {
    audioManager.playCuffSound();
    isNibpAnalyzing = true;
    els.chassis?.classList.add('pumping');
    els.btnInflate?.classList.add('measuring');

    // Dim previous reading during inflation
    if (els.boxSys) {
      els.boxSys.style.opacity = '0.4';
    }
    if (els.boxDia) {
      els.boxDia.style.opacity = '0.4';
    }

    let currentPressure = 0;
    const targetPressure =
      parseInt(serverBuffer.sys, 10) > 0 ? parseInt(serverBuffer.sys, 10) + 35 : 175;

    // Simulate realistic cuff inflation pressure rising on MAP/Cuff display
    cuffPressureTimer = setInterval(() => {
      currentPressure += 22;
      renderCluster('cluster-map', Math.min(targetPressure, currentPressure), 3, 'medium');
      if (currentPressure >= targetPressure) {
        clearInterval(cuffPressureTimer);
      }
    }, 150);

    setTimeout(() => {
      if (cuffPressureTimer) {
        clearInterval(cuffPressureTimer);
      }
      isNibpAnalyzing = false;
      isNibpMeasured = true;
      els.chassis?.classList.remove('pumping');
      els.btnInflate?.classList.remove('measuring');

      audioManager.playNibpBeep();
      updateDisplayTensionOnly();

      if (els.boxSys) {
        els.boxSys.style.opacity = '1';
      }
      if (els.boxDia) {
        els.boxDia.style.opacity = '1';
      }

      // Evaluate blood pressure alerts
      checkAlerts(true);
    }, SIMULATION_CONFIG.NIBP_DURATION_MS);
  }

  // Continuous Auto Cycle Countdown
  function startCycleCountdown(durationSeconds) {
    let timeLeft = durationSeconds;
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }

    countdownTimer = setInterval(() => {
      timeLeft--;
      const minLeft = Math.ceil(timeLeft / 60);
      renderCluster('cluster-hist', `-${minLeft}`, 3, 'small');

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
    if (cuffPressureTimer) {
      clearInterval(cuffPressureTimer);
      cuffPressureTimer = null;
    }

    els.btnCycle?.classList.remove('active-mode');
    els.btnInflate?.classList.remove('measuring');
    els.chassis?.classList.remove('pumping');
    audioManager.stopCuffSound();

    if (els.boxSys) {
      els.boxSys.style.opacity = '1';
      els.boxSys.classList.remove('alert-active');
    }
    if (els.boxDia) {
      els.boxDia.style.opacity = '1';
      els.boxDia.classList.remove('alert-active');
    }

    checkAlerts(false);
  }

  // Button Event Listeners for NIBP
  function handleOneShotNIBP() {
    if (isNibpAnalyzing) {
      stopCycleTension();
      return;
    }
    stopCycleTension();
    performMeasurement();
  }

  function handleAutoCycleNIBP() {
    if (isContinuous) {
      stopCycleTension();
      return;
    }
    stopCycleTension();
    isContinuous = true;
    els.btnCycle?.classList.add('active-mode');
    performMeasurement();
    startCycleCountdown(SIMULATION_CONFIG.NIBP_CYCLE_INTERVAL_SEC);
  }

  if (els.btnInflate) {
    els.btnInflate.addEventListener('click', () => {
      flashKey(els.btnInflate);
      handleOneShotNIBP();
    });
  }
  if (els.portNibp) {
    els.portNibp.addEventListener('click', handleOneShotNIBP);
  }

  if (els.btnCycle) {
    els.btnCycle.addEventListener('click', () => {
      flashKey(els.btnCycle);
      handleAutoCycleNIBP();
    });
  }

  function handleStopAll() {
    stopCycleTension();
    stopSpo2();
    audioManager.stopAlarm();
  }

  if (els.btnStopHw) {
    els.btnStopHw.addEventListener('click', () => {
      flashKey(els.btnStopHw);
      handleStopAll();
    });
  }

  // Power On/Off
  function togglePower() {
    isPowered = !isPowered;
    if (isPowered) {
      els.chassis?.classList.remove('power-off');
      if (isSpo2Monitoring) {
        renderCluster('cluster-spo2', serverBuffer.spo2, 3, 'medium');
        renderCluster('cluster-pulse', serverBuffer.bpm, 3, 'medium');
      }
      if (isNibpMeasured) {
        renderCluster('cluster-sys', serverBuffer.sys, 3, 'large');
        renderCluster('cluster-dia', serverBuffer.dia, 3, 'large');
      }
    } else {
      els.chassis?.classList.add('power-off');
      stopCycleTension();
      stopSpo2();
    }
  }

  if (els.btnOnoff) {
    els.btnOnoff.addEventListener('click', () => {
      flashKey(els.btnOnoff);
      togglePower();
    });
  }

  // Additional Hardware Buttons Interactive Feedback
  function flashKey(btn) {
    if (!btn) {
      return;
    }
    btn.classList.add('active');
    setTimeout(() => btn.classList.remove('active'), 140);
  }

  if (els.btnPlus) {
    els.btnPlus.addEventListener('click', () => {
      flashKey(els.btnPlus);
    });
  }

  if (els.btnMinus) {
    els.btnMinus.addEventListener('click', () => {
      flashKey(els.btnMinus);
    });
  }

  if (els.btnMenu) {
    els.btnMenu.addEventListener('click', () => flashKey(els.btnMenu));
  }

  // Initialize initial unlit/ghost display
  renderCluster('cluster-sys', '   ', 3, 'large');
  renderCluster('cluster-dia', '   ', 3, 'large');
  renderCluster('cluster-map', '   ', 3, 'medium');
  renderCluster('cluster-pulse', '   ', 3, 'medium');
  renderCluster('cluster-spo2', '   ', 3, 'medium');
  renderCluster('cluster-hist', '   ', 3, 'small');
});
