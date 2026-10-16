/* ---------- paginación ----------
   Divide listas largas (la guía completa, la vista previa de documentos) en páginas. */
const POR_PAGINA = 15;
function paginar(items, pagina = 1, tam = POR_PAGINA) {
  const paginas = Math.max(1, Math.ceil(items.length / tam));
  const p = Math.min(Math.max(1, Number(pagina) || 1), paginas);
  return {
    items: items.slice((p - 1) * tam, p * tam), pagina: p, paginas, total: items.length,
    desde: items.length ? (p - 1) * tam + 1 : 0, hasta: Math.min(p * tam, items.length)
  };
}
// Controles «‹ Anterior · 1–15 de 180 · Siguiente ›». La acción 'pagina' guarda la página en S.paginas[lista].
function controlesPaginacion(lista, pag) {
  if (pag.paginas <= 1) return '';
  const boton = (p, texto, etiqueta, off) => `<button type="button" class="btn btn-linea btn-sm" data-accion="pagina" data-lista="${lista}" data-p="${p}" aria-label="${etiqueta}" ${off ? 'disabled' : ''}>${texto}</button>`;
  return `<nav class="paginacion" aria-label="Páginas">
    ${boton(pag.pagina - 1, '‹ Anterior', 'Página anterior', pag.pagina <= 1)}
    <span class="text-sm tenue num text-center">${pag.desde}–${pag.hasta} de ${pag.total}<span class="block text-xs">Página ${pag.pagina} de ${pag.paginas}</span></span>
    ${boton(pag.pagina + 1, 'Siguiente ›', 'Página siguiente', pag.pagina >= pag.paginas)}
  </nav>`;
}

export { controlesPaginacion, paginar };
