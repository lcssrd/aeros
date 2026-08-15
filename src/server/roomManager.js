/**
 * In-memory Room and Client management for Socket.IO simulation rooms.
 */

import { DEFAULT_VITALS } from '../constants/medical.js';
import { validateVitals } from '../services/vitalsService.js';

export class RoomManager {
  constructor() {
    /** @type {Map<string, { bpm: number, spo2: number, sys: number, dia: number }>} */
    this.rooms = new Map();

    /** @type {Map<string, Set<string>>} Map of roomCode -> Set of socketIds */
    this.roomClients = new Map();

    /** @type {Map<string, string>} Map of socketId -> roomCode */
    this.socketToRoom = new Map();
  }

  /**
   * Retrieves existing room vitals data or initializes with defaults.
   *
   * @param {string} roomCode
   * @returns {{ bpm: number, spo2: number, sys: number, dia: number }}
   */
  getOrCreateRoom(roomCode) {
    const code = String(roomCode).trim();
    if (!this.rooms.has(code)) {
      this.rooms.set(code, { ...DEFAULT_VITALS });
      this.roomClients.set(code, new Set());
    }
    return this.rooms.get(code);
  }

  /**
   * Updates room vitals data after sanitization.
   *
   * @param {string} roomCode
   * @param {object} rawData
   * @returns {{ bpm: number, spo2: number, sys: number, dia: number }}
   */
  updateRoomData(roomCode, rawData) {
    const code = String(roomCode).trim();
    const sanitized = validateVitals(rawData);
    this.rooms.set(code, sanitized);
    return sanitized;
  }

  /**
   * Gets current room data if it exists.
   *
   * @param {string} roomCode
   * @returns {{ bpm: number, spo2: number, sys: number, dia: number }|undefined}
   */
  getRoomData(roomCode) {
    const code = String(roomCode).trim();
    return this.rooms.get(code);
  }

  /**
   * Associates a connected socket client with a room.
   *
   * @param {string} roomCode
   * @param {string} socketId
   */
  addClient(roomCode, socketId) {
    const code = String(roomCode).trim();
    this.getOrCreateRoom(code);

    const clientSet = this.roomClients.get(code);
    if (clientSet) {
      clientSet.add(socketId);
    }
    this.socketToRoom.set(socketId, code);
  }

  /**
   * Removes a socket client on disconnect.
   *
   * @param {string} socketId
   * @returns {string|undefined} Room code that client belonged to
   */
  removeClient(socketId) {
    const roomCode = this.socketToRoom.get(socketId);
    if (roomCode) {
      this.socketToRoom.delete(socketId);
      const clientSet = this.roomClients.get(roomCode);
      if (clientSet) {
        clientSet.delete(socketId);
      }
    }
    return roomCode;
  }

  /**
   * Returns number of active clients in a room.
   *
   * @param {string} roomCode
   * @returns {number}
   */
  getClientCount(roomCode) {
    const code = String(roomCode).trim();
    const clientSet = this.roomClients.get(code);
    return clientSet ? clientSet.size : 0;
  }

  /**
   * Retrieves roomCode from socket ID.
   *
   * @param {string} socketId
   * @returns {string|undefined}
   */
  getRoomBySocketId(socketId) {
    return this.socketToRoom.get(socketId);
  }

  /**
   * Purges rooms that have 0 active clients connected.
   */
  cleanEmptyRooms() {
    for (const [code, clients] of this.roomClients.entries()) {
      if (clients.size === 0) {
        this.rooms.delete(code);
        this.roomClients.delete(code);
      }
    }
  }
}
