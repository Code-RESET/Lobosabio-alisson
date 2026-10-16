/* ---------- configuración ---------- */
// La versión sale de package.json y el build de la publicación (commit); los inyecta el paso de construcción.
/* global __APP_VERSION__, __APP_BUILD__ */
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
const APP_BUILD = typeof __APP_BUILD__ !== 'undefined' ? __APP_BUILD__ : 'local';

export { APP_BUILD, APP_VERSION };
