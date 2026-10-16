import { todasPreguntas } from './banco.js';
import { evaluar } from './calificar.js';
import { APP_BUILD, APP_VERSION } from './config.js';
import { parsearTexto } from './documentos/parser.js';
import { iniciarRegistroErrores } from './errores.js';
import { S } from './estado.js';
import { iniciarEventos } from './eventos.js';
import { logoSVG } from './logo.js';
import { opcionesPara } from './opciones.js';
import { iniciarActualizaciones } from './pwa/actualizaciones.js';
import { iniciarInstalacion } from './pwa/instalacion.js';
import { iniciarCronometros } from './reloj.js';
import { aplicarTema, registrarPaginas, render, VISTAS } from './ui.js';
import { $ } from './util.js';
import { renderConcurso } from './vistas/concurso.js';
import { renderCultura } from './vistas/cultura.js';
import { bancoExportable, renderDocumentos } from './vistas/documentos.js';
import { renderEstudio } from './vistas/estudio.js';
import { renderInicio } from './vistas/inicio.js';

/* ---------- arranque de Lobitos ----------
   Punto de entrada: registra las páginas, conecta eventos y pinta la vista inicial.
   Desarrollado por el Ing. Luis Angel Díaz Bernal. */
document.documentElement.lang = 'es';
iniciarRegistroErrores();
registrarPaginas({ inicio: renderInicio, concurso: renderConcurso, estudio: renderEstudio, cultura: renderCultura, documentos: renderDocumentos });
iniciarEventos();
iniciarCronometros();
iniciarInstalacion();
iniciarActualizaciones();
aplicarTema();
$('#logo-mini').innerHTML = logoSVG(40);
const ancla = (location.hash || '').slice(1);
if (VISTAS.some(([id]) => id === ancla)) S.vista = ancla;
render();

// Expuesto para pruebas y depuración desde la consola.
window.Lobitos = { evaluar, opcionesPara, todasPreguntas, parsearTexto, banco: () => bancoExportable(), APP_VERSION, APP_BUILD };
