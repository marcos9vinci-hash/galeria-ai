if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Unregister any old service worker first to clear stale cache
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      // If there's a waiting worker, activate it now
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      // If active but stale, unregister and reload
      if (reg.active && !navigator.serviceWorker.controller) {
        await reg.unregister();
        window.location.reload();
        return;
      }
    }

    // Register fresh service worker
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

      // Auto-update when new SW is waiting
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          });
        }
      });
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }

    // Listen for skip waiting message from SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        window.location.reload();
      }
    });
  });
}
