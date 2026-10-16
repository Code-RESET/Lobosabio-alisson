import { S } from './estado.js';
import { $$ } from './util.js';

/* ---------- relojes ---------- */
let relojId = null;
const relojActivo = () => relojId !== null;
function detenerRelojes() { if (relojId) { clearInterval(relojId); relojId = null; } }
// Cuenta regresiva hasta «fin» (por defecto, seg segundos desde ahora). Si fin ya pasó, termina de inmediato.
function iniciarReloj(seg, alTerminar, idBarra, idNum, fin = Date.now() + seg * 1000) {
  detenerRelojes();
  if (!seg) return null;
  const tick = () => {
    const rest = Math.max(0, fin - Date.now());
    const barra = document.getElementById(idBarra), num = document.getElementById(idNum);
    if (barra) { barra.firstElementChild.style.width = (rest / (seg * 1000) * 100) + '%'; barra.classList.toggle('urgente', rest < 5000); }
    if (num) num.textContent = Math.ceil(rest / 1000) + ' s';
    if (rest <= 0) { detenerRelojes(); alTerminar(); }
  };
  relojId = setInterval(tick, 200);
  requestAnimationFrame(tick);
  return fin;
}

/* ---------- cronómetro ---------- */
const msCrono = c => c ? c.acum + (c.desde ? Date.now() - c.desde : 0) : 0;
function fmtCrono(ms) {
  const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
const cronoCorrer = c => { if (c && !c.desde) c.desde = Date.now(); };
const cronoPausar = c => { if (c && c.desde) { c.acum += Date.now() - c.desde; c.desde = null; } };
// El cronómetro de estudio corre mientras practicas y se detiene solo al salir de Estudio o al abrir la Guía.
function gestionarCronos() {
  const c = S.estudio.crono;
  if (S.vista === 'estudio' && S.estudio.tab !== 'guia' && !c.pausadoUsuario) cronoCorrer(c); else cronoPausar(c);
}
// Actualiza en pantalla los cronómetros visibles y pausa el de estudio al cambiar de app.
function iniciarCronometros() {
  setInterval(() => {
    $$('[data-crono]').forEach(el => {
      const c = el.dataset.crono === 'cq' ? S.concurso?.crono : S.estudio.crono;
      el.textContent = fmtCrono(msCrono(c));
    });
  }, 500);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cronoPausar(S.estudio.crono); else gestionarCronos(); });
}

export { cronoCorrer, cronoPausar, detenerRelojes, fmtCrono, gestionarCronos, iniciarCronometros, iniciarReloj, msCrono, relojActivo };
