/**
 * Logic for the Aeros Pilote (Instructor) Control Panel.
 */

import { SIMULATION_CONFIG } from './constants.js';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');

  if (!roomCode) {
    window.location.href = 'index.html';
    return;
  }

  const displayRoomEl = document.getElementById('display-room');
  if (displayRoomEl) {
    displayRoomEl.textContent = roomCode;
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
      const srvBpm = document.getElementById('srv-bpm');
      const srvSpo2 = document.getElementById('srv-spo2');
      const srvSys = document.getElementById('srv-sys');
      const srvDia = document.getElementById('srv-dia');

      if (srvBpm) {
        srvBpm.textContent = data.bpm;
      }
      if (srvSpo2) {
        srvSpo2.textContent = data.spo2;
      }
      if (srvSys) {
        srvSys.textContent = data.sys;
      }
      if (srvDia) {
        srvDia.textContent = data.dia;
      }
    });
  }

  // Slider & Number input synchronization helper
  const syncPairs = ['bpm', 'spo2', 'sys', 'dia'];

  syncPairs.forEach(id => {
    const numInput = document.getElementById(id);
    const sliderInput = document.getElementById(`${id}-slider`);

    if (numInput && sliderInput) {
      numInput.addEventListener('input', () => {
        sliderInput.value = numInput.value;
      });

      sliderInput.addEventListener('input', () => {
        numInput.value = sliderInput.value;
      });
    }
  });

  // Transmit Data to Monitor
  const btnUpdate = document.getElementById('btn-update');

  function sendData() {
    const bpmInput = document.getElementById('bpm');
    const spo2Input = document.getElementById('spo2');
    const sysInput = document.getElementById('sys');
    const diaInput = document.getElementById('dia');

    const data = {
      bpm: Number(bpmInput?.value) || 80,
      spo2: Number(spo2Input?.value) || 98,
      sys: Number(sysInput?.value) || 120,
      dia: Number(diaInput?.value) || 80,
    };

    if (socket) {
      socket.emit('sendData', data);
    }

    if (btnUpdate) {
      const originalText = btnUpdate.textContent;
      btnUpdate.classList.add('is-transmitted');
      btnUpdate.textContent = 'TRANSMIS ✓';

      setTimeout(() => {
        btnUpdate.classList.remove('is-transmitted');
        btnUpdate.textContent = originalText;
      }, SIMULATION_CONFIG.TRANSMIT_FEEDBACK_DURATION_MS);
    }
  }

  if (btnUpdate) {
    btnUpdate.addEventListener('click', sendData);
  }
});
