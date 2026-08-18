# 🫀 Aeros - Simulateur de Signes Vitaux

[![CI Pipeline](https://github.com/lcssrd/aeros/actions/workflows/ci.yml/badge.svg)](https://github.com/lcssrd/aeros/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

**Aeros** est une application web open-source de simulation médicale pour la formation en santé (IFSI, CESU, Facultés de Médecine, Ambulanciers). Elle simule un **moniteur multiparamétrique de signes vitaux** contrôlable en temps réel à distance par un instructeur via un système de salles sécurisées par code de connexion.

---

## ✨ Fonctionnalités

- 🎛️ **Panneau Instructeur (Pilote)** : Contrôle en direct de la Fréquence Cardiaque (FC / Pouls), de la Saturation pulsée en oxygène (SpO2) et de la Pression Artérielle (Systolique / Diastolique) avec synchronisation curseurs/champs numériques et retour visuel de transmission.
- 📺 **Moniteur Patient Réaliste (AEROS A100)** :
  - **Interface Matérielle & Rétro-LED** : Afficheurs 7 segments LED réalistes avec segments éteints « fantômes », châssis texturé et boutons physiques interactifs.
  - **SpO2 & Pouls** : Bip sonore synchronisé avec le rythme cardiaque via la **Web Audio API**, **barres pulsatiles à LED** (bargraphe d'amplitude de signal pulsatile à 8 segments avec montée systolique et décroissance diastolique), capteur SpO2 enfichable et variation physiologique subtile du pouls ($\pm 1$ bpm).
  - **Prise de Tension (PNI)** : Mesure manuelle (One-shot) ou automatique cyclique (toutes les 2 min) avec bruitage de brassard, affichage dynamique de la pression instantanée du brassard, calcul automatique de la **Pression Artérielle Moyenne (PAM)** et historique du temps écoulé depuis la dernière mesure.
  - **Système d'Alarmes** : Clignotement rouge visuel des blocs LED et alarme sonore en cas de bradycardie/tachycardie, désaturation (&lt; 95%) ou hypo/hypertension.
  - **Interactivité Complète** : Bouton Marche/Arrêt, Silence Alarme (Mute), Mode Plein Écran (⛶), horloge temps réel et branchement interactif des connecteurs (prise SpO2, raccord brassard PNI).
- ⚡ **Temps Réel & Multi-Salles** : Communication bidirectionnelle ultra-rapide via WebSocket (Socket.IO) avec isolation par code de salle à 4 chiffres.
- 🛡️ **Sécurité & Architecture Propre** : En-têtes HTTP durcis via Helmet, architecture sans style ni script en ligne (SoC), tests unitaires automatisés (Vitest) et intégration continue (CI GitHub Actions).

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
