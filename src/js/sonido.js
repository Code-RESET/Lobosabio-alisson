import { S } from './estado.js';

/* ---------- sonido ---------- */
let audio;
function sonar(tipo) {
  if (!S.sonido) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const ahora = audio.currentTime;
    const tono = (f, t0, dur, forma = 'sine', vol = 0.16) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = forma; o.frequency.setValueAtTime(f, ahora + t0);
      g.gain.setValueAtTime(0.0001, ahora + t0); g.gain.exponentialRampToValueAtTime(vol, ahora + t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ahora + t0 + dur);
      o.connect(g).connect(audio.destination); o.start(ahora + t0); o.stop(ahora + t0 + dur + 0.05);
    };
    if (tipo === 'ok') { tono(880, 0, 0.18); tono(1320, 0.12, 0.35); }
    else if (tipo === 'mal') { tono(150, 0, 0.5, 'sawtooth', 0.12); tono(110, 0.05, 0.5, 'square', 0.06); }
    else if (tipo === 'casi') { tono(560, 0, 0.15, 'triangle'); }
    else if (tipo === 'fin') { [523, 659, 784, 1046].forEach((f, i) => tono(f, i * 0.11, 0.3, 'triangle', 0.12)); }
  } catch (e) { /* audio no disponible */ }
}

export { sonar };
