import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from '../src/server/roomManager.js';
import { DEFAULT_VITALS } from '../src/constants/medical.js';

describe('RoomManager', () => {
  let roomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  it('creates a room with default vitals if it does not exist', () => {
    const room = roomManager.getOrCreateRoom('1234');
    expect(room).toEqual(DEFAULT_VITALS);
  });

  it('updates room data with valid values', () => {
    roomManager.getOrCreateRoom('1234');
    const updated = roomManager.updateRoomData('1234', {
      bpm: 100,
      spo2: 95,
      sys: 140,
      dia: 90,
    });

    expect(updated).toEqual({
      bpm: 100,
      spo2: 95,
      sys: 140,
      dia: 90,
    });
    expect(roomManager.getRoomData('1234')).toEqual(updated);
  });

  it('tracks socket client connections per room', () => {
    roomManager.addClient('1234', 'socket-1');
    roomManager.addClient('1234', 'socket-2');

    expect(roomManager.getClientCount('1234')).toBe(2);
    expect(roomManager.getRoomBySocketId('socket-1')).toBe('1234');
  });

  it('cleans up client tracking on disconnect', () => {
    roomManager.addClient('1234', 'socket-1');
    const removedRoom = roomManager.removeClient('socket-1');

    expect(removedRoom).toBe('1234');
    expect(roomManager.getClientCount('1234')).toBe(0);
    expect(roomManager.getRoomBySocketId('socket-1')).toBeUndefined();
  });

  it('purges empty rooms when cleanEmptyRooms is invoked', () => {
    roomManager.addClient('1234', 'socket-1');
    roomManager.removeClient('socket-1');

    expect(roomManager.getRoomData('1234')).toBeDefined();
    roomManager.cleanEmptyRooms();
    expect(roomManager.getRoomData('1234')).toBeUndefined();
  });
});
