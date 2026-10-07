# 🔗 LinkHub

Website mudah untuk simpan link-link web project anda di satu tempat — klik je kad, terus buka link. Dibina guna **HTML + CSS + JS sahaja** (tiada framework, tiada build step).

![Theme](https://img.shields.io/badge/theme-Neo--Brutalism-FFD43B?style=for-the-badge&labelColor=141414)

## Ciri-ciri

- ➕ **Tambah project** — nama, link, kategori, kredit, gambar & tarikh dibuat
- 🏷️ **Kategori custom** — taip mana-mana nama kategori (cth: Project, Link, Kerja, Belajar); bar tapisan bina butang + bilangan secara dinamik, warna chip ikut kategori
- 🖼️ **Gambar** — masukkan URL gambar atau upload fail (auto-resize & mampat); kalau takda gambar, kad papar huruf pertama nama project atas latar warna
- ⚡ **Satu klik terus buka** — klik mana-mana bahagian kad
- ✏️ **Edit & buang** project
- 🔎 **Carian** + susunan (terbaru / terlama / nama A–Z)
- 🔲 **Mod paparan grid / senarai** — pilihan disimpan dalam localStorage
- 💾 Data disimpan dalam **localStorage** browser (tiada server diperlukan)
- 🌱 **Seed data** — senarai project sedia ada dimuatkan sekali sahaja pada kunjungan pertama; selepas itu data anda sendiri yang digunakan
- 🎨 Theme **Neo-Brutalism** — struktur CSS variables, senang tambah theme baru kelak

## Jalankan secara tempatan

Buka `index.html` terus dalam browser, atau:

```bash
python -m http.server 8080
# kemudian buka http://localhost:8080
```

## Deploy ke Vercel

1. Push repo ini ke GitHub (dah siap ✅)
2. Pergi ke [vercel.com/new](https://vercel.com/new)
3. **Import** repo ini dari GitHub
4. Framework Preset: **Other** — biarkan semua default (tiada build command, output = root)
5. Klik **Deploy** — siap!

## Tukar & tambah theme

Suis theme ada dalam header — pilihan disimpan dalam localStorage. Semua warna & shadow ditakrifkan sebagai CSS variables dalam `style.css`:

```css
[data-theme="neo-brutalism"] { --bg: ...; --ink: ...; --accent: ...; }
[data-theme="papercut"]      { --bg: ...; --ink: ...; --accent: ...; }
[data-theme="facebook"]      { --bg: ...; --ink: ...; --accent: ...; }
[data-theme="dark-mode"]     { --bg: ...; --ink: ...; --accent: ...; }
[data-theme="terminal"]      { --bg: ...; --ink: ...; --accent: ...; }
```

Untuk theme baru: tambah blok `[data-theme="nama-theme"]` dengan nilai variables yang lain, tambah `<option>` baharu dalam `#themeSelect` (`index.html`) — siap.

## Struktur fail

```
linkhub/
├── index.html   # struktur halaman
├── style.css    # theme Neo-Brutalism (CSS variables)
└── script.js    # logik CRUD + localStorage
```
