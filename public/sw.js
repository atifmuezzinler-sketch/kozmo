/* Kozmo Service Worker
   İki görev:
   1) Çevrimdışı açılış (network-first, cache fallback)
   2) Bildirim gösterme — uygulamadan gelen isteği kilit ekranına taşır

   Not: Bu aşamada bildirimler CİHAZDAN tetiklenir (sunucu push değil).
   Güvenilir zamanlama için ileride Seçenek 2 (sunucu push) gerekir. */

const SURUM = "kozmo-v2";
const TEMEL = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SURUM).then((c) => c.addAll(TEMEL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((anahtarlar) =>
      Promise.all(anahtarlar.filter((k) => k !== SURUM).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const istek = e.request;
  if (istek.method !== "GET") return;
  const url = new URL(istek.url);
  if (url.origin !== self.location.origin) return; // dış istekler (API) doğrudan geçsin

  e.respondWith(
    fetch(istek)
      .then((yanit) => {
        const kopya = yanit.clone();
        caches.open(SURUM).then((c) => c.put(istek, kopya)).catch(() => {});
        return yanit;
      })
      .catch(() => caches.match(istek).then((v) => v || caches.match("/"))),
  );
});

/* Uygulamadan gelen "bildirim göster" mesajı.
   Uygulama, kullanıcının izniyle ve doğru zamanda bu mesajı yollar;
   service worker da bunu kilit ekranına taşır. */
self.addEventListener("message", (e) => {
  if (e.data?.tur === "bildirim-goster") {
    const { baslik, govde } = e.data;
    self.registration.showNotification(baslik, {
      body: govde,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "kozmo-gunluk", // aynı etiket: eski bildirim yenisiyle değişir, yığılmaz
      renotify: false,
    });
  }
});

/* Bildirime dokununca uygulamayı aç (açıksa öne getir) */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((pencereler) => {
      for (const p of pencereler) {
        if (p.url.includes(self.location.origin) && "focus" in p) return p.focus();
      }
      return self.clients.openWindow("/");
    }),
  );
});
