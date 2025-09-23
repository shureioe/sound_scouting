if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              console.log('New content is available; please refresh.');
              
              // Show update notification
              if (confirm('Nueva versión disponible. ¿Desea actualizar?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
  
  // Handle offline/online events
  window.addEventListener('online', () => {
    console.log('App is online');
    // You can add sync logic here
  });
  
  window.addEventListener('offline', () => {
    console.log('App is offline');
    // You can add offline handling here
  });
}