# 🎉 Matt'events - Plateforme de location de matériel événementiel

Application web complète permettant de louer du matériel son/lumière, avec génération de devis/factures en PDF, interface admin sécurisée, et gestion du stock.

## 🚀 Stack technique

- **Frontend** : React (Vite), CSS Modules, Firebase Auth + Storage
- **Backend** : Node.js, Express.js, PostgreSQL, PDFKit, Nodemailer
- **Déploiement** : Vercel (frontend) + Railway (backend + base de données)

---

## 📦 Fonctionnalités

### 🛒 Côté public

- Parcours du catalogue par catégorie
- Ajout au panier de produits et packs
- Génération de demande de location (avec PDF automatique)
- Sélection du type de retrait/livraison
- Validation protégée par Google reCAPTCHA

### 🔐 Côté admin

- Connexion via email/mot de passe
- Gestion des produits, packs, catégories
- Téléversement des images (Firebase Storage)
- Gestion des demandes : validation, PDF devis/factures, statut
- Configuration du logo, email, et mot de passe

---

## 🧰 Installation en local

### 📁 Prérequis

- Node.js ≥ 18
- PostgreSQL
- Compte Gmail (ou SMTP équivalent pour envoi d’emails)

### ⚙️ Variables d’environnement

#### `backend/.env`

```
DATABASE_URL=postgresql://user:password@localhost:5432/matt_events
JWT_SECRET=uneCleUltraSecrete
EMAIL_USER=ton.email@gmail.com
EMAIL_PASS=motDePasseOuAppPassword
EMAIL_RECEIVER=admin@example.com
RECAPTCHA_SECRET_KEY=clé_secrète_google
FRONTEND_ORIGIN=http://localhost:5173
```

#### `frontend/.env`

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_RECAPTCHA_SITE_KEY=clé_site_google
```

---

## ▶️ Lancer en développement

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Accès :

- Frontend : [http://localhost:5173](http://localhost:5173)
- Backend : [http://localhost:3001](http://localhost:3001)

---

## 🌐 Déploiement

### Backend (Railway)

1. Créer un projet Node.js sur [https://railway.app](https://railway.app)
2. Connecter ton repo GitHub
3. Ajouter les variables `.env`
4. Déployer automatiquement

### Frontend (Vercel)

1. Connecter ton repo sur [https://vercel.com](https://vercel.com)
2. Ajouter les variables `.env` dans "Environment Variables"
3. Déploiement automatique

---

## 🗃 Base de données

Un script d’export est disponible :

```bash
cd backend/export_database_json
node export_all_tables.js
```

Tu peux également utiliser les fichiers JSON de `/seed/` pour recréer la base.

---

## 🔒 Sécurité

- Authentification via JWT côté admin
- Mots de passe hashés (`bcrypt`)
- reCAPTCHA v2 pour protéger les formulaires
- Données sensibles protégées via `.env`
- Limiteur de requêtes (`express-rate-limit`)

---

## 🤝 Crédits

- Développé dans le cadre d'un projet fullstack personnel
- Icônes, visuels et images libres ou hébergés
