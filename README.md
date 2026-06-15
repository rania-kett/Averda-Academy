<p align="center">
  <img src="client/public/averda_logo.png" alt="Averda Academy" width="220" />
</p>

<h1 align="center">Averda Academy</h1>
<p align="center">
  <strong>Plateforme de formation d’onboarding et d'équipements de protection individuelle (EPI)</strong><br/>
  منصة التدريب والسلامة المهنية — Averda Morocco
</p>

<p align="center">
  <a href="https://github.com/rania-kett/Averda-Academy">Dépôt GitHub</a>
  ·
  React + TypeScript · Node.js · PostgreSQL · Prisma
</p>

---

## Table des matières

1. [Présentation](#présentation)
2. [Fonctionnalités](#fonctionnalités)
3. [Stack technique](#stack-technique)
4. [Prérequis](#prérequis)
5. [Installation pas à pas](#installation-pas-à-pas)
6. [Configuration (variables d’environnement)](#configuration-variables-denvironnement)
7. [Lancement de l’application](#lancement-de-lapplication)
8. [Comptes de démonstration](#comptes-de-démonstration)
9. [Clés API (optionnel)](#clés-api-optionnel)
10. [Structure du projet](#structure-du-projet)
11. [Commandes utiles](#commandes-utiles)
12. [Dépannage](#dépannage)
13. [Sécurité & bonnes pratiques](#sécurité--bonnes-pratiques)
14. [Dernières améliorations](#dernières-améliorations)

---

## Présentation

**Averda Academy** est une application web complète pour la formation des collaborateurs Averda :

- **Portail employé** : connexion par matricule + code PIN, parcours de cours (PDF), quiz, badges, profil, équipements (EPI).
- **Portail administrateur** : tableau de bord, gestion des employés, des cours, des équipements (EPI), analyses, export Excel, **paramètres** (clés API Anthropic / ElevenLabs).

L’interface est **multilingue** (arabe, français, anglais) avec support **RTL** pour l’arabe.

---

## Fonctionnalités

| Module | Employé | Admin |
|--------|---------|-------|
| Authentification | Matricule `AV00000x` + PIN | Email + mot de passe |
| Cours & PDF | Lecture, progression | CRUD cours, upload PDF |
| Quiz | Quiz par cours, leçons | Génération IA (Anthropic) |
| EPI | Réception, demandes, photos | Émission, calendrier d’expiration |
| Tableau de bord | Accueil, défis, badges | KPI, activité, analytics |
| Paramètres | — | Clés API chiffrées en base |

**Points forts récents :**
- Interface **mobile** optimisée (en-tête, barre de navigation, zone de défilement via Visual Viewport API).
- Navigation employé fiable (retour, fermeture des modales, quiz, notifications, FAB urgence).
- Tableau de bord admin : filtres employés par groupe, rappels d’évaluation avec cooldown 24 h, alignement des données d’assessment.

---

## Stack technique

| Couche | Technologies |
|--------|----------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, i18next, Recharts |
| **Backend** | Node.js, Express, Prisma ORM |
| **Base de données** | PostgreSQL 16 (Docker recommandé) |
| **Auth** | JWT (access + refresh), bcrypt (PIN & mots de passe) |
| **IA / Audio** | Anthropic (quiz, traduction), ElevenLabs (TTS) — optionnel |

---

## Prérequis

Installez sur votre machine :

| Outil | Version minimale | Rôle |
|-------|------------------|------|
| [Node.js](https://nodejs.org/) | **18+** (20 recommandé) | Runtime frontend & backend |
| [npm](https://www.npmjs.com/) | 9+ | Gestion des paquets |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Récent | PostgreSQL en conteneur |
| [Git](https://git-scm.com/) | 2.x | Cloner / pousser le code |

> **Important :** Docker Desktop doit être **démarré** avant de lancer la base de données.

---

## Installation pas à pas

### 1. Cloner le dépôt

```bash
git clone https://github.com/rania-kett/Averda-Academy.git
cd Averda-Academy
```

### 2. Installer les dépendances

Depuis la **racine du projet** :

```bash
npm run install:all
```

Cela installe les paquets dans `server/` et `client/`.

### 3. Créer le fichier d’environnement serveur

```bash
copy server\.env.example server\.env
```

Sous Linux / macOS :

```bash
cp server/.env.example server/.env
```

Éditez `server/.env` (voir section [Configuration](#configuration-variables-denvironnement)).

### 4. Démarrer PostgreSQL avec Docker

**Si le conteneur existe déjà** (nom `averda-academy-db`) :

```bash
docker start averda-academy-db
```

**Sinon, créez-le une première fois** :

```bash
docker run -d ^
  --name averda-academy-db ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=averda_academy ^
  -p 5434:5432 ^
  postgres:16
```

(Linux/macOS : remplacez `^` par `\` en fin de ligne.)

Vérifiez que le conteneur tourne :

```bash
docker ps
```

### 5. Appliquer les migrations Prisma

```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

### 6. Charger les données de démonstration (seed)

```bash
npx prisma db seed
```

Le seed crée **5 employés**, **1 administrateur**, les **catégories**, le **catalogue EPI** et conserve les cours existants en base.

---

## Configuration (variables d’environnement)

Fichier : `server/.env` (ne jamais committer ce fichier).

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Oui | Ex. `postgresql://postgres:postgres@127.0.0.1:5434/averda_academy` |
| `JWT_SECRET` | Oui | Secret pour les tokens d’accès |
| `JWT_REFRESH_SECRET` | Oui | Secret pour les refresh tokens |
| `SETTINGS_SECRET` | Oui | Chiffrement AES des clés API en base |
| `PORT` | Non | Port API (défaut **3001**) |
| `CLIENT_URL` | Non | URL Vite (défaut `http://localhost:5173`) |
| `UPLOAD_DIR` | Non | Dossier uploads (défaut `./uploads`) |
| `ANTHROPIC_API_KEY` | Non | Fallback si non défini dans l’UI admin |
| `ELEVENLABS_API_KEY` | Non | Fallback TTS |
| `GEMINI_API_KEY` | Non | Fonctions optionnelles Gemini |

Exemple minimal :

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5434/averda_academy"
JWT_SECRET="changez-moi-en-production"
JWT_REFRESH_SECRET="changez-moi-aussi"
SETTINGS_SECRET="secret-long-pour-chiffrement-settings"
PORT=3001
CLIENT_URL=http://localhost:5173
```

Côté client, `client/.env` peut rester vide en dev : Vite proxy `/api` → `http://localhost:3001`.

---

## Lancement de l’application

### Méthode recommandée (racine du projet)

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| **Interface (Vite)** | http://localhost:5173 |
| **API (Express)** | http://localhost:3001 |
| **Santé API** | http://localhost:3001/health |

### Ne lancez pas uniquement le client

Si vous faites seulement `cd client && npm run dev`, les appels `/api` échoueront. **Toujours** `npm run dev` depuis la racine (sauf build de production).

### Build production (client)

```bash
cd client
npm run build
```

---

## Comptes de démonstration

### Employés — code PIN : `1234`

| Matricule | Nom | Rôle (seed) |
|-----------|-----|-------------|
| `AV000001` | يوسف العلوي | Conducteur |
| `AV000002` | كريم بنعلي | Chargeur |
| `AV000003` | أمين الراشدي | Maintenance |
| `AV000004` | سعيد المنصوري | Balayeur |
| `AV000005` | هشام التازي | Chef d’équipe |

**Connexion employé :** http://localhost:5173 → saisir les 6 chiffres du matricule + PIN sur le clavier.

### Administrateur

| Champ | Valeur |
|-------|--------|
| **URL** | http://localhost:5173/admin/login |
| **Email** | `admin@averda.ma` |
| **Mot de passe** | `Admin@2026` |

> Changez ces identifiants en production.

---

## Clés API (optionnel)

Sans clés, l’app fonctionne ; la génération de quiz IA et la synthèse vocale nécessitent des clés valides.

1. Connectez-vous en **admin**.
2. Ouvrez **الإعدادات / Paramètres** (onglet dans le tableau de bord).
3. Saisissez et enregistrez :
   - **Anthropic** — génération de quiz & traduction
   - **ElevenLabs** — synthèse vocale des cours
4. Utilisez **اختبار الاتصال / Tester la connexion** pour valider.

Les clés sont **chiffrées** en base (`AppSettingKey`) ; l’interface n’affiche jamais la valeur complète.

---

## Structure du projet

```
Averda-Academy/
├── client/                 # Frontend React (Vite)
│   ├── public/
│   │   ├── averda_logo.png # Logo (README & UI)
│   │   └── courses/        # PDF des cours (dev)
│   └── src/
│       ├── pages/          # Login, Home, Admin dashboard…
│       ├── components/     # UI, EPI, admin…
│       └── api/            # Client Axios
├── server/                 # Backend Express
│   ├── prisma/
│   │   ├── schema.prisma   # Modèle de données
│   │   ├── migrations/     # Migrations SQL
│   │   └── seed.ts         # Données de démo
│   └── src/
│       ├── routes/         # auth, admin, epi, quiz…
│       └── services/       # IA, clés API, quiz…
├── package.json            # npm run dev (les deux apps)
└── README.md               # Ce fichier
```

### Routes admin principales

| Chemin | Description |
|--------|-------------|
| `/admin` | Tableau de bord (onglets : employés, EPI, cours, analytics, paramètres) |
| `/admin/login` | Connexion administrateur |
| `/admin/settings` | Paramètres (même shell que le dashboard) |
| `/admin/epi` | Redirige vers `/admin` (EPI = onglet « معدات ») |

---

## Commandes utiles

| Commande | Où | Action |
|----------|-----|--------|
| `npm run dev` | Racine | API + frontend en développement |
| `npm run install:all` | Racine | Installe server + client |
| `npx prisma migrate deploy` | `server/` | Applique les migrations |
| `npx prisma db seed` | `server/` | Réinitialise employés + EPI (préserve admin/cours) |
| `npx prisma studio` | `server/` | Interface visuelle BDD |
| `npm run build` | `client/` | Build production frontend |

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Échec de connexion / « identifiants incorrects » avec bon PIN | Vérifiez que l’API tourne : `npm run dev` à la **racine**, pas seulement le client. |
| `EADDRINUSE` port 3001 | Arrêtez l’ancien processus Node ou fermez le terminal qui occupe le port. |
| `ECONNREFUSED` / proxy Vite | Le serveur sur 3001 n’est pas démarré. |
| Base de données inaccessible | `docker start averda-academy-db` puis vérifiez `DATABASE_URL`. |
| Port 5432 déjà utilisé (PostgreSQL Windows) | Utilisez le port **5434** pour Docker (`-p 5434:5432`) et `DATABASE_URL` avec `:5434`. |
| PDF des cours introuvable | Placez les PDF dans `client/public/courses/` (structure par rôle). |
| En-tête coupé ou espace blanc sous la barre mobile | Utilisez un navigateur récent ; l’app gère `viewport-fit=cover` et la hauteur visible. Rechargez après `npm run dev`. |

Test API rapide :

```bash
curl http://localhost:3001/health
```

Réponse attendue : `{"ok":true}`

---

## Sécurité & bonnes pratiques

- Ne commitez **jamais** `server/.env` ni de clés API.
- En production : HTTPS, secrets forts, mots de passe admin changés.
- Les fichiers uploadés sont dans `server/uploads/` (ignoré par Git).
- `node_modules/` et `dist/` ne doivent pas être versionnés.

---

## Dernières améliorations

| Domaine | Détail |
|---------|--------|
| **Mobile (employé)** | Shell `position: fixed` calé sur le viewport visible ; safe areas iOS/Android ; défilement interne sans gap sous la barre du bas. |
| **Navigation** | Retour cours/quiz avec repli vers `/courses` ; abandon quiz ; ancres `#badges` ; FAB urgence (tap vs glisser). |
| **Admin dashboard** | Filtre groupe conducteur/ouvrier ; scores d’évaluation réels ; cooldown rappel assessment (HTTP 429) ; onglet paramètres synchronisé avec l’URL. |
| **Modales admin** | Fermeture par fond, ✕, Échap (cours, EPI, paramètres). |
| **Onboarding Averda** | Correction des arrière-plans sur la dernière étape (FR/EN). |
| **Base de données** | Port Docker **5434** par défaut (évite conflit avec PostgreSQL Windows sur 5432). |

---

## Dépôt & contribution

- **Repository :** [https://github.com/rania-kett/Averda-Academy](https://github.com/rania-kett/Averda-Academy)
- **Branche principale :** `main`
- Projet Averda — formation & sécurité au travail (usage interne).

---

<p align="center">
  <img src="client/public/averda_logo.png" alt="Averda" width="120" /><br/>
  <sub>© Averda — Averda Academy · Formation & sécurité au travail</sub>
</p>
