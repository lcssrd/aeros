# Aeros - Simulateur tensiomètre

Aeros est un outil de simulation médicale conçu pour la formation. Il permet de simuler un moniteur de signes vitaux (type tensiomètre électronique) contrôlable à distance par un instructeur.

## 🚀 Installation

Assurez-vous d'avoir [Node.js](https://nodejs.org/) installé sur votre machine.

1. Clonez ce dépôt ou téléchargez les fichiers.
2. Ouvrez un terminal dans le dossier du projet.
3. Installez les dépendances :
   ```bash
   npm install
   ```

## 🛠️ Utilisation

### Lancement du serveur
```bash
npm start
```

Le serveur sera accessible sur :
- **Accueil (Portail)** : `http://localhost:3000/`
- **Moniteur (Élève)** : `http://localhost:3000/monitor.html`
- **Pilote (Instructeur)** : `http://localhost:3000/pilote.html`

---

### 🎮 Côté Instructeur (Interface Pilote)
L'instructeur définit les paramètres physiologiques que le moniteur devra afficher.
*   **Réglages** : Modifiez la Fréquence Cardiaque (BPM), la Saturation (SpO2) et la Pression Artérielle (Systolique/Diastolique).
*   **Transmission** : Cliquez sur **"APPLIQUER LES VALEURS"** pour envoyer les données au moniteur en temps réel.
*   **Monitoring Live** : La barre supérieure affiche les valeurs actuellement actives pour vérification.

### 🖥️ Côté Élève (Interface Moniteur)
Le moniteur simule l'appareil médical. Les valeurs sont floues par défaut jusqu'à activation.
*   **Activation des capteurs** :
    *   **SpO2 + Pouls** : Affiche la saturation et la fréquence cardiaque (bip sonore synchronisé et courbe).
    *   **Tension Start** : Lance une prise de tension unique (bruitage de brassard).
    *   **Tension Auto** : Lance une prise de tension toutes les 2 minutes.
*   **Alertes** : Si les paramètres sortent des zones de sécurité, les chiffres clignotent en rouge et une alarme sonore retentit.
*   **Options** : Mode plein écran (⛶) et bouton Mute (🔊).

---

## 📁 Structure du projet

- `server.js` : Serveur Node.js utilisant Express et Socket.io.
- `public/` : Contient l'interface utilisateur (HTML, CSS, JS).
  - `monitor.html` : Interface de visualisation des paramètres.
  - `pilote.html` : Interface de contrôle pour l'instructeur.

## ⚖️ Licence

Ce projet est sous licence **GNU GPLv3**. Voir le fichier `LICENSE` pour plus de détails.
