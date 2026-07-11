# Kozmo — Yayına Alma Kılavuzu (Faz 1)

Bu kılavuz, teknik bilgi gerektirmeden Kozmo'yu önce kendi bilgisayarında
çalıştırman, sonra internete (Vercel) almanı sağlar. Daha önce
yazi-analizi ve urun-studyosu projelerinde izlediğin akışın aynısıdır.

## 1. Bilgisayarında çalıştır (5 dakika)

1. Bu klasörü bilgisayarında bir yere çıkar (ör. Belgeler/kozmo).
2. Klasörün içinde terminal aç ve sırayla yaz:

   npm install
   npm run dev

3. Ekranda çıkan adresi (genellikle http://localhost:5173) tarayıcıda aç.
   Kozmo karşında.

## 2. İnternete al (Vercel)

### Kolay yol — Claude Code ile (önerilen)
Klasörün içinde terminale `claude` yaz ve şunu iste:
"Bu projeyi GitHub'a kozmo adıyla yeni bir depo olarak gönder."
Ardından vercel.com → Add New → Project → kozmo deposunu seç → Deploy.
Vercel, Vite projesini otomatik tanır; hiçbir ayar değiştirmen gerekmez.

### Elle yol
1. github.com → New repository → adı: kozmo → Create.
2. "uploading an existing file" bağlantısıyla klasördeki dosyaları yükle
   (node_modules ve dist klasörleri HARİÇ — zaten .gitignore'da).
3. vercel.com → Add New → Project → kozmo → Deploy.

Yayın adresi: kozmo-***.vercel.app (Vercel verir; istersen özel alan adı
bağlanabilir). Bundan sonra GitHub'a gönderilen her değişiklik siteyi
otomatik günceller.

## 3. Bilinen sınırlar (Faz 1)

- Yorum katmanı henüz zengin yerel havuzdan gelir; Claude API bağlantısı
  Faz 2'de eklenecek (engine.js içindeki mockEngine tek değişim noktası).
- Yükselen burç hesabında yaz/kış saati farkları yaklaşıktır.
- Şehir listesi 26 şehirle sınırlıdır; konum servisi yayın sürümünde.
- Doğum bilgileri yalnızca kullanıcının cihazında saklanır (sunucu yok).
- Bildirim (tarayıcı push) Faz 2 kapsamındadır.

## 4. Geri bildirim notu tut

Test edenlerden üç şeyi not et: neyi paylaştılar, neyi anlamadılar,
neye güldüler. Faz 2'nin gündemini bu liste belirleyecek.
