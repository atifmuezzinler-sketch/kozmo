# Kozmo — Supabase Kurulumu (Faz 2)

Bu klasör, Claude API'ye güvenli erişim sağlayan "kapıcı" fonksiyonu içerir.

## Ne yapar?

Uygulama → kapıcı → Claude API → anayasa denetimi → uygulama

API anahtarı yalnızca Supabase'in gizli kutusunda durur; kullanıcının
tarayıcısına asla düşmez.

## Proje bilgisi

- Proje adı: kozmo
- Proje kimliği (ref): fzviueulyrhvduigtwjo
- Bölge: eu-west-1 (İrlanda)
- Fonksiyon adı: kozmo-uret

## Kurulum adımları

### 1. API anahtarını Supabase'e gir (panelden — en kolay yol)

1. supabase.com → kozmo projesi
2. Sol menü: Project Settings → Edge Functions → Secrets
3. "Add new secret" → Name: `ANTHROPIC_API_KEY` → Value: (console.anthropic.com'dan aldığın anahtar)
4. Save

### 2. Fonksiyonu yayına al (terminalden)

Proje klasöründe sırayla:

    npx supabase login
    npx supabase link --project-ref fzviueulyrhvduigtwjo
    npx supabase functions deploy kozmo-uret

`login` tarayıcı açar, onaylarsın. `link` projeyi bağlar (veritabanı
şifresi sorarsa Supabase panelindeki Database Settings'ten alınır ya da
boş geçilebilir). `deploy` fonksiyonu yükler.

### 3. Test

    curl -i --location --request POST \
      'https://fzviueulyrhvduigtwjo.supabase.co/functions/v1/kozmo-uret' \
      --header 'Authorization: Bearer SUPABASE_ANON_KEY' \
      --header 'Content-Type: application/json' \
      --data '{"tur":"gunluk","girdi":{"kullanici":{"burc":"Balık","element":"su","yukselen":null},"gokyuzu":{"tarih":"2026-07-16","ay_burcu":"Aslan","ay_evresi":"Yeni Ay","gunes_burcu":"Yengeç","merkur_retro":true},"skorlar":{"aile":{"sans":52,"risk":57},"is":{"sans":63,"risk":56},"ask":{"sans":67,"risk":49},"para":{"sans":66,"risk":44}}}}'

SUPABASE_ANON_KEY: Supabase paneli → Project Settings → API → anon public

## Dosyalar

- `functions/kozmo-uret/index.ts` — kapıcı: Claude çağrısı, denetim, yeniden deneme
- `functions/kozmo-uret/talimatlar.ts` — üç sistem talimatı (prompts/*.md'den üretilir)
- `functions/kozmo-uret/denetim.ts` — anayasa denetimi (api modu)

## Model ve maliyet

Model: claude-sonnet-4-6. Sistem talimatı prompt caching ile gönderilir
(%90 tasarruf). Tahmini maliyet: 100 kullanıcı/gün ≈ aylık $10-25.

Maliyet sorun olursa index.ts'teki MODEL sabitini "claude-haiku-4-5-20251001"
yapmak yeterli (yaklaşık 5 kat ucuz, kalite bir tık düşer).
