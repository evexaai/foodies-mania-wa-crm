/* Retires the old service worker.
   Before the split into website/ and dashboard/, the dashboard registered its
   worker here at /sw.js, covering the whole site, and it kept copies of every
   page it fetched, the website's too. A browser that still has it checks this
   file for updates and gets this one, which deletes those copies and
   unregisters straight away, during install, so it does not depend on taking
   over from the old worker first. The dashboard's own worker now lives at
   /dashboard/sw.js and covers only the dashboard. */
const retire = async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k.startsWith('fm-crm')).map(k => caches.delete(k)));
  await self.registration.unregister();
};

/* Not waited on: an old worker that is busy answering requests can hold an
   install open, and the clean-up must not wait behind it. */
self.addEventListener('install', () => {
  self.skipWaiting();
  retire().catch(() => {});
});

self.addEventListener('activate', e => {
  e.waitUntil(retire().then(async () => {
    const tabs = await self.clients.matchAll({ type: 'window' });
    tabs.forEach(t => t.navigate(t.url).catch(() => {}));
  }));
});
