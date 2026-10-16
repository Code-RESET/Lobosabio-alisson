/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const barajar = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const uid = () => Math.random().toString(36).slice(2, 8);
const almacen = {
  get(k, d) { try { const v = localStorage.getItem('loboquiz:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('loboquiz:' + k, JSON.stringify(v)); } catch (e) { /* almacenamiento no disponible */ } }
};

export { $, $$, almacen, barajar, esc, uid };
