const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Utiliser le port défini par Render ou 3000 en local
const port = process.env.PORT || 3000;

// Servir les fichiers du dossier 'public' (que nous allons créer ensuite)
app.use(express.static('public'));

const roomsData = {};

io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');

    socket.on('joinRoom', (roomCode) => {
        socket.join(roomCode);
        socket.roomCode = roomCode;

        // Valeurs par défaut pour une nouvelle salle
        if (!roomsData[roomCode]) {
            roomsData[roomCode] = {
                bpm: 80,
                spo2: 98,
                sys: 120,
                dia: 80
            };
        }

        // Dès qu'on se connecte à la salle, on envoie les valeurs actuelles
        socket.emit('updateParams', roomsData[roomCode]);
        console.log(`Utilisateur a rejoint la salle : ${roomCode}`);
    });

    // Quand le pilote envoie de nouvelles données
    socket.on('sendData', (data) => {
        if (socket.roomCode) {
            console.log(`Données reçues du pilote (${socket.roomCode}) :`, data);
            roomsData[socket.roomCode] = data;
            
            // On diffuse la nouvelle consigne à tout le monde dans la salle
            io.to(socket.roomCode).emit('updateParams', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur est déconnecté');
    });
});

http.listen(port, () => {
    console.log(`Serveur lancé sur le port ${port}`);
});