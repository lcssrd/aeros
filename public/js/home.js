/**
 * Logic for the Aeros home portal page.
 */

document.addEventListener('DOMContentLoaded', () => {
  const roomInput = document.getElementById('room-code');
  const btnMonitor = document.getElementById('btn-join-monitor');
  const btnPilote = document.getElementById('btn-join-pilote');

  if (roomInput && !roomInput.value) {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    roomInput.value = randomCode;
  }

  function join(page) {
    if (!roomInput) {
      return;
    }
    const code = roomInput.value.trim();

    if (!code) {
      roomInput.classList.add('input-error', 'is-shaking');
      setTimeout(() => {
        roomInput.classList.remove('is-shaking');
      }, 400);
      return;
    }

    window.location.href = `${page}?room=${encodeURIComponent(code)}`;
  }

  if (btnMonitor) {
    btnMonitor.addEventListener('click', e => {
      e.preventDefault();
      join('monitor.html');
    });
  }

  if (btnPilote) {
    btnPilote.addEventListener('click', e => {
      e.preventDefault();
      join('pilote.html');
    });
  }

  if (roomInput) {
    roomInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        join('monitor.html');
      }
    });

    roomInput.addEventListener('input', () => {
      roomInput.classList.remove('input-error');
    });
  }
});
