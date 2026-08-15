# 🫀 Aeros - Simulateur de Signes Vitaux

[![CI Pipeline](https://github.com/lcssrd/aeros/actions/workflows/ci.yml/badge.svg)](https://github.com/lcssrd/aeros/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

**Aeros** est une application web open-source de simulation médicale pour la formation en santé (IFSI, CESU, Facultés de Médecine, Ambulanciers). Elle simule un **moniteur multiparamétrique de signes vitaux** contrôlable en temps réel à distance par un instructeur via un système de salles sécurisées par code de connexion.

---

## ✨ Fonctionnalités

- 🎛️ **Panneau Instructeur (Pilote)** : Contrôle en direct de la Fréquence Cardiaque (FC), de la Saturation pulsée en oxygène (SpO2) et de la Pression Artérielle (Systolique / Diastolique).
- 📺 **Moniteur Patient Réaliste** :
  - Valeurs floues au démarrage comme sur un vrai moniteur éteint / non connecté.
  - **SpO2 + Pouls** : Bip sonore synchronisé avec le rythme cardiaque via la **Web Audio API**, courbe pléthysmographique animée réaliste avec onde dicrote, et variation physiologique subtile du pouls ($\pm 1$ bpm).
  - **Prise de Tension (PNI)** : Mesure manuelle (One-shot) ou automatique cyclique (toutes les 2 min) avec bruitage de brassard et calcul automatique de la **Pression Artérielle Moyenne (PAM)**.
  - **Système d'Alarmes** : Clignotement rouge et alarme sonore en cas de bradychardie/tachycardie, désaturation (&lt; 95%) ou hypo/hypertension.
  - **Mode Silencieux (Mute)** et **Mode Plein Écran (⛶)**.
- ⚡ **Temps Réel & Multi-Salles** : Communication bidirectionnelle via WebSocket (Socket.IO) avec isolation par code de salle à 4 chiffres.
- 🛡️ **Sécurité & Architecture Propre** : En-têtes HTTP durcis via Helmet, architecture sans style ni script en ligne (SoC), tests unitaires et intégration continue (CI).

---

## 🚀 Démarrage Rapide

### Prérequis

- [Node.js](https://nodejs.org/) version 24.x ou supérieure.

### 1. Installation

```bash
# Cloner le dépôt
git clone https://github.com/lcssrd/aeros.git
cd aeros

# Installer les dépendances
npm install
```

### 2. Lancement du serveur

```bash
# Mode production
npm start

# Mode développement avec auto-reload
npm run dev
```

L'application est accessible sur :

- **Portail d'Accueil** : `http://localhost:3000/`
- **Moniteur (Élève)** : `http://localhost:3000/monitor.html?room=1234`
- **Pilote (Instructeur)** : `http://localhost:3000/pilote.html?room=1234`
- **État de santé** : `http://localhost:3000/health`

---

## 🧪 Tests & Qualité de Code

```bash
# Lancer la suite de tests unitaires (Vitest)
npm test

# Vérifier et corriger le formatage (Prettier)
npm run format
npm run format:check

# Analyser le code (ESLint)
npm run lint
npm run lint:fix
```

---

## 📁 Architecture du Projet

```text
Aerosgnu/
├── .github/
│   └── workflows/
│       └── ci.yml               # Intégration Continue (GitHub Actions)
├── .editorconfig                # Standard d'indentation et d'encodage
├── .prettierrc                  # Configuration Prettier
├── eslint.config.js             # Configuration ESLint v9 (flat config)
├── package.json                 # Métadonnées, scripts et dépendances
├── server.js                    # Point d'entrée HTTP & WebSocket
├── src/                         # Logique métier et backend
│   ├── constants/               # Constantes médicales et audio
│   │   ├── audio.js
│   │   └── medical.js
│   ├── server/                  # Configuration Express & gestion des salles
│   │   ├── app.js
│   │   └── roomManager.js
│   └── services/                # Services de calcul (PAM, alarmes, validation)
│       └── vitalsService.js
├── public/                      # Interface utilisateur statique (SoC pur)
│   ├── index.html               # Portail d'accueil
│   ├── monitor.html             # Interface du moniteur
│   ├── pilote.html              # Interface du pilote
│   ├── style.css                # Bundle CSS principal
│   ├── css/                     # Feuilles de style modulaires
│   │   ├── base.css
│   │   ├── home.css
│   │   ├── monitor.css
│   │   └── pilote.css
│   └── js/                      # Scripts ES Modules modulaires
│       ├── audio-manager.js     # Synthétiseur Web Audio API
│       ├── constants.js
│       ├── home.js
│       ├── monitor.js
│       └── pilote.js
└── tests/                       # Suite de tests automatisés (Vitest + Supertest)
    ├── roomManager.test.js
    ├── server.test.js
    └── vitalsService.test.js
```

---

## ⚖️ Licence

Ce projet est distribué sous licence **GNU AGPLv3** (GNU Affero General Public License v3.0). Voir le fichier [`LICENSE`](file:///d:/Devcode/Aerosgnu/LICENSE) pour plus de détails.
