const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 3000;

app.use(express.static('public'));

let currentParams = {
    bpm: 80,
    spo2: 98,
    sys: 120,
    dia: 80
};

io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');
    socket.emit('updateParams', currentParams);

    socket.on('sendData', (data) => {
        currentParams = data;
        io.emit('updateParams', currentParams);
    });

    // --- AJOUT POUR LA VOIX ---
    socket.on('voice-data', (blob) => {
        // On retransmet le paquet audio à tout le monde (sauf l'émetteur)
        // La page "voix.html" le recevra
        socket.broadcast.emit('voice-stream', blob);
    });
});

http.listen(port, () => {
    console.log(`Serveur lancé sur le port ${port}`);
});