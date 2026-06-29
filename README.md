<p align="center">
  <img src="client/public/averda_logo.png" alt="Averda Academy" width="220" />
</p>

# Averda Academy — Plateforme de formation & sécurité

**Plateforme web pour Averda Maroc** : formation des employés, évaluation sécurité HSSEQ, gestion des EPI (équipements de protection individuelle), certificats et suivi administratif.

| | |
|---|---|
| **Site recommandé (production)** | **https://averdaacademy.ma** |
| **Langues** | العربية · Français · English |
| **Public** | Employés terrain + administrateurs RH / HSE |

![Tests](https://img.shields.io/badge/tests-129%20passing-brightgreen)
![Server](https://img.shields.io/badge/server-Node.js%2020-blue)
![Client](https://img.shields.io/badge/client-React%2018-61dafb)
![Database](https://img.shields.io/badge/database-PostgreSQL%2016-336791)

---

## Table des matières

### Pour tous (utilisateurs)
1. [Qu’est-ce que Averda Academy ?](#1-quest-ce-que-averda-academy-)
2. [Qui utilise quoi ?](#2-qui-utilise-quoi-)
3. [Guide employé — pas à pas](#3-guide-employé--pas-à-pas)
4. [Guide administrateur — pas à pas](#4-guide-administrateur--pas-à-pas)
5. [Identifiants de démonstration](#5-identifiants-de-démonstration)
6. [Questions fréquentes](#6-questions-fréquentes)

### Pour l’équipe IT / déploiement
7. [Installation sur un ordinateur (développement)](#7-installation-sur-un-ordinateur-développement)
8. [Mise en ligne — déployer sur **averdaacademy.ma**](#8-mise-en-ligne--déployer-sur-averdaacademym)
9. [Vercel, domaine et hébergement — ce qu’il faut savoir](#9-vercel-domaine-et-hébergement--ce-quil-faut-savoir)
10. [Checklist avant ouverture au public](#10-checklist-avant-ouverture-au-public)
11. [Référence technique (développeurs)](#11-référence-technique-développeurs)

---

## 1. Qu’est-ce que Averda Academy ?

**Averda Academy** est une application web (site internet) utilisée par les équipes Averda au Maroc pour :

| Fonction | Explication simple |
|----------|-------------------|
| **Former les employés** | Lire des cours PDF (sécurité, procédures) selon le métier (chauffeur, balayeur, collecte, etc.) |
| **Vérifier les connaissances** | Quiz après les cours + évaluation sécurité obligatoire au début |
| **Délivrer des certificats** | PDF de fin de formation quand les cours sont terminés |
| **Gérer les EPI** | Casques, gants, chaussures… : ce qui est attribué, reçu, à renouveler |
| **Piloter côté bureau** | Tableau de bord pour RH, HSE et managers : employés, stats, exports Excel |

L’application fonctionne sur **téléphone, tablette et ordinateur**. L’interface employé est pensée pour le **mobile** (navigation en bas de l’écran).

---

## 2. Qui utilise quoi ?

### 👷 Portail employé

**Pour qui :** chauffeurs, agents de collecte, balayeurs, maintenance, agents de parc, chefs d’équipe…

**Adresse :**  
- En production : **https://averdaacademy.ma/login**  
- En test local : http://localhost:5173/login

**Connexion :** numéro de matricule (ex. `AV000001`) + code PIN à 4 chiffres.

### 🖥️ Portail administrateur

**Pour qui :** responsables RH, HSE, formation, IT.

**Adresse :**  
- En production : **https://averdaacademy.ma/admin/login**  
- En test local : http://localhost:5173/admin/login

**Connexion :** adresse e-mail professionnelle + mot de passe.

---

## 3. Guide employé — pas à pas

### Étape 1 — Ouvrir le site

1. Ouvrez Chrome ou Safari sur votre téléphone ou PC.
2. Allez sur **https://averdaacademy.ma/login** (ou le lien fourni par votre entreprise).
3. Choisissez votre langue en haut : **العربية** · **Français** · **English**.

### Étape 2 — Se connecter

1. Saisissez votre **numéro de matricule** (ex. `AV000001`).
2. Saisissez votre **PIN à 4 chiffres** avec le clavier à l’écran.
3. Appuyez sur **دخول / Connexion**.

> **Problème ?** Si le message dit que le matricule ou le code est incorrect : vérifiez le matricule, demandez un nouveau PIN à votre responsable, ou assurez-vous d’avoir une connexion internet.

### Étape 3 — Évaluation sécurité (obligatoire la première fois)

Avant d’accéder aux formations, vous devez répondre à **10 questions de sécurité HSSEQ**.

- Il faut **au moins 70 %** de bonnes réponses pour continuer.
- Si vous échouez, vous pouvez réessayer.
- Une fois réussi, les cours de votre métier s’ouvrent.

### Étape 4 — Suivre une formation

1. Onglet **Accueil / Cours** : liste des formations pour votre poste.
2. Ouvrez un cours → lisez le PDF (vous pouvez zoomer).
3. Marquez votre progression ; certains cours ont un **quiz** à la fin.
4. En cas de réussite : **badge** et parfois **certificat** téléchargeable depuis votre profil.

### Étape 5 — EPI (équipements de protection)

Dans votre **profil** ou la section EPI :

- Voir ce qui vous a été **attribué** (taille, date).
- **Confirmer la réception** quand vous recevez un équipement.
- Demander un **renouvellement** si l’équipement est usé, perdu ou ne convient pas.

### Étape 6 — Profil et sécurité

- **Changer la langue** : préférence enregistrée pour la prochaine connexion.
- **Changer le PIN** : depuis le profil, après les badges (ancien PIN + nouveau PIN à 4 chiffres).
- **Notifications** : rappels (évaluation, EPI, etc.).

### Navigation (barre du bas)

| Onglet | Rôle |
|--------|------|
| Accueil | Vue d’ensemble, raccourcis |
| Cours | Catalogue de formations |
| Défis | Challenges (si activés) |
| Badges | Récompenses obtenues |
| Profil | Certificat, EPI, PIN, langue |

---

## 4. Guide administrateur — pas à pas

### Étape 1 — Connexion

1. Allez sur **https://averdaacademy.ma/admin/login**
2. Entrez l’e-mail admin et le mot de passe.
3. Vous arrivez sur le **tableau de bord principal**.

### Étape 2 — Tableau de bord

- **Indicateurs** : nombre d’employés, formations en cours, alertes EPI, etc.
- **Fil d’activité** : dernières actions sur la plateforme.
- **Export Excel** : télécharger des données pour reporting.

### Étape 3 — Gestion des employés

- **Rechercher** par nom ou matricule.
- **Filtrer** par métier (chauffeur, balayeur…) ou statut (actif / inactif).
- **Ajouter** un employé : matricule, nom, métier, PIN initial.
- **Modifier** : nom, langue, numéro de camion (chauffeurs).
- **Désactiver** un compte ou **réinitialiser** sa progression formation.
- **Supprimer** un employé (avec confirmation — action irréversible).

### Étape 4 — Formations (cours)

- Créer / modifier des cours, associer un PDF.
- Lier chaque cours aux **métiers** concernés.
- Générer des **quiz par IA** (nécessite une clé API Anthropic dans Paramètres).

### Étape 5 — EPI

- **Catalogue** : liste des équipements (codes, durée de vie).
- **Attribution** : émettre un EPI à un employé.
- **Calendrier d’expiration** : voir ce qui arrive à échéance.
- **Valider** les demandes de renouvellement.

### Étape 6 — Paramètres

- Clés API (Anthropic, ElevenLabs, Gemini) pour quiz IA et audio.
- Thème clair / sombre, langue de l’interface admin.

> **Important :** changez le mot de passe admin par défaut avant la mise en production.

---

## 5. Identifiants de démonstration

> ⚠️ **Uniquement pour tests / formation interne.** Ne jamais laisser ces codes en production.

| Rôle | Identifiant | Code |
|------|-------------|------|
| **Admin** | `admin@averda.ma` | `Admin@2026` |
| Chauffeur (يوسف العلوي) | `AV000001` | PIN `1234` |
| Agent collecte | `AV000002` | PIN `1234` |
| Maintenance | `AV000003` | PIN `1234` |
| Balayeur | `AV000004` | PIN `1234` |
| Chef d’équipe | `AV000005` | PIN `1234` |

---

## 6. Questions fréquentes

**Je n’arrive pas à me connecter.**  
→ Vérifiez matricule et PIN. Si le site ne répond pas du tout, l’application n’est peut‑être pas en ligne : contactez l’IT.

**Je ne vois aucun cours.**  
→ Il faut d’abord **réussir l’évaluation sécurité** (70 %). Certains métiers (ex. agent de parc) peuvent n’avoir **aucun cours** tant que l’admin n’en a pas assigné — c’est normal.

**Le certificat ne se télécharge pas.**  
→ Tous les cours visibles doivent être terminés. Le serveur doit avoir Chrome/Chromium installé (géré automatiquement en Docker).

**Comment changer de langue ?**  
→ Bouton langue en haut (employé) ou dans les préférences (admin). العربية affiche l’interface de droite à gauche.

**Où sont stockées les données ?**  
→ Base PostgreSQL + dossier des fichiers uploadés (PDF, preuves EPI). En production, des **sauvegardes régulières** sont obligatoires.

---

## 7. Installation sur un ordinateur (développement)

*Cette section s’adresse à une personne technique (développeur ou IT) qui installe l’application sur un PC pour tests.*

### Prérequis

- **Node.js 20** ou plus récent → [nodejs.org](https://nodejs.org)
- **Docker Desktop** → [docker.com](https://www.docker.com/products/docker-desktop/) (pour la base de données)
- **Git** → [git-scm.com](https://git-scm.com)

### Étapes

```bash
# 1. Télécharger le projet
git clone https://github.com/rania-kett/Averda-Academy.git
cd Averda-Academy

# 2. Installer les dépendances
npm run install:all

# 3. Configurer l’environnement
cp server/.env.example server/.env
# Ouvrir server/.env et laisser les valeurs par défaut pour un test local

# 4. Démarrer la base de données PostgreSQL
docker compose up -d

# 5. Préparer la base (tables + utilisateurs de démo)
cd server
npx prisma migrate deploy
npx prisma generate
npx tsx scripts/upsert-demo-users.ts
cd ..

# 6. Lancer l’application
npm run dev
```

### Vérifier que tout fonctionne

| Élément | URL | Ce que vous devez voir |
|---------|-----|------------------------|
| Site employé | http://localhost:5173/login | Page de connexion |
| Site admin | http://localhost:5173/admin/login | Connexion admin |
| API | http://localhost:3011/health | `{"ok":true,...}` |

Dans le terminal, vous devez voir **les deux** messages :
- `[server] API listening on http://localhost:3011`
- `VITE ... ready`

Si seul le client démarre et la connexion échoue → le serveur API n’est pas démarré. Relancez `npm run dev`.

> ⚠️ Ne pas exécuter `docker compose down -v` : cela **efface** toutes les données de la base locale.

---

## 8. Mise en ligne — déployer sur **averdaacademy.ma**

*Guide pour mettre l’application accessible sur internet avec le nom de domaine **averdaacademy.ma**.*

### En résumé (pour décideurs)

| Élément | Recommandation |
|---------|----------------|
| **Nom de domaine** | **averdaacademy.ma** |
| **Hébergement de l’application** | Serveur cloud + **Docker** (voir ci‑dessous) |
| **Vercel** | Utile pour le **domaine / DNS** ou en complément — **pas** pour héberger seul toute l’application (voir section 9) |
| **Sécurité** | HTTPS obligatoire (`https://`) |
| **Sauvegardes** | Base de données + fichiers uploadés, chaque jour |

### Ce dont vous avez besoin

1. **Un nom de domaine** : `averdaacademy.ma` (acheté chez un registrar marocain ou international).
2. **Un serveur** (VPS) : ex. OVH, Hostinger, DigitalOcean, Hetzner (~ 10–30 €/mois).
3. **Docker** installé sur ce serveur.
4. **Une personne IT** pour exécuter les commandes ci‑dessous (1 à 2 h la première fois).

### Architecture en production

```
Internet
    │
    ▼
https://averdaacademy.ma  (certificat SSL / HTTPS)
    │
    ▼
Serveur (Docker)
    ├── Application (site + API) — port 3011
    ├── PostgreSQL (base de données)
    └── Stockage fichiers (PDF, preuves EPI)
```

L’application sert **le site web et l’API sur la même adresse** : pas besoin de configurer deux URLs différentes.

---

### Étape A — Préparer le serveur

1. Louez un VPS (Ubuntu 22.04 recommandé).
2. Connectez-vous en SSH (outil : PuTTY sur Windows, Terminal sur Mac).
3. Installez Docker :

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Se déconnecter / reconnecter
```

4. Installez Docker Compose (souvent inclus avec Docker récent).

---

### Étape B — Installer l’application sur le serveur

```bash
# Sur le serveur
git clone https://github.com/rania-kett/Averda-Academy.git
cd Averda-Academy

# Copier et éditer la configuration production
cp .env.production.example .env
nano .env   # ou un autre éditeur
```

**Dans le fichier `.env`, modifiez au minimum :**

| Variable | Exemple | Explication |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | Mot de passe fort | Mot de passe base de données |
| `DATABASE_URL` | `postgresql://postgres:VOTRE_MDP@db:5432/averda_academy` | Même mot de passe que ci‑dessus |
| `JWT_SECRET` | Chaîne aléatoire longue | Sécurité des sessions |
| `JWT_REFRESH_SECRET` | Autre chaîne longue | Sécurité des sessions |
| `SETTINGS_SECRET` | Autre chaîne longue | Chiffrement des clés API |
| `CLIENT_URL` | `https://averdaacademy.ma` | URL publique exacte |
| `RUN_SEED` | `false` en production | `true` seulement pour une démo initiale |

**Générer des secrets aléatoires (sur le serveur) :**

```bash
openssl rand -base64 32
```

Lancez la commande 3 fois pour remplir `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SETTINGS_SECRET`.

**Construire et démarrer :**

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Attendez 5–15 minutes la première fois (téléchargement + compilation).

**Vérifier :**

```bash
docker compose -f docker-compose.prod.yml ps
curl http://localhost:3011/health
```

Vous devez voir `"ok": true`.

---

### Étape C — Relier le domaine **averdaacademy.ma**

Chez votre **registrar** (là où vous avez acheté le domaine) ou dans **Vercel Domains** si le domaine y est géré :

1. Ouvrez la gestion DNS du domaine `averdaacademy.ma`.
2. Créez un enregistrement **A** :
   - **Nom / Host :** `@` (ou vide)
   - **Valeur :** l’adresse IP publique de votre serveur VPS
   - **TTL :** 300 ou 3600
3. (Optionnel) Pour `www.averdaacademy.ma`, ajoutez un **CNAME** vers `averdaacademy.ma` ou un second enregistrement **A** vers la même IP.

La propagation DNS peut prendre **15 minutes à 48 heures**.

---

### Étape D — Activer HTTPS (cadenas vert)

Sans HTTPS, les navigateurs afficheront « Non sécurisé ». Solutions simples :

**Option 1 — Caddy (recommandé, automatique)**

Installez Caddy sur le serveur ; il obtient un certificat Let's Encrypt gratuit pour `averdaacademy.ma`.

Exemple `/etc/caddy/Caddyfile` :

```
averdaacademy.ma {
    reverse_proxy localhost:3011
}
```

Puis : `sudo systemctl reload caddy`

**Option 2 — Nginx + Certbot**

Classique sur Ubuntu : nginx comme proxy vers le port 3011 + `certbot --nginx -d averdaacademy.ma`

Après HTTPS actif, vérifiez que `.env` contient bien :

```
CLIENT_URL=https://averdaacademy.ma
```

Puis redémarrez l’application :

```bash
docker compose -f docker-compose.prod.yml up -d app
```

---

### Étape E — Première utilisation en production

1. Ouvrez **https://averdaacademy.ma/admin/login**
2. Connectez-vous avec le compte admin (créé au seed ou par votre IT).
3. **Changez immédiatement** le mot de passe admin.
4. Créez les vrais comptes employés (matricules + PIN uniques).
5. Désactivez ou supprimez les comptes de démonstration.
6. Configurez les clés API dans **Paramètres** si vous utilisez les quiz IA.

### URLs finales

| Page | Adresse |
|------|---------|
| Accueil / splash | https://averdaacademy.ma |
| Connexion employé | https://averdaacademy.ma/login |
| Connexion admin | https://averdaacademy.ma/admin/login |
| Santé technique | https://averdaacademy.ma/health |

---

### Commandes utiles (maintenance)

```bash
# Voir les logs
docker compose -f docker-compose.prod.yml logs -f app

# Redémarrer après mise à jour du code
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Arrêter (sans supprimer les données)
docker compose -f docker-compose.prod.yml down

# ⚠️ NE JAMAIS utiliser -v en production (efface les volumes / données)
```

### Sauvegardes (obligatoire)

- **Base PostgreSQL :** export régulier (`pg_dump`) du conteneur `db`.
- **Fichiers :** volume Docker `averda_academy_uploads_prod` (PDF uploadés, preuves EPI).

---

## 9. Vercel, domaine et hébergement — ce qu’il faut savoir

### Pourquoi Vercel seul ne suffit pas pour cette application

**Vercel** est excellent pour des sites vitrines ou des applications simples. **Averda Academy** est plus complexe :

| Besoin | Pourquoi Vercel seul est insuffisant |
|--------|--------------------------------------|
| Base PostgreSQL permanente | Vercel ne fournit pas PostgreSQL intégré pour ce type d’app |
| API Express continue | L’API tourne en permanence sur un serveur Node, pas en fonctions éphémères |
| Génération PDF (certificats) | Nécessite **Chrome/Chromium** sur le serveur |
| Fichiers uploadés (PDF, photos EPI) | Stockage persistant sur disque |

### Rôle recommandé de Vercel pour **averdaacademy.ma**

| Usage Vercel | Recommandé ? |
|--------------|--------------|
| **Acheter / gérer le domaine** `averdaacademy.ma` | ✅ Oui |
| **DNS** : pointer le domaine vers votre serveur (enregistrement A) | ✅ Oui |
| **Héberger uniquement le frontend** + API ailleurs | ⚠️ Possible mais complexe (deux hébergeurs à synchroniser) |
| **Héberger toute l’application** | ❌ Non recommandé |

### Schéma recommandé

```
averdaacademy.ma  (domaine — peut être géré chez Vercel, OVH, etc.)
        │
        │  DNS → IP du serveur VPS
        ▼
   Serveur Docker (application complète)
```

C’est la solution **la plus simple et la plus fiable** pour une équipe non technique une fois la mise en place faite par l’IT.

### Alternative sans gérer un serveur vous‑même

Plateformes qui acceptent Docker ou Node + PostgreSQL : **Railway**, **Render**, **Fly.io**, **DigitalOcean App Platform**. Le principe reste le même : base de données + API + fichiers. Demandez à un prestataire IT de déployer le `Dockerfile` fourni dans ce projet.

---

## 10. Checklist avant ouverture au public

Cochez chaque point avant d’envoyer le lien aux employés :

- [ ] Site accessible en **https://averdaacademy.ma** avec cadenas vert
- [ ] `CLIENT_URL=https://averdaacademy.ma` dans la configuration
- [ ] Mots de passe secrets (`JWT_*`, `SETTINGS_SECRET`, base de données) **uniques et forts**
- [ ] Mot de passe **admin par défaut changé**
- [ ] PINs employés de démo **remplacés** ou comptes supprimés
- [ ] `RUN_SEED=false` en production
- [ ] Sauvegardes automatiques planifiées (base + fichiers)
- [ ] Test complet : connexion employé → évaluation → cours → certificat
- [ ] Test admin : création employé, attribution EPI, export Excel
- [ ] Clés API IA configurées (si quiz automatiques souhaités)

---

## 11. Référence technique (développeurs)

### Structure du projet

```
averda-academy/
├── client/          # Interface React (employé + admin)
├── server/          # API Node.js + Prisma
├── docker/          # Script de démarrage production
├── Dockerfile       # Image production
├── docker-compose.yml       # PostgreSQL local (dev)
└── docker-compose.prod.yml  # Stack production complète
```

### Variables d’environnement

**Développement — `server/.env`**

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5434/averda_academy
JWT_SECRET=...
JWT_REFRESH_SECRET=...
SETTINGS_SECRET=...
PORT=3011
CLIENT_URL=http://localhost:5173
```

**Production — `.env` à la racine (Docker)**

Voir `.env.production.example` — `CLIENT_URL=https://averdaacademy.ma`

### Scripts npm

| Commande | Description |
|----------|-------------|
| `npm run dev` | Développement (API + site) |
| `npm run build` | Compile client + serveur |
| `npm run start:prod` | Lance l’API + site compilé (sans Docker) |
| `npm test --workspace=server` | Tests API (106) |
| `npm test --workspace=client` | Tests interface (23) |
| `npm run test:all` | Tous les tests + E2E |

### Tests

129 tests automatisés en CI (106 serveur + 23 client). E2E Playwright : `npm run test:e2e` (avec `npm run dev` actif).

### API (extrait)

Base : `https://averdaacademy.ma/api/...` en production

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion employé |
| POST | `/api/auth/admin-login` | Connexion admin |
| GET | `/api/user/me` | Profil employé |
| GET | `/api/admin/employees` | Liste employés (admin) |
| GET | `/health` | État du serveur |

Documentation complète : `server/src/routes/`

### Règle métier

Les catégories **`parkAgent`** et **`maintenance`** peuvent afficher **0 cours** tant qu’aucun catalogue n’est assigné — comportement voulu.

### Licence

MIT — Projet Averda Academy.

---

<p align="center">
  <strong>Averda Academy</strong> — Formation, sécurité et EPI pour les équipes terrain.<br/>
  <strong>https://averdaacademy.ma</strong>
</p>
