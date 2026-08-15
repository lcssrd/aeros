# Guide de Contribution - Aeros

Merci de contribuer à **Aeros** ! Afin de maintenir un niveau d'excellence technique et de lisibilité, merci de respecter les normes de développement ci-dessous.

---

## 🛠️ Environnement de développement

### Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Installation

```bash
git clone <url-du-repo>
cd Aerosgnu
npm install
```

### Commandes utiles

| Commande               | Description                                                |
| :--------------------- | :--------------------------------------------------------- |
| `npm start`            | Lance le serveur en production                             |
| `npm run dev`          | Lance le serveur avec rechargement automatique (`--watch`) |
| `npm test`             | Exécute la suite de tests automatisés (Vitest)             |
| `npm run test:watch`   | Lance les tests en mode interactif                         |
| `npm run lint`         | Analyse le code avec ESLint                                |
| `npm run lint:fix`     | Corrige automatiquement les erreurs ESLint                 |
| `npm run format`       | Formate le code avec Prettier                              |
| `npm run format:check` | Vérifie la conformité du formatage                         |

---

## 📐 Standards de Rédaction du Code

### 1. Structure et Séparation des Responsabilités (SoC)

- **HTML** : Doit contenir uniquement la structure sémantique et l'accessibilité (`aria-label`, `aria-live`). **Aucun** attribut `style="..."` ni `onclick="..."`/`oninput="..."`.
- **CSS** : Organisé dans `public/css/` par modules (`base.css`, `home.css`, `pilote.css`, `monitor.css`). **Aucun** usage de `!important`.
- **JavaScript** :
  - Modularité avec les **ES Modules** natifs (`import` / `export`).
  - Utiliser `addEventListener` pour la gestion des événements DOM.
  - Bannir les « Magic Numbers » : utiliser les constantes de `src/constants/` et `public/js/constants.js`.

### 2. Typage et Documentation JSDoc

Chaque fonction métier, service ou classe doit être documentée avec des blocs JSDoc clairs décrivant les paramètres, types et retours.

```javascript
/**
 * Calcule la Pression Artérielle Moyenne (PAM).
 *
 * @param {number|string} sys - Pression systolique (mmHg)
 * @param {number|string} dia - Pression diastolique (mmHg)
 * @returns {number|null}
 */
export function calculateMAP(sys, dia) { ... }
```

### 3. Tests et TDD (Test-Driven Development)

- Tout nouveau calcul ou règle métier doit être couvert par des tests unitaires dans `tests/`.
- Avant de pousser un commit ou d'ouvrir une PR, s'assurer que `npm run lint` et `npm test` sont au vert.

---

## 🌿 Conventions Git & Commits

Nous recommandons l'usage des Conventional Commits :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `refactor:` Refactorisation sans changement de comportement
- `test:` Ajout ou modification de tests
- `docs:` Documentation
- `style:` Formatage / linting
