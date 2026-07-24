/* Kozmo Service Worker
   Görev (bu aşama): uygulamayı çevrimdışı açılabilir kılmak.
   İleride: push bildirimleri (günlük rapor, aura kartı, haftalık 7 gün).

   Strateji: "network-first, cache fallback" — önce ağdan taze içerik dener,
   ağ yoksa önbellekten açar. Böylece kullanıcı hem güncel kalır hem çevrimdışı
   çalışır. Vite her derlemede dosya adlarını değiştirdiği için (hash'li),
   eski önbellek sürüm değişince temizlenir. */

const SURUM = "kozmo-v1";
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
  // Yalnızca GET ve aynı köken; API çağrıları (Supabase) önbelleğe girmez
  if (istek.method !== "GET") return;
  const url = new URL(istek.url);
  if (url.origin !== self.location.origin) return; // dış istekler (API, fontlar) doğrudan geçsin

  e.respondWith(
    fetch(istek)
      .then((yanit) => {
        // Başarılı yanıtı önbelleğe al (gelecekteki çevrimdışı açılış için)
        const kopya = yanit.clone();
        caches.open(SURUM).then((c) => c.put(istek, kopya)).catch(() => {});
        return yanit;
      })
      .catch(() =>
        // Ağ yoksa önbellekten ver; o da yoksa ana sayfaya düş
        caches.match(istek).then((v) => v || caches.match("/")),
      ),
  );
});

/* ---------- İLERİDE: PUSH BİLDİRİMLERİ ----------
   Bir sonraki adımda buraya 'push' ve 'notificationclick' dinleyicileri eklenecek:
   - Günlük rapor bildirimi
   - Aura kartı bildirimi (tercihe göre)
   - Haftalık 7 gün (pazartesi) bildirimi
   Bunlar için ayrıca bir push aboneliği (VAPID anahtarları) ve
   Supabase tarafında zamanlanmış gönderim gerekecek. */
