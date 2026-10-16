// Configuración de Tailwind para compilar el CSS al publicar (la misma que usa index.html con el CDN).
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: {
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'system-ui', '"Segoe UI"', 'Roboto', 'sans-serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', '"Segoe UI"', 'Roboto', 'sans-serif']
      },
      colors: {
        papel: 'var(--papel)', superficie: 'var(--superficie)', hundido: 'var(--hundido)',
        tinta: 'var(--tinta)', tenue: 'var(--tenue)', linea: 'var(--linea)',
        guinda: 'var(--guinda)', oro: 'var(--oro)', exito: 'var(--exito)', error: 'var(--error)'
      }
    }
  }
};
