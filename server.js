const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Utiliser le port défini par Render ou 3000 en local
const port = process.env.PORT || 3000;

// Servir les fichiers du dossier 'public' (que nous allons créer ensuite)
app.use(express.static('public'));

// Valeurs par défaut au démarrage
let currentParams = {
    bpm: 80,
    spo2: 98,
    sys: 120,
    dia: 80
};

io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');

    // Dès qu'on se connecte, on envoie les valeurs actuelles (pour que le pilote sache où on en est)
    socket.emit('updateParams', currentParams);

    // Quand le pilote envoie de nouvelles données
    socket.on('sendData', (data) => {
        console.log('Données reçues du pilote :', data);
        currentParams = data;
        
        // On diffuse la nouvelle consigne à tout le monde (y compris l'interface)
        // Note: L'interface recevra l'info mais ne l'affichera que si on clique sur Start
        io.emit('updateParams', currentParams);
    });
});

http.listen(port, () => {
    console.log(`Serveur lancé sur le port ${port}`);
});