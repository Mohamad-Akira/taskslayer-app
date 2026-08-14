export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('TaskSlayer ServiceWorker registered successfully: ', registration.scope);
        })
        .catch((error) => {
          console.error('TaskSlayer ServiceWorker registration failed: ', error);
        });
    });
  } else if ('serviceWorker' in navigator) {
    // In dev mode register service worker as well for testing
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('TaskSlayer ServiceWorker registered in dev mode: ', registration.scope);
        })
        .catch((error) => {
          console.error('TaskSlayer ServiceWorker registration failed: ', error);
        });
    });
  }
}
