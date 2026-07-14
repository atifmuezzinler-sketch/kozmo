import {
  SunPosition, EclipticGeoMoon, GeoVector, Ecliptic, SiderealTime, Body,
} from "astronomy-engine";

/* Burç verisi */
export const SIGNS = [
  { ad: "Koç", sembol: "♈", el: "ates" },
  { ad: "Boğa", sembol: "♉", el: "toprak" },
  { ad: "İkizler", sembol: "♊", el: "hava" },
  { ad: "Yengeç", sembol: "♋", el: "su" },
  { ad: "Aslan", sembol: "♌", el: "ates" },
  { ad: "Başak", sembol: "♍", el: "toprak" },
  { ad: "Terazi", sembol: "♎", el: "hava" },
  { ad: "Akrep", sembol: "♏", el: "su" },
  { ad: "Yay", sembol: "♐", el: "ates" },
  { ad: "Oğlak", sembol: "♑", el: "toprak" },
  { ad: "Kova", sembol: "♒", el: "hava" },
  { ad: "Balık", sembol: "♓", el: "su" },
];
export const EL_AD = { ates: "Ateş", toprak: "Toprak", hava: "Hava", su: "Su" };

const D2R = Math.PI / 180;
export const norm = (d) => ((d % 360) + 360) % 360;
export const signOf = (lon) => {
  const l = Number(lon);
  if (!Number.isFinite(l)) return SIGNS[0]; // geçersiz girdi güvenlik kalkanı
  return SIGNS[Math.floor(norm(l) / 30)];
};

/* Geosantrik ekliptik boylamlar — hassas efemeris (astronomy-engine) */
export function sunLon(date) {
  return norm(SunPosition(date).elon);
}
export function moonLon(date) {
  return norm(EclipticGeoMoon(date).lon);
}
const BODY = {
  merkur: Body.Mercury, venus: Body.Venus, mars: Body.Mars,
  jupiter: Body.Jupiter, saturn: Body.Saturn,
};
export function planetLon(p, date) {
  const v = GeoVector(BODY[p], date, true);
  return norm(Ecliptic(v).elon);
}
export function isRetro(p, date) {
  const yarin = new Date(date.getTime() + 86400000);
  let d = planetLon(p, yarin) - planetLon(p, date);
  d = ((d + 540) % 360) - 180;
  return d < 0;
}

/* Ay evresi (Güneş-Ay uzanımından) */
export function moonPhase(date) {
  const e = norm(moonLon(date) - sunLon(date));
  const evreler = [
    [22.5, "Yeni Ay", "🌑"], [67.5, "Büyüyen Hilal", "🌒"],
    [112.5, "İlk Dördün", "🌓"], [157.5, "Şişkin Ay", "🌔"],
    [202.5, "Dolunay", "🌕"], [247.5, "Küçülen Şişkin", "🌖"],
    [292.5, "Son Dördün", "🌗"], [337.5, "Balzamik Hilal", "🌘"],
  ];
  for (const [lim, ad, ikon] of evreler) if (e < lim) return { ad, ikon, e };
  return { ad: "Yeni Ay", ikon: "🌑", e };
}

/* Doğum anındaki Güneş boylamı */
export function natalSunLon(birthDate) {
  const d = new Date(birthDate + "T12:00:00Z");
  if (isNaN(d.getTime())) return 0; // geçersiz tarih güvenlik kalkanı
  return sunLon(d);
}

/* Yükselen burç — hassas yıldız zamanı + klasik ASC formülü
   Not: saat dilimi şehir tablosundan sabittir; yaz/kış saati (DST)
   farkları henüz yaklaşıktır ve yayın öncesi iyileştirilecektir. */
export function ascendant(birthDate, timeStr, city) {
  const [y, m, g] = birthDate.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, g, hh - city.tz, mm));
  const gast = SiderealTime(utc); // saat cinsinden
  const lst = norm(gast * 15 + city.lon) * D2R;
  const eps = 23.4367 * D2R;
  const phi = city.lat * D2R;
  const a = Math.atan2(
    Math.cos(lst),
    -(Math.sin(lst) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))
  ) / D2R;
  return signOf(norm(a));
}

/* Şehir veritabanı — yayın sürümünde konum servisiyle genişleyecek */
export const CITIES = [
  { ad: "Lefkoşa", lat: 35.19, lon: 33.36, tz: 2 },
  { ad: "Girne", lat: 35.34, lon: 33.32, tz: 2 },
  { ad: "Gazimağusa", lat: 35.12, lon: 33.94, tz: 2 },
  { ad: "Güzelyurt", lat: 35.2, lon: 32.99, tz: 2 },
  { ad: "İskele", lat: 35.29, lon: 33.89, tz: 2 },
  { ad: "Lefke", lat: 35.11, lon: 32.85, tz: 2 },
  { ad: "İstanbul", lat: 41.01, lon: 28.98, tz: 3 },
  { ad: "Ankara", lat: 39.93, lon: 32.86, tz: 3 },
  { ad: "İzmir", lat: 38.42, lon: 27.14, tz: 3 },
  { ad: "Bursa", lat: 40.19, lon: 29.06, tz: 3 },
  { ad: "Antalya", lat: 36.9, lon: 30.7, tz: 3 },
  { ad: "Adana", lat: 37.0, lon: 35.32, tz: 3 },
  { ad: "Konya", lat: 37.87, lon: 32.48, tz: 3 },
  { ad: "Gaziantep", lat: 37.07, lon: 37.38, tz: 3 },
  { ad: "Mersin", lat: 36.81, lon: 34.63, tz: 3 },
  { ad: "Kayseri", lat: 38.72, lon: 35.49, tz: 3 },
  { ad: "Eskişehir", lat: 39.78, lon: 30.52, tz: 3 },
  { ad: "Samsun", lat: 41.29, lon: 36.33, tz: 3 },
  { ad: "Trabzon", lat: 41.0, lon: 39.72, tz: 3 },
  { ad: "Diyarbakır", lat: 37.91, lon: 40.24, tz: 3 },
  { ad: "Londra", lat: 51.51, lon: -0.13, tz: 0 },
  { ad: "Paris", lat: 48.86, lon: 2.35, tz: 1 },
  { ad: "Berlin", lat: 52.52, lon: 13.4, tz: 1 },
  { ad: "Amsterdam", lat: 52.37, lon: 4.9, tz: 1 },
  { ad: "New York", lat: 40.71, lon: -74.01, tz: -5 },
  { ad: "Dubai", lat: 25.2, lon: 55.27, tz: 4 },
];

export function foldTr(s) {
  return s.trim().toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
export function findCity(text) {
  if (!text) return null;
  const f = foldTr(text);
  return CITIES.find((c) => foldTr(c.ad) === f) || null;
}
