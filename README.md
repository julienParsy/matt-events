# Matt'events - Plateforme de location de matériel événementiel

Application web complète permettant la gestion de la location de matériel son et lumière.  
Le projet inclut un catalogue public avec panier, une interface d’administration sécurisée et un système de génération automatique de devis et factures en PDF.

---

## Stack technique

- **Frontend** : React (Vite), CSS Modules, Firebase Auth et Storage  
- **Backend** : Node.js, Express.js, PostgreSQL, PDFKit, Nodemailer  
- **Déploiement** : Vercel (frontend), Railway (backend et base de données)  

---

## Fonctionnalités principales

### Côté public

- Consultation du catalogue par catégories  
- Ajout au panier de produits et packs  
- Génération de demandes de location avec PDF automatique  
- Sélection du mode de retrait ou livraison  
- Validation des formulaires protégée par Google reCAPTCHA  

### Côté administration

- Connexion sécurisée par email et mot de passe  
- Gestion des produits, packs et catégories  
- Téléversement d’images via Firebase Storage  
- Suivi des demandes avec génération de devis et factures en PDF  
- Gestion des paramètres du site (logo, email, mot de passe)  

---

## Installation locale

### Prérequis

- Node.js ≥ 18  
- PostgreSQL  
- Compte Gmail ou autre SMTP pour l’envoi d’emails  

### Variables d’environnement

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

### Lancer en développement

Backend :  

```bash
cd backend
npm install
npm start
```

Frontend :  

```bash
cd frontend
npm install
npm run dev
```

Accès :  

- Frontend : <http://localhost:5173>  
- Backend : <http://localhost:3001>  

---

## Déploiement

### Backend (Railway)

1. Créer un projet Node.js sur <https://railway.app>  
2. Connecter le dépôt GitHub  
3. Ajouter les variables d’environnement  
4. Déployer automatiquement  

### Frontend (Vercel)

1. Connecter le dépôt sur <https://vercel.com>  
2. Ajouter les variables d’environnement dans "Environment Variables"  
3. Déploiement automatique  

---

## Sécurité

- Authentification JWT pour l’administration  
- Mots de passe hashés avec bcrypt  
- Protection des formulaires via reCAPTCHA v2  
- Données sensibles isolées dans des fichiers `.env`  
- Limitation des requêtes avec express-rate-limit  

---

## Crédits

Projet fullstack personnel développé dans le cadre d’un exercice de mise en production.  
Icônes, visuels et images utilisés : libres de droit ou hébergés sur Firebase.

---
