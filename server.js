import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './src/server/app.js';
import { RoomManager, sanitizeRoomCode } from './src/server/roomManager.js';

const PORT = process.env.PORT || 3000;
const app = createApp();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const roomManager = new RoomManager();

// Periodically clean up orphaned empty rooms every 10 minutes
const ROOM_CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
const cleanupTimer = setInterval(() => {
  roomManager.cleanEmptyRooms();
}, ROOM_CLEANUP_INTERVAL_MS);

io.on('connection', socket => {
  socket.on('joinRoom', roomCode => {
    const sanitizedCode = sanitizeRoomCode(roomCode);
    if (!sanitizedCode) {
      socket.emit('error', 'Code de room invalide');
      return;
    }
    socket.join(sanitizedCode);
    roomManager.addClient(sanitizedCode, socket.id);

    const currentVitals = roomManager.getOrCreateRoom(sanitizedCode);
    if (currentVitals) {
      // Send current vitals to the newly connected socket
      socket.emit('updateParams', currentVitals);
    }
  });

  socket.on('sendData', rawData => {
    const roomCode = roomManager.getRoomBySocketId(socket.id);
    if (roomCode && rawData) {
      const sanitizedVitals = roomManager.updateRoomData(roomCode, rawData);
      if (sanitizedVitals) {
        // Broadcast updated vitals to all clients in the room
        io.to(roomCode).emit('updateParams', sanitizedVitals);
      }
    }
  });

  socket.on('disconnect', () => {
    roomManager.removeClient(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Aeros Server] Running at http://localhost:${PORT}`);
});

// Graceful shutdown handling
function handleShutdown(signal) {
  console.log(`[Aeros Server] Received ${signal}. Closing server gracefully...`);
  clearInterval(cleanupTimer);
  httpServer.close(() => {
    console.log('[Aeros Server] HTTP and Socket server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export { app, httpServer, io, roomManager };
