![LKP SlangTech Client Portal](./public/image.png)

# LKP SlangTech - Client Portal (Web Siswa)

Portal publik dan siswa untuk platform kursus dan pelatihan teknologi **LKP SlangTech**. Aplikasi ini menangani eksplorasi katalog kelas/event, pendaftaran program, upload bukti pembayaran, profil siswa, serta notifikasi terintegrasi.

---

## 🚀 Fitur Utama

- **Katalog Kelas & Event**:
  - Daftar kelas (Private & Group) dengan deskripsi kurikulum, benefit, dan harga diskon.
  - Daftar event, workshop, dan webinar dengan detail jadwal dan profil instruktur/trainer.
- **Autentikasi & Profil Pengguna**:
  - Registrasi, Login, dan Reset Password dengan **Firebase Authentication**.
  - Setup profil lengkap (nama lengkap, nomor WhatsApp, domisili/wilayah) via Firestore REST.
- **Alur Pendaftaran & Pembayaran**:
  - Formulir pendaftaran multi-step interaktif.
  - Upload bukti transfer pembayaran dengan validasi ukuran berkas (< 1.5 MB).
  - Integrasi penyimpanan bukti bayar langsung ke **Cloudflare R2 Object Storage**.
- **Notifikasi Otomatis**:
  - **Notifikasi WhatsApp Admin**: Gateway Baselab otomatis mengirim notifikasi instan ke WhatsApp admin setiap ada pendaftaran baru yang perlu diverifikasi.
  - **Email Tanda Terima**: Siswa menerima email otomatis berisi rincian pendaftaran dan status menunggu verifikasi via **Hostinger SMTP** (`nodemailer`).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router, Turbopack)
- **UI Library**: [React](https://react.dev/) 19 & [Tailwind CSS](https://tailwindcss.com/)
- **Icons & Motion**: Lucide React & Framer Motion
- **Smooth Scrolling**: Lenis
- **Database & Auth**: Google Firebase (Authentication & Firestore REST API)
- **Storage**: Cloudflare R2 (S3 API Client)
- **Email Service**: Nodemailer (Hostinger SMTP)
- **WhatsApp Gateway**: Baselab WA Gateway API

---

## 🏛️ Arsitektur Aplikasi End-to-End

Berikut adalah representasi arsitektur sistem dari sisi aplikasi **Client** mulai dari antarmuka pengguna, API gateway internal (Route Handlers), logika bisnis domain, hingga integrasi database dan API eksternal:

```mermaid
flowchart TD
    subgraph ClientLayer["1. Client Web App (Frontend / Presentation Layer)"]
        UI_Home["Landing & Beranda (/home)"]
        UI_Classes["Katalog & Detail Kelas (/classes)"]
        UI_Events["Katalog & Detail Event (/events)"]
        UI_Enroll["Form Pendaftaran & Bayar (/classes/slug/register, /events/slug/register)"]
        UI_Auth["Autentikasi & Profil (/login, /register, /profile/setup)"]
    end

    subgraph APILayer["2. Internal API Gateway / Route Handlers (Next.js Serverless)"]
        API_Upload["/api/upload-payment (Upload & Kompresi Bukti Bayar / Absensi)"]
        API_WA["/api/whatsapp/notify-admin (Notifikasi WA Admin Baru Daftar)"]
        API_Email["/api/*-registration-email (Kirim Tanda Terima Email via SMTP)"]
        API_Regions["/api/regions (Proxy Data Wilayah Indonesia)"]
    end

    subgraph ServiceLayer["3. Domain Services (Business Logic)"]
        SRV_Auth["User & Auth Service (firebase-auth.ts)"]
        SRV_Content["Content Service (classes.ts, events.ts, information.ts)"]
        SRV_Enroll["Enrollment & Payment Service (enrollments.ts)"]
        SRV_Region["Region Service (indonesia-regions.ts)"]
    end

    subgraph ExternalServices["4. External APIs & Database Store"]
        EXT_FirebaseAuth["Google Firebase Auth (Identity Toolkit API)"]
        EXT_Firestore["Google Cloud Firestore (REST API Database)"]
        EXT_R2["Cloudflare R2 Object Storage (AWS S3-compatible API)"]
        EXT_TinyPNG["TinyPNG API (Image Compression)"]
        EXT_Baselab["Baselab WhatsApp Gateway API"]
        EXT_SMTP["Hostinger SMTP Mail Server"]
        EXT_RegionsAPI["API Daerah Indonesia (api-daerah-indonesia.vercel.app)"]
    end

    %% Interaksi Client ke Gateway & Services
    UI_Auth --> SRV_Auth
    UI_Classes --> SRV_Content
    UI_Events --> SRV_Content
    UI_Enroll --> SRV_Enroll

    UI_Enroll --> API_Upload
    UI_Enroll --> API_WA
    UI_Enroll --> API_Email
    UI_Auth --> API_Regions

    %% Interaksi Gateway ke External Services
    API_Upload -- "1. Verifikasi ID Token" --> EXT_FirebaseAuth
    API_Upload -- "2. Kompresi Foto Bukti" --> EXT_TinyPNG
    API_Upload -- "3. Simpan Objek via S3 SigV4" --> EXT_R2

    API_WA -- "1. Verifikasi ID Token" --> EXT_FirebaseAuth
    API_WA -- "2. Kirim Notif WhatsApp Admin" --> EXT_Baselab

    API_Email -- "1. Verifikasi ID Token" --> EXT_FirebaseAuth
    API_Email -- "2. Kirim Email Transaksional Siswa & Admin" --> EXT_SMTP

    API_Regions -- "Proxy & Cache Data Wilayah" --> EXT_RegionsAPI

    %% Interaksi Domain Services ke Firestore & Auth
    SRV_Auth -- "Login / Register / Refresh Token" --> EXT_FirebaseAuth
    SRV_Auth -- "Simpan & Baca Profil Siswa" --> EXT_Firestore
    SRV_Content -- "Ambil Data Kelas, Event & Pengumuman" --> EXT_Firestore
    SRV_Enroll -- "Query & Simpan Transaksi Pendaftaran" --> EXT_Firestore
```

---

### 🔍 Rincian Komponen Arsitektur

#### 1. Web App (Client Presentation Layer)
- **Peran**: Antarmuka web publik dan siswa berbasis Next.js 16 (App Router) dengan Server Side Rendering (SSR) dan Client Components.
- **Halaman & Modul Utama**:
  - `/` & `/home`: Beranda, hero section interaktif, value proposition, review testimoni, dan CTA program.
  - `/classes` & `/classes/[slug]`: Katalog eksplorasi kelas program privat & grup beserta silabus, benefit, dan rincian harga.
  - `/events` & `/events/[slug]`: Informasi workshop, webinar, jadwal sesi, trainer profile, serta absensi kehadiran per sesi event.
  - `/classes/[slug]/register` & `/events/[slug]/register`: Multi-step wizard pendaftaran siswa, pemilihan bank transfer, dan pengunggahan bukti pembayaran.
  - `/login`, `/register`, & `/profile/setup`: Portal masuk, pendaftaran akun baru, dan setup profil lengkap domisili wilayah siswa.
  - `/informasi`: Papan pengumuman dan update penting seputar kegiatan belajar.

#### 2. Content Service (Layanan Katalog & Konten Publik)
Content Service bertanggung jawab mengelola dan menyajikan data konten publik ke halaman aplikasi secara efisien tanpa memerlukan server backend terpisah:
- **`classes.ts`**: Mengambil daftar kelas aktif, filter berdasarkan kategori (`private`/`group`), pencarian teks, dan detail kelas berdasarkan slug/ID dari koleksi Firestore `classes`.
- **`events.ts`**: Mengambil data event, detail sesi pelatihan, harga tiket (berbayar/gratis), kuota peserta, dan instruktur dari koleksi Firestore `events`.
- **`information.ts`**: Menyajikan artikel informasi dan pengumuman dari koleksi Firestore `information`.
- **Mekanisme**: Berkomunikasi langsung ke Google Cloud Firestore via REST API (`https://firestore.googleapis.com/v1/...`) menggunakan `fetch` Next.js dengan kontrol *cache* fleksibel.

#### 3. User & Authorizer Service
- **Layanan Autentikasi (`firebase-auth.ts`)**:
  - Mengelola sesi login siswa, registrasi akun, dan refresh token melalui Firebase Client SDK & Identity Toolkit REST API.
  - Menyimpan dan menyinkronkan data profil siswa (nama lengkap, nomor telepon/WhatsApp, provinsi, kabupaten/kota, kecamatan, kelurahan) pada dokumen Firestore `users/{uid}`.
- **Authorizer di Route Handlers (`verifyFirebaseUser`)**:
  - Setiap endpoint API sensitif (upload bukti pembayaran, pengiriman notifikasi pendaftaran, dan pengiriman email) memvalidasi `idToken` Firebase yang dikirimkan oleh klien ke endpoint `https://identitytoolkit.googleapis.com/v1/accounts:lookup`.
  - Mencegah aksi pendaftaran liar atau unggahan berkas tanpa sesi pengguna yang terverifikasi.

#### 4. Enrollment & Payment Service (`enrollments.ts`)
- Menangani seluruh alur siklus hidup pendaftaran siswa:
  1. Melakukan validasi sesi dan data pendaftaran siswa.
  2. Mengunggah bukti transfer melalui endpoint `/api/upload-payment`.
  3. Menyimpan dokumen pendaftaran ke koleksi Firestore `enrollments` dengan status awal `waiting_payment_confirmation`.
  4. Memicu pengiriman notifikasi WhatsApp ke admin via `/api/whatsapp/notify-admin`.
  5. Memicu pengiriman email tanda terima pendaftaran ke siswa dan admin via `/api/class-registration-email` atau `/api/event-registration-email`.
  6. Mengelola pengajuan perubahan jadwal (*reschedule request*) dan presensi sesi pelatihan (*event attendance*).

---

### 🌐 External APIs yang Di-Hit dan Fungsinya

| No | External API / Layanan | Endpoint / Protokol | Tujuan & Fungsi dalam Aplikasi |
|:---|:---|:---|:---|
| **1** | **Google Firebase Identity Toolkit API** | `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={API_KEY}` | **Authorizer & Verifikasi Sesi**: Digunakan oleh Next.js Route Handlers (`/api/upload-payment`, `/api/whatsapp/notify-admin`, `/api/class-registration-email`, dll.) untuk memvalidasi `idToken` milik siswa sebelum transaksi diproses. |
| **2** | **Google Cloud Firestore REST API** | `https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents` | **Database Utama**: Menyimpan dan mengambil dokumen transaksi `enrollments`, data katalog `classes` & `events`, profil siswa `users`, informasi pengumuman `information`, serta konfigurasi gateway di `settings`. |
| **3** | **Cloudflare R2 Object Storage** | `https://{ACCOUNT_ID}.r2.cloudflarestorage.com/{BUCKET_NAME}/*` | **Object Storage Berkas**: Tempat penyimpanan berkas bukti transfer (`payment-proofs/`) dan foto dokumentasi absensi event (`event-attendances/`). Menggunakan otorisasi AWS Signature Version 4 (SigV4) via native Node.js crypto PUT request. Berkas diakses publik via CDN `R2_PUBLIC_URL`. |
| **4** | **TinyPNG Compression API** | `https://api.tinify.com/shrink` | **Kompresi Bukti Pembayaran**: Mengompres gambar bukti transfer secara otomatis sebelum diunggah ke Cloudflare R2 untuk menghemat kapasitas storage, mempercepat waktu muat, dan menjaga ukuran tetap di bawah batas 1.5 MB. Mendukung rotasi multi-API key. |
| **5** | **Baselab WhatsApp Gateway API** | `https://api-wa.baselab.web.id/api/send-message` | **Notifikasi WhatsApp Admin**: Mengirim notifikasi pesan WhatsApp otomatis ke nomor WhatsApp admin segera setelah siswa mengunggah bukti pendaftaran agar proses verifikasi admin dapat dilakukan secepatnya. |
| **6** | **Hostinger SMTP Server (Nodemailer)** | `smtp.hostinger.com` (Port 465 SSL / 587 TLS) | **Email Transaksional Siswa & Admin**: Mengirimkan email konfirmasi pendaftaran secara otomatis ke inbox siswa (berisi detail program dan panduan menunggu konfirmasi) serta email pemberitahuan ke admin SlangTech. |
| **7** | **API Daerah Indonesia** | `https://api-daerah-indonesia.vercel.app/api/...` | **Data Master Wilayah**: Menyediakan data hierarki administratif Indonesia (provinsi, kabupaten/kota, kecamatan, dan kelurahan/desa) secara dinamis dengan caching pada form kelengkapan profil siswa (`/profile/setup`). |

---

## 📁 Struktur Direktori

```text
client/
├── app/                          # Next.js App Router (Halaman & Endpoint API)
│   ├── api/                      # Route Handlers (Email, R2 Upload, WhatsApp, Regions)
│   │   ├── class-registration-email/ # Dispatch email pendaftaran kelas via SMTP
│   │   ├── event-registration-email/ # Dispatch email pendaftaran event via SMTP
│   │   ├── regions/                  # Proxy & caching data wilayah Indonesia
│   │   ├── upload-payment/           # Upload bukti bayar & absensi ke Cloudflare R2
│   │   └── whatsapp/                 # Gateway notifikasi WhatsApp (Admin & Siswa)
│   │       ├── message/              # Pengiriman pesan WhatsApp umum
│   │       └── notify-admin/         # Notifikasi instan pendaftaran masuk ke admin
│   ├── classes/                  # Halaman daftar katalog dan detail kelas
│   ├── events/                   # Halaman daftar katalog dan detail event
│   ├── home/                     # Halaman landing & beranda publik
│   ├── informasi/                # Halaman pengumuman & berita resmi
│   ├── login/ & register/        # Halaman autentikasi siswa
│   └── profile/setup/            # Halaman pengisian profil & data domisili siswa
├── components/                   # Komponen UI global (Navbar, Footer, UI primitives)
├── features/                     # Arsitektur modular berbasis domain (Domain-Driven)
│   ├── auth/                     # Layanan autentikasi Firebase & form profil
│   ├── classes/                  # Katalog kelas, detail, dan form registrasi kelas
│   ├── enrollments/              # Siklus hidup pendaftaran, upload bukti, dan jadwal
│   ├── events/                   # Katalog event, pendaftaran event, dan absensi
│   ├── home/                     # Komponen section beranda siswa
│   ├── information/              # Komponen dan service informasi/pengumuman
│   └── marketing/                # Komponen landing page (Bento grid, FAQ, Testimoni)
├── hooks/                        # Custom React hooks (use-mobile, use-toast)
├── lib/                          # Utility & helper terpusat
│   ├── whatsapp.ts               # Sinkronisasi WhatsApp config via Firestore
│   ├── site.ts                   # Metadata dan SEO website
│   └── utils.ts                  # Helper fungsi styling (clsx, tailwind-merge)
└── public/                       # Aset gambar, logo, ikon, dan banner
```

---

## 💻 Panduan Menjalankan

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Mode Pengembangan (Development)
```bash
npm run dev
```
Aplikasi berjalan di [http://localhost:3000](http://localhost:3000).

### 3. Kompilasi Produksi (Production Build)
```bash
npm run build
```
```bash
npm start
```
