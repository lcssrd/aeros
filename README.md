# Aeros - Simulateur Dynamap

Simulateur Dynamap avec contrôle à distance pour la formation et le monitorage.

## 🚀 Installation

Assurez-vous d'avoir [Node.js](https://nodejs.org/) installé sur votre machine.

1. Clonez ce dépôt ou téléchargez les fichiers.
2. Ouvrez un terminal dans le dossier du projet.
3. Installez les dépendances :
   ```bash
   npm install
   ```

## 🛠️ Utilisation

Pour lancer le serveur :
```bash
npm start
```

Le serveur sera accessible sur :
- **Moniteur** : `http://localhost:3000/monitor.html`
- **Pilote** : `http://localhost:3000/pilote.html`

## 📁 Structure du projet

- `server.js` : Serveur Node.js utilisant Express et Socket.io.
- `public/` : Contient l'interface utilisateur (HTML, CSS, JS).
  - `monitor.html` : Interface de visualisation des paramètres.
  - `pilote.html` : Interface de contrôle pour l'instructeur.

## ⚖️ Licence

Ce projet est sous licence **GNU GPLv3**. Voir le fichier `LICENSE` pour plus de détails.
