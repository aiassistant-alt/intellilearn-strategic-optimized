// Theme Handler - Ejecuta antes de que React se cargue
(function() {
  // Obtener tema guardado o usar light por defecto
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  // Función para aplicar tema agresivamente
  function applyTheme(theme) {
    // Aplicar a html y body
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.className = theme === 'dark' ? 'dark' : '';
    document.documentElement.style.colorScheme = theme;
    
    if (document.body) {
      document.body.setAttribute('data-theme', theme);
      document.body.className = theme === 'dark' ? 'dark' : '';
      document.body.style.backgroundColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    }
    
    // Aplicar a TODOS los elementos existentes
    setTimeout(() => {
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        el.setAttribute('data-theme', theme);
        
        // Forzar cambio de fondo para elementos con estilos inline
        if (el.style && el.style.backgroundColor) {
          if (theme === 'dark') {
            if (el.style.backgroundColor.includes('255') || 
                el.style.backgroundColor.includes('white') ||
                el.style.backgroundColor.includes('#fff') ||
                el.style.backgroundColor.includes('#FFF')) {
              el.style.backgroundColor = '#222222';
            }
          }
        }
        
        // Forzar cambio de fondo para elementos con background
        if (el.style && el.style.background) {
          if (theme === 'dark') {
            if (el.style.background.includes('255') || 
                el.style.background.includes('white') ||
                el.style.background.includes('#fff') ||
                el.style.background.includes('#FFF')) {
              el.style.background = '#222222';
            }
          }
        }
      });
    }, 0);
    
    // Observer para elementos creados dinámicamente
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
              node.setAttribute('data-theme', theme);
              const descendants = node.querySelectorAll('*');
              descendants.forEach(desc => {
                desc.setAttribute('data-theme', theme);
              });
            }
          });
        });
      });
      
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }
  
  // Aplicar tema inmediatamente
  applyTheme(savedTheme);
  
  // Re-aplicar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyTheme(savedTheme));
  }
  
  // Re-aplicar después de que React se cargue
  window.addEventListener('load', () => {
    setTimeout(() => applyTheme(savedTheme), 100);
    setTimeout(() => applyTheme(savedTheme), 500);
    setTimeout(() => applyTheme(savedTheme), 1000);
  });
  
  // Escuchar cambios en localStorage
  window.addEventListener('storage', function(e) {
    if (e.key === 'theme') {
      const newTheme = e.newValue || 'light';
      applyTheme(newTheme);
    }
  });
  
  // Exponer función global para cambiar tema
  window.applyTheme = applyTheme;
})();