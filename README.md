<p align="center">
  <img src="client/public/averda_logo.png" alt="Averda Academy" width="220" />
</p>

#  Averda Academy — Employee Onboarding & Safety Training Platform

![Tests](https://img.shields.io/badge/tests-145%2F145%20passing-brightgreen)
![Server](https://img.shields.io/badge/server-Node.js%2018%2B-blue)
![Client](https://img.shields.io/badge/client-React%2018-61dafb)
![Database](https://img.shields.io/badge/database-PostgreSQL%2016-336791)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database](#-database)
- [Test Suite](#-test-suite)
- [API Reference](#-api-reference)
- [Known Issues](#-known-issues)
- [Contributing](#-contributing)

---

## 🎯 Overview

**Averda Academy** is a bilingual/trilingual (Arabic RTL, French, English) web platform built for **Averda Morocco** — a waste management company. It manages employee onboarding, HSSEQ safety training, and PPE (EPI) lifecycle for field workers: drivers, sweepers, loaders, team leaders, park agents, and maintenance staff.

The platform provides two portals:

- **👷 Employee portal** — mobile-first experience for daily training, assessments, and PPE management
- **🖥️ Admin dashboard** — operations console for HR, safety, and training administrators

---

## ✨ Features

### 👷 Employee Portal

- Login with matricule (e.g. `AV000001`) + 4-digit PIN
- HSSEQ baseline safety assessment (10 questions, **70% pass threshold**) gates course access
- Course catalog filtered by job category with PDF viewer and progress tracking
- Two quiz systems: AI-generated end-of-course quizzes (Claude/Anthropic) + hardcoded lesson quizzes
- Badges and certificates on course completion
- EPI/PPE passport: sizes, issued items, reception confirmation, renewal requests with photo proof
- In-app notifications
- Full multilingual support: Arabic (RTL), French, English — persisted per user
- Mobile-first shell with bottom tab navigation

### 🖥️ Admin Dashboard

- KPI dashboard with activity feed
- Employee management: search, filters by category/status, add/deactivate/reset progress
- Assessment reminder system (24h cooldown)
- Course management: CRUD, PDF upload, AI-powered PDF analysis and quiz generation
- EPI management: catalog, per-role defaults, issuance, expiry calendar, renewal approval workflow
- Analytics: weekly completions, heatmap, at-risk employees, problematic questions, course scores
- Settings: encrypted API key management (Anthropic, ElevenLabs)
- Excel export

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript | UI framework |
| Vite 6 | Build tool + dev server |
| React Router DOM 7 | Client-side routing |
| Tailwind CSS 3 | Styling |
| Axios | HTTP client with JWT interceptor |
| i18next | Internationalization (AR/FR/EN) |
| react-hook-form + zod | Form validation |
| Framer Motion | Animations |
| Recharts | Analytics charts |
| @dnd-kit | Drag and drop |
| react-zoom-pan-pinch | PDF zoom |

### Backend

| Technology | Purpose |
|------------|---------|
| Node.js 18+ (ES Modules) | Runtime |
| Express 4 | HTTP framework |
| Prisma 6 | ORM |
| PostgreSQL 16 | Database |
| JWT + bcrypt | Authentication |
| Anthropic Claude | AI quiz generation + PDF analysis + chat |
| ElevenLabs | Text-to-speech |
| Google Gemini | Optional translation |
| multer | File uploads |
| pdfkit | Certificate generation |
| helmet + cors | Security |

### Testing

| Tool | Purpose |
|------|---------|
| Vitest | Unit + integration tests (server + client) |
| Supertest | HTTP integration testing |
| React Testing Library | Component tests |
| Playwright | E2E tests (Chromium + Mobile Chrome) |

---

## 🏗️ Architecture

Monorepo layout:

```
averda-academy/
├── client/          # React 18 + Vite frontend
│   ├── src/
│   │   ├── pages/   # employee/ and admin/ pages
│   │   ├── components/
│   │   ├── api/     # Axios client + API functions
│   │   ├── context/ # Auth, Theme, Toast
│   │   ├── i18n/    # AR, FR, EN translations
│   │   └── data/    # Assessment questions, EPI data
│   └── public/
│       └── courses/ # PDF course files
├── server/
│   ├── src/
│   │   ├── routes/  # Express route handlers
│   │   ├── services/# AI, badges, certificates, EPI
│   │   ├── middleware/
│   │   └── utils/
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── e2e/             # Playwright E2E tests
└── package.json     # Monorepo root
```

### Two-portal design

| Portal | Architecture |
|--------|----------------|
| **Employee** | Mobile-first SPA with bottom tab bar (`EmployeeLayout`). Assessment gating controls course visibility. Client-side navigation preserves auth state. |
| **Admin** | Primary UI is `DashboardPage.tsx` — a monolithic shell with sidebar tabs (dashboard, employees, EPI, courses, analytics, settings). Legacy `AdminLayout` routes (`/admin/employees`, `/admin/courses`) still exist for some flows. |

### Business rule

Categories **`parkAgent`** and **`maintenance`** intentionally show **0 courses** until a real catalog is assigned — this is expected behavior, not a bug.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Docker Desktop

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/rania-kett/Averda-Academy.git
cd Averda-Academy

# 2. Install all dependencies
npm run install:all

# 3. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your values (see Environment Variables section)

# 4. Start PostgreSQL
docker run -d --name averda-academy-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=averda_academy \
  -p 5434:5432 postgres:16

# 5. Run database migrations and seed
cd server
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
cd ..

# 6. Start the development servers
npm run dev
```

### Access the app

| Service | URL |
|---------|-----|
| 👷 Employee Portal | http://localhost:5173/login |
| 🖥️ Admin Dashboard | http://localhost:5173/admin/login |
| 🔌 API Health | http://localhost:3011/health |

### Default credentials

| Role | Identifier | Password |
|------|-----------|----------|
| Admin | admin@averda.ma | Admin@2026 |
| Driver (يوسف العلوي) | AV000001 | PIN: 1234 |
| Loader (كريم بنعلي) | AV000002 | PIN: 1234 |
| Maintenance (أمين الراشدي) | AV000003 | PIN: 1234 |
| Sweeper (سعيد المنصوري) | AV000004 | PIN: 1234 |
| Team Leader (هشام التازي) | AV000005 | PIN: 1234 |

---

## ⚙️ Environment Variables

### Server (`server/.env`)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/averda_academy

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# Settings encryption
SETTINGS_SECRET=your_settings_secret_here

# AI Services (optional — can also be set via Admin > Settings)
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
GEMINI_API_KEY=...

# Server
PORT=3011
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)

```env
# Leave empty in dev — Vite proxy handles it
VITE_API_URL=
```

---

## 🗄️ Database

| Model | Description |
|-------|-------------|
| `User` | Employees and admins |
| `Category` | Job roles (driver, loader, sweeper, etc.) |
| `Course` | Training courses with PDFs |
| `CourseCategory` | Course ↔ category mapping |
| `LessonProgress` | Reading/completion tracking |
| `Quiz` | AI-generated course quizzes |
| `QuizAttempt` | End-of-course quiz results |
| `LessonQuizAttempt` | Hardcoded lesson quiz results |
| `Badge` | Achievement definitions |
| `UserBadge` | Earned badges |
| `Certificate` | Completion certificates |
| `EpiProfile` | Employee PPE sizes |
| `EpiIssuance` | Issued PPE items |
| `EpiReceptionConfirmation` | Employee receipt signatures |
| `EpiReplacementRequest` | Replacement requests |
| `EpiRenewalRequest` | Renewal approval workflow |
| `EpiItemCatalog` | PPE equipment catalog |
| `EpiCategoryDefaultItem` | Default PPE per role |
| `EpiComplianceProof` | Photo proof uploads |
| `EpiFeedback` | PPE feedback |
| `AppSettingKey` | Encrypted integration keys |
| `Notification` | In-app notifications |

Useful commands:

```bash
npx prisma studio          # Visual DB browser
npx prisma db seed         # Reset employees + EPI data
npx prisma migrate dev     # Create new migration
```

---

## 🧪 Test Suite

**145 tests — 100% passing**

| Layer | Tool | Tests | Status |
|-------|------|------:|-------|
| Server unit tests | Vitest | 25 | ✅ |
| Server integration tests | Vitest + Supertest | 67 | ✅ |
| Client unit tests | Vitest + RTL | 23 | ✅ |
| E2E tests | Playwright | 30 | ✅ |
| **Total** | | **145** | **✅** |

```bash
# Run all tests
npm run test:all

# Server tests only (unit + integration)
cd server && npm test

# Client tests only
cd client && npm test

# E2E tests (requires dev server running)
npm run dev          # terminal 1
npm run test:e2e     # terminal 2

# With coverage
cd server && npm run test:coverage
```

### What's tested

- Auth: login, refresh tokens, rate limiting, role separation
- Assessment: scoring logic, 70% threshold, gating behavior
- Course visibility: parkAgent/maintenance = 0 courses (business rule)
- Admin: employee CRUD, stats, EPI management, notifications
- E2E flows: employee login → assessment → courses; admin dashboard tabs; RTL/LTR switching; mobile viewport

### Known limitations (documented as `test.fails()`)

| Endpoint | Issue |
|----------|-------|
| `GET /api/admin/quiz-results/*` | Route file exists but not mounted in `app.ts` |
| `POST /api/custom-course-quiz/submit` | No server route exists |

---

## 📡 API Reference

Base URL: `http://localhost:3011`

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Employee login (employeeId + PIN) |
| POST | `/api/auth/admin-login` | Admin login (email + password) |
| POST | `/api/auth/refresh` | Refresh access token |

### Employee

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/me` | Current user profile |
| POST | `/api/user/assessment` | Submit baseline assessment |
| GET | `/api/courses` | Course list (filtered by category) |
| POST | `/api/courses/:id/progress` | Update reading progress |
| GET | `/api/quiz/:courseId` | Get quiz questions |
| POST | `/api/quiz/:courseId/attempt` | Submit quiz attempt |
| GET | `/api/epi/passport` | EPI issued items |
| POST | `/api/epi/request-renewal` | Request PPE renewal |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | KPI numbers |
| GET | `/api/admin/employees` | Employee list with filters |
| POST | `/api/admin/employees` | Create employee |
| POST | `/api/admin/courses/:id/generate-quiz` | AI quiz generation |
| GET | `/api/admin/epi/overview` | EPI dashboard |
| GET | `/api/admin/analytics/weekly` | Weekly completions |

Full API documented in source: `server/src/routes/`

---

## ⚠️ Known Issues

1. **Dual admin UI**: `DashboardPage.tsx` (primary) vs legacy `AdminLayout` routes — some features duplicated
2. **`adminQuizResults.ts` not mounted**: `QuizResultsSection` will 404 until wired in `app.ts`
3. **Arabic PDF filenames**: resolution logic fragile on Windows paths with trailing spaces
4. **No server-side logout**: client clears tokens only — no token invalidation
5. **`parkAgent` / `maintenance`**: intentionally show 0 courses until catalog is ready
6. **Port conflict**: default port `3011`; if occupied run `netstat -ano | findstr :3011` and kill the process

---

## 🤝 Contributing

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Run tests before committing
npm run test:all

# The CI pipeline runs automatically on push
# See .github/workflows/test.yml
```

---

## 📄 License

MIT
