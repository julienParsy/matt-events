# Matt'events

Site de location de matériel événementiel (son, lumière, vidéo) : **mattevents.fr**.

Les visiteurs parcourent le catalogue, remplissent un panier et envoient une **demande de location**. L'équipe traite ensuite la demande depuis l'**administration** : devis, bon de commande et facture sont générés en PDF.

---

## Sommaire

1. [Fonctionnalités](#fonctionnalités)
2. [Stack technique](#stack-technique)
3. [Architecture du dépôt](#architecture-du-dépôt)
4. [Se repérer dans le code : `@feature`](#se-repérer-dans-le-code--feature)
5. [Installation locale](#installation-locale)
6. [Variables d'environnement](#variables-denvironnement)
7. [Base de données](#base-de-données)
8. [API](#api)
9. [Documents PDF et facturation](#documents-pdf-et-facturation)
10. [E-mails](#e-mails)
11. [Déploiement](#déploiement)
12. [Sécurité](#sécurité)
13. [Conventions](#conventions)

---

## Fonctionnalités

### Site public

| Page | Adresse | Rôle |
| --- | --- | --- |
| Accueil | `/` | Présentation, types d'événements, raccourcis vers les catégories |
| Boutique | `/shop` | Catalogue des produits et des packs : onglets par catégorie, filtre par sous-catégorie (packs), recherche, tri par prix, tranches de budget, vidéos YouTube |
| Panier | `/panier` | Quantités, annulation d'une suppression, formulaire « Faire une demande » (coordonnées, date, retrait ou livraison, reCAPTCHA) |
| Contact | `/contact` | Formulaire de contact protégé par reCAPTCHA |
| À propos, Confidentialité, Mentions légales | `/a-propos`, `/confidentialite`, `/mentions-legales` | Pages au contenu modifiable depuis l'admin |

Les filtres de la boutique sont dans l'adresse (`/shop?cat=son&prix=25-50`) : un lien filtré peut donc être partagé. Le site propose un thème clair et un thème sombre ; chaque page a ses balises SEO, et un `sitemap.xml` est fourni.

### Administration

Pour accéder à la connexion (`/login`), qui n'a pas de lien visible : **Ctrl + Alt + A** sur ordinateur, ou **5 appuis rapides** sur la ligne « © » du pied de page sur mobile.

| Page | Adresse | Rôle |
| --- | --- | --- |
| Produits & packs | `/admin` | Ajout, modification et suppression ; images envoyées sur Firebase Storage ; liens vidéo |
| Catégories | `/admin/categories` | Catégories de produits et sous-catégories de packs |
| Demandes | `/admin/demandes` | Suivi des demandes (statut, frais) et génération des documents : demande, devis, bon de commande, facture |
| Factures | `/admin/factures` | Factures et avoirs émis : nouveau téléchargement, correction, annulation |
| Utilisateurs | `/admin/utilisateurs` | Comptes admin et rôles (réservé au **superadmin**) |
| Paramètres | `/admin/parametres` | Changer son e-mail et son mot de passe |
| Logo | `/admin/logo` | Logo du site (barre de navigation et favicon) |

Les pages éditables se modifient directement sur la page elle-même, avec l'éditeur TinyMCE.

---

## Stack technique

| | |
| --- | --- |
| **Frontend** | React 19, Vite 6, React Router 7, CSS Modules, axios, TinyMCE, lucide-react, react-toastify |
| **Backend** | Node.js, Express 4, PostgreSQL (`pg`), JWT, bcrypt, PDFKit, Nodemailer / API Brevo, helmet, express-rate-limit |
| **Services** | Firebase Storage (images), Google reCAPTCHA v2, Brevo (e-mails en production) |
| **Hébergement** | Vercel (frontend), Railway (backend et PostgreSQL) |

---

## Architecture du dépôt

```text
Matt'events/
├── backend/                 API Express (Railway)
│   ├── index.js             Point d'entrée : démarre le serveur
│   ├── app.js               Sécurité HTTP, CORS, uploads, montage des routes
│   ├── config/              Variables d'environnement, connexion BDD, JWT, constantes
│   ├── middleware/          Authentification, reCAPTCHA, gestion des erreurs
│   ├── routes/              Une route par ressource (/api/...)
│   ├── controllers/         Lecture de la requête → appel du service → réponse
│   ├── services/            Logique métier (demandes, factures, e-mails…)
│   ├── models/              Requêtes SQL
│   ├── pdf/                 Génération des documents
│   │   ├── generators/      Un fichier par document (demande, devis, facture, avoir, bon de commande)
│   │   ├── pdfConstants.js  Coordonnées, couleurs, conditions, tarifs imprimés
│   │   └── pdfHelpers.js    Montants, dates, calcul des totaux
│   ├── assets/              Logos utilisés dans les PDF
│   ├── scripts/             Outils en ligne de commande
│   └── utils/               Petits utilitaires (liens vidéo, hash de mot de passe)
│
└── frontend/                Site React (Vercel)
    ├── index.html           Balises SEO par défaut, thème appliqué avant le premier affichage
    ├── public/              Logo clair, image de partage, robots.txt, sitemap.xml
    └── src/
        ├── App.jsx          Routes du site et panier partagé
        ├── main.jsx         Point d'entrée React
        ├── components/
        │   ├── admin/       Briques de l'admin (en-tête, navigation, formulaires, fenêtres d'édition)
        │   ├── cart/        Panier et formulaire de demande
        │   ├── catalog/     Cartes, filtres, fenêtres produit et vidéo
        │   ├── content/     Pages éditables et leur éditeur
        │   ├── layout/      Barre de navigation, pied de page, SEO, défilement
        │   └── ui/          Composants génériques (fenêtre modale, rangée défilante)
        ├── pages/           Une page par route (suffixe « Page »)
        │   └── admin/       Pages de l'administration
        ├── contexts/        Session admin (AuthContext / AuthProvider)
        ├── hooks/           Logique réutilisable (catalogue, thème, logo, formulaire de demande)
        ├── services/        Clients externes : API (axios), Firebase
        ├── utils/           Fonctions pures (panier, prix, vidéos, PDF, images)
        ├── data/            Données statiques
        └── styles/          global.css, _variables.css, puis components/ et pages/
```

Côté backend, une requête passe par **route → controller → service → model** : la route déclare l'adresse et les protections, le contrôleur lit la requête et formule la réponse, le service porte les règles métier et le modèle exécute le SQL.

Côté frontend, le code de l'admin (éditeurs, Firebase, factures…) est **chargé à la demande** : les visiteurs ne le téléchargent jamais.

---

## Se repérer dans le code : `@feature`

Chaque fichier source commence par une étiquette qui indique la ou les fonctionnalités auxquelles il appartient :

```js
// @feature demandes, pdf — Demandes de location : envoi depuis le panier, suivi admin et documents PDF (/api/demande)
```

```css
/* @feature panier — Tableau du panier */
```

Pour retrouver tous les fichiers d'une fonctionnalité, front et back confondus :

```bash
git grep -lE "@feature ([a-z]+, )*panier\b"
```

Dans VS Code : recherche globale (Ctrl + Maj + F) avec l'expression régulière `@feature ([a-z]+, )*panier\b`.

| Étiquette | Contenu |
| --- | --- |
| `accueil` | Page d'accueil |
| `catalogue` | Produits, packs, boutique, filtres, vidéos, administration du catalogue |
| `categories` | Catégories de produits et sous-catégories de packs |
| `panier` | Panier, formulaire de demande et validation côté serveur |
| `demandes` | Demandes de location, devis, bons de commande, suivi dans l'admin |
| `factures` | Factures et avoirs (numérotation, correction, annulation) |
| `pdf` | Mise en page et génération des documents PDF |
| `email` | Envoi des e-mails et diagnostic de la messagerie |
| `contact` | Formulaire de contact |
| `pages` | Pages éditables (À propos, Confidentialité, Mentions légales) |
| `auth` | Connexion, jeton JWT, mot de passe oublié |
| `comptes` | Comptes admin, rôles, changement d'e-mail ou de mot de passe |
| `logo` | Logo du site |
| `seo` | Titre, description, balises canoniques et de partage |
| `layout` | Barre de navigation, pied de page, thème, défilement |
| `admin` | Interface commune de l'administration |
| `ui` | Composants et styles génériques |
| `core` | Démarrage, configuration, client HTTP, BDD, erreurs |

Dans les contrôleurs des demandes, factures, produits, packs et pages, la route servie est indiquée au-dessus de chaque fonction (`/** POST /api/demande/:id/devis : devis PDF */`).

---

## Installation locale

### Prérequis

- **Node.js 22** (version imposée par `frontend/package.json` ; le backend tourne en Node 20+)
- **pnpm** pour le frontend : `corepack enable` suffit, la version est fixée dans `package.json`
- **PostgreSQL**, avec une base contenant les tables décrites [plus bas](#base-de-données)
- Un projet **Firebase** (Storage) et des clés **reCAPTCHA v2**

### Backend

```bash
cd backend
npm install
# créer backend/.env (voir « Variables d'environnement »)
npm start                    # node index.js
```

L'API écoute sur `PORT` (3000 par défaut ; le `.env` local utilise 3001). Au démarrage, la console liste les variables manquantes (noms seulement, jamais les valeurs) et teste la messagerie.

### Frontend

```bash
cd frontend
pnpm install
# créer frontend/.env (voir « Variables d'environnement »)
pnpm dev                     # http://localhost:5173
```

Autres commandes : `pnpm build` (production dans `dist/`), `pnpm preview` (sert le build), `pnpm lint`.

### Créer le premier compte admin

Les comptes se créent depuis l'admin, mais le tout premier se crée à la main :

```bash
cd backend
node utils/hashPassword.js "MotDePasse!2026"     # affiche le hash bcrypt
```

```sql
INSERT INTO admins (email, mot_de_passe_hash, role)
VALUES ('vous@example.com', '<hash affiché>', 'superadmin');
```

Mot de passe exigé : au moins 10 caractères, avec une majuscule, un chiffre et un caractère spécial.

---

## Variables d'environnement

Les fichiers `.env` ne sont pas versionnés. En production, les valeurs se saisissent dans les panneaux Railway et Vercel.

### `backend/.env`

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `DATABASE_URL` | oui | Connexion PostgreSQL (`postgresql://user:pass@host:5432/base`) |
| `JWT_SECRET` | oui | Clé de signature des sessions admin (aucune valeur par défaut) |
| `RECAPTCHA_SECRET` | oui | Clé secrète reCAPTCHA v2 (alias : `RECAPTCHA_SECRET_KEY`) |
| `CORS_ORIGINS` | oui* | Origines autorisées, séparées par des virgules. `*.vercel.app` accepte les prévisualisations Vercel |
| `CLIENT_URL` | oui* | Adresse du site, utilisée dans le lien de réinitialisation du mot de passe (et pour le CORS si `CORS_ORIGINS` est absent) |
| `BREVO_API_KEY` | oui** | Envoi des e-mails par l'API Brevo (alias : `APIKEY_BREVO`) |
| `EMAIL_USER`, `EMAIL_PASS` | oui** | Compte mail SMTP (adresse complète et mot de passe) |
| `SMTP_HOST`, `SMTP_PORT` | non | Serveur SMTP (défaut : `smtp.mail.ovh.net` / `587`) |
| `MAIL_PROVIDER` | non | Force `brevo` ou `smtp` (sinon : Brevo si la clé est présente) |
| `FROM_EMAIL` | non | Adresse d'expédition (défaut : `EMAIL_USER`) |
| `MAIL_SENDER_NAME` | non | Nom affiché de l'expéditeur (défaut : Matt'events) |
| `EMAIL_TO` | non | Destinataire des demandes et des messages de contact (alias : `EMAIL_RECEIVER` ; défaut : `EMAIL_USER`) |
| `PORT` | non | Port HTTP (défaut : 3000) |
| `NODE_ENV` | non | `production` désactive les routes de diagnostic |
| `ENABLE_DEBUG_ROUTES` | non | `true` réactive `/api/debug` en production |
| `ENV_FILE` | non | Chemin d'un autre fichier `.env` à charger |

\* `CORS_ORIGINS` ou `CLIENT_URL` ; les deux sont recommandées.
\** `BREVO_API_KEY` **ou** `EMAIL_USER` + `EMAIL_PASS`. **En production, Brevo est obligatoire** : Railway bloque les ports SMTP sortants.

### `frontend/.env`

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `VITE_API_BASE_URL` | oui | Adresse de l'API, par ex. `http://localhost:3001` (le `/api` est ajouté automatiquement ; alias : `VITE_API_URL`) |
| `VITE_RECAPTCHA_SITE_KEY` | oui | Clé publique reCAPTCHA v2 |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_APP_ID` | oui | Projet Firebase (envoi des images depuis l'admin) |
| `VITE_TINYMCE_API_KEY` | oui | Clé de l'éditeur TinyMCE (pages éditables) |
| `VITE_RECAPTCHA_V3_SITE_KEY` | non | Active Firebase App Check |
| `VITE_USE_EMULATORS` | non | `true` : utilise l'émulateur Firebase Storage en local |

Les variables `VITE_*` sont lues **au moment du build** : après une modification dans Vercel, il faut redéployer.

---

## Base de données

PostgreSQL. Le dépôt ne contient pas de script de création global ; seule la table `factures` est créée et mise à jour automatiquement par le backend (`services/factureService.js`).

| Table | Contenu |
| --- | --- |
| `produits` | Articles du catalogue (nom, modèle, prix, stock, image, liens vidéo, catégorie) |
| `categories` | Catégories de produits |
| `packs` | Packs (nom, description, prix, stock, image, vidéo, sous-catégorie) |
| `pack_products` | Composition des packs (produit, quantité) |
| `sous_categories` | Sous-catégories de packs |
| `demandes` | Demandes de location (client, articles, date, statut, frais, adresse) |
| `factures` | Factures et avoirs (numéro, type, statut, contenu figé, total, document d'origine) |
| `admins` | Comptes admin (e-mail, hash du mot de passe, rôle, jeton de réinitialisation) |
| `pages` | Pages éditables (`slug`, titre, contenu HTML) |
| `logo_site` | Adresse du logo du site |

---

## API

Toutes les routes sont préfixées par `/api`. 🔒 = jeton admin requis (`Authorization: Bearer …`), 👑 = superadmin uniquement.

| Méthode | Route | Rôle |
| --- | --- | --- |
| **Catalogue** | | |
| GET | `/products`, `/products/grouped` | Produits (bruts / rangés par catégorie) |
| POST, PUT, DELETE | `/products`, `/products/:id` | 🔒 Gestion des produits |
| GET | `/packs`, `/packs/:id` | Packs et leur composition |
| POST, PUT, DELETE | `/packs`, `/packs/:id` | 🔒 Gestion des packs |
| GET | `/categories`, `/sous-categories` | Listes publiques |
| POST, PUT, DELETE | `/categories[/:id]`, `/sous-categories[/:id]` | 🔒 Gestion |
| **Demandes** | | |
| POST | `/demande` | Envoi d'une demande depuis le panier (reCAPTCHA, 3 par minute et par IP) |
| GET | `/demande`, `/demande/:id` | 🔒 Liste / détail |
| PUT | `/demande/:id`, `/demande/:id/frais` | 🔒 Statut / frais |
| DELETE | `/demande/:id` | 🔒 Suppression |
| GET | `/demande/:id/pdf` | 🔒 PDF de la demande |
| POST | `/demande/:id/devis`, `/demande/:id/bonCommande`, `/demande/:id/facture` | 🔒 Devis, bon de commande, facture (ou aperçu) |
| **Factures** | | |
| GET | `/factures`, `/factures/:id`, `/factures/:id/pdf` | 🔒 Liste, contenu, PDF identique à l'original |
| POST | `/factures/apercu` | 🔒 Aperçu sans numéro |
| POST | `/factures/:id/corriger`, `/factures/:id/annuler` | 🔒 Avoir + nouvelle facture / avoir seul |
| **Comptes et authentification** | | |
| POST | `/auth/login`, `/auth/forgot-password`, `/auth/reset-password/:token` | Connexion (limitée contre la force brute), réinitialisation par e-mail |
| GET, POST, DELETE, PATCH | `/admins`, `/admins/:id`, `/admins/:id/role` | 👑 Gestion des comptes |
| POST | `/admins/change-email`, `/admins/change-password` | 🔒 Son propre compte |
| GET / POST | `/admins/logo` | Logo du site (lecture publique / 🔒 modification) |
| **Divers** | | |
| GET / PUT | `/pages/:slug` | Pages éditables (lecture publique / 🔒 modification) |
| POST | `/contact` | Message de contact (reCAPTCHA, 3 par minute et par IP) |
| GET | `/health` (sans `/api`) | Healthcheck pour Railway |
| GET | `/debug/smtp`, `/debug/mail` | Diagnostic de la messagerie (hors production) |

---

## Documents PDF et facturation

Tous les documents partagent la même mise en page (`pdf/generators/generateBasePDF.js`) :

| Document | Quand | Particularités |
| --- | --- | --- |
| **Demande** | À l'envoi du panier | Envoyée par e-mail à Matt'events, téléchargée par le client, avec la grille tarifaire |
| **Devis** | Depuis l'admin | Valable jusqu'à quelques jours avant l'événement, avec une zone de signature |
| **Bon de commande** | Depuis l'admin | Lien de paiement en ligne des arrhes |
| **Facture** | Depuis l'admin | Série continue `F-AAAA-NNNN` |
| **Avoir** | Correction ou annulation | Série continue `AV-AAAA-NNNN`, annule la facture d'origine en totalité |

Les coordonnées, couleurs, conditions, taux d'arrhes et tarifs imprimés se modifient dans `backend/pdf/pdfConstants.js`.

**Règles de facturation** (`backend/services/factureService.js`) :

- les numéros se suivent sans trou et ne sont jamais réutilisés ;
- le contenu de la facture est enregistré à l'émission : un nouveau téléchargement redonne toujours le même PDF ;
- une facture émise ne se modifie jamais : pour la corriger, un avoir l'annule et une nouvelle facture la remplace ;
- supprimer une demande ne supprime pas ses factures ;
- l'aperçu (filigrane « APERÇU ») n'enregistre rien et ne consomme aucun numéro.

Le serveur relit toujours les prix dans le catalogue : il ne se fie pas aux montants envoyés par le navigateur.

---

## E-mails

`backend/services/emailService.js` gère deux fournisseurs :

- **Brevo** (API HTTPS) : obligatoire en production, Railway bloquant le SMTP ;
- **SMTP** (OVH par défaut) : pratique en local.

Pour vérifier la configuration :

```bash
cd backend
node scripts/checkMail.js
```

Le backend teste aussi la messagerie à chaque démarrage et écrit le résultat dans les logs (`[mail] Fournisseur "brevo" opérationnel.`).

---

## Déploiement

Un push sur `main` redéploie automatiquement les deux parties.

### Backend — Railway

- Construit avec `backend/Dockerfile` (Node 20, `npm ci --omit=dev`, `node index.js`).
- PostgreSQL est hébergé sur Railway (`DATABASE_URL`).
- Renseigner les [variables du backend](#backendenv), avec `NODE_ENV=production` et `BREVO_API_KEY`.
- Healthcheck : `GET /health`.

### Frontend — Vercel

- Dossier racine : `frontend`, build `pnpm build`, sortie `dist`.
- `frontend/vercel.json` renvoie toutes les adresses vers `index.html` (sauf `robots.txt` et `sitemap.xml`) et met en cache longue durée les fichiers JS, CSS et images.
- Renseigner les [variables du frontend](#frontendenv) pour **Production** et **Preview**, puis redéployer.

### Après un déploiement

1. Ouvrir le site dans une fenêtre privée et vérifier que l'accueil et la boutique s'affichent.
2. En cas de page blanche, ouvrir la console du navigateur (F12) : une erreur JavaScript bloque le rendu.
3. Vérifier `https://<api>/health` et les logs Railway (variables manquantes, messagerie).

---

## Sécurité

- Sessions admin par jeton JWT, rôles `admin` et `superadmin` vérifiés côté serveur.
- Mots de passe hashés avec bcrypt ; politique imposée côté client et côté serveur.
- Limitation des tentatives : connexion (10 échecs / 15 min / IP), mot de passe oublié, demandes et contact.
- reCAPTCHA v2 sur les formulaires publics.
- En-têtes de sécurité avec helmet (CSP), CORS restreint aux origines déclarées.
- Erreurs : détail complet dans les logs, message générique pour le visiteur.
- Aucun secret dans le code : tout passe par les variables d'environnement.

---

## Conventions

- **Fichiers** : composants et pages en `PascalCase.jsx`, pages suffixées `Page` ; hooks en `useXxx.js` ; utilitaires et backend en `camelCase.js` ; styles `NomDuComposant.module.css`.
- **Vocabulaire** : les termes métier restent en français (`demande`, `facture`, `avoir`, `sousCategorie`), comme dans la base et l'API.
- **Commentaires** : une étiquette `@feature` en tête de fichier ; ensuite, on ne commente que le *pourquoi* (règle métier, contrainte, piège), pas ce que le code dit déjà.
- **Frontend** : pnpm uniquement.

---

## Licence

Copyright © 2025 Julien Parsy — tous droits réservés. Voir [LICENCE](LICENCE).
