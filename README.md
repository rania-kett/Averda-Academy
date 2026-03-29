# FleetLearn — Employee Onboarding & Training Platform

Production-oriented full-stack app for a transport/logistics company (Morocco): trilingual UI (Arabic default, French, English), RTL for Arabic, admin SaaS dashboard, and a mobile-first employee portal with PDF courses, AI-generated quizzes (Claude), badges, and certificates.

## Features

- **Authentication**: Employee ID + 4-digit PIN; admin email + password; JWT access (15 min) + refresh (7 days).
- **Courses**: Group targeting (driver/worker/both), PDF storage, reading progress, completion tracking.
- **Quiz pipeline**: Image-based Arabic PDFs → `pdf2pic` (ImageMagick) page images → **Claude Vision** extracts text → **Claude Sonnet** generates 10 MCQs in AR/FR/EN → stored in PostgreSQL. Fallback: `pdfjs-dist` + `@napi-rs/canvas` if `pdf2pic` fails.
- **Gamification**: Badges with database-backed rules (first lesson, perfect score, safety expert, fleet master, etc.).
- **Certificates**: PDFKit landscape PDF when an employee passes all assigned courses.
- **i18n**: `react-i18next`; default language **Arabic**; language switcher on all main layouts.

## Prerequisites

- **Node.js** 18+ (tested with current LTS; Node 20+ recommended).
- **PostgreSQL** 14+.
- **Anthropic API key** for quiz generation and vision OCR.
- **ImageMagick** + **Ghostscript** (for `pdf2pic`) on Linux/macOS. On Windows, install [ImageMagick](https://imagemagick.org/) and Ghostscript so `magick`/`gs` are on `PATH`, or rely on the pdfjs + canvas fallback for development.

## Installation

```bash
cd "Employee Onboarding - APP"
npm install
npm run install:all
```

Copy environment files:

```bash
copy server\.env.example server\.env
# Edit server\.env — set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, ANTHROPIC_API_KEY
```

### Database

```bash
cd server
npx prisma migrate dev --name init
npx prisma db seed
```

If you prefer push without migration files:

```bash
npx prisma db push
npx prisma db seed
```

## Environment variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Access token signing secret | Yes |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key (Claude) | Yes for quiz generation / vision |
| `UPLOAD_DIR` | Server upload root (default `./uploads`) | No |
| `CLIENT_URL` | Frontend origin for CORS (default `http://localhost:5173`) | No |
| `PORT` | API port (default `3001`) | No |

## Run (development)

From the repo root:

```bash
npm run dev
```

This runs **server** (`tsx watch src/app.ts`) and **client** (`vite`) together.

- **API**: http://localhost:3001  
- **Web app**: http://localhost:5173  

### Demo accounts (after `cd server && npx prisma db seed`)

- **Admin (Averda)**: `admin@averda.ma` / `Admin@2026`
- **Employees**: `AVR-DRV-001` … `AVR-DRV-005`, `AVR-WRK-001` … `AVR-WRK-005` — PIN **`1234`**

The app opens with a short **splash** at `/`, then redirects to **`/login`** (employee). Admin: **`/admin/login`**.

## Adding a new course (admin)

1. Sign in at `/admin/login`.
2. Open **Courses** → **Add course**: titles (AR required), descriptions, target group, icon, gradient, PDF upload.
3. Click **Generate quiz** on the course card. The server runs vision extraction (if needed), then Claude generates 10 validated questions. Use **Regenerate** to replace an existing quiz.

## How quiz generation works

1. PDF bytes are read from disk.
2. **Primary**: Each page is rendered to PNG via `pdf2pic` (ImageMagick/Ghostscript).
3. **Fallback**: Pages rendered with `pdfjs-dist` and `@napi-rs/canvas`.
4. Each PNG is sent to **Claude Vision**; Arabic text is concatenated into `Course.extractedText` (UTF-8).
5. Extracted text is trimmed (~6000 token budget by character estimate) and sent to **Claude Sonnet** with a strict JSON-only system prompt.
6. JSON is parsed and validated; on failure, one retry with a stricter message.
7. Questions are stored on the `Quiz` model linked to the course.

## Project layout

- `server/` — Express API, Prisma, services (`claudeQuiz`, `badgeService`, `certificateService`), `pdfExtract` (vision + fallback).
- `client/` — React 18, Vite, Tailwind, Framer Motion, react-pdf, Recharts, react-i18next.
- `package.json` (root) — `npm run dev` runs client + server with `concurrently`.

## Known limitations

- **Scanned PDFs without clear glyphs**: If both vision and text extraction fail, admins see a clear error suggesting OCR preprocessing.
- **ImageMagick on Windows**: Must be installed separately; otherwise the pdfjs fallback is used (slower, higher CPU).
- **Quiz security**: The employee quiz API returns full question payloads (including correct answers) for the in-app step-by-step UX; suitable for internal training networks—harden if exposing to untrusted clients.

## License

Proprietary — internal use for FleetLearn deployment.
