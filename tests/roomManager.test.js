import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager, sanitizeRoomCode } from '../src/server/roomManager.js';
import { DEFAULT_VITALS } from '../src/constants/medical.js';

describe('sanitizeRoomCode', () => {
  it('accepts valid alphanumeric, hyphen and underscore room codes up to 16 chars', () => {
    expect(sanitizeRoomCode('1234')).toBe('1234');
    expect(sanitizeRoomCode(4567)).toBe('4567');
    expect(sanitizeRoomCode(' room_01 ')).toBe('room_01');
    expect(sanitizeRoomCode('SIM-A1_test')).toBe('SIM-A1_test');
    expect(sanitizeRoomCode('1234567890123456')).toBe('1234567890123456');
  });

  it('rejects invalid or dangerous room codes', () => {
    expect(sanitizeRoomCode('')).toBeNull();
    expect(sanitizeRoomCode('   ')).toBeNull();
    expect(sanitizeRoomCode(null)).toBeNull();
    expect(sanitizeRoomCode(undefined)).toBeNull();
    expect(sanitizeRoomCode({})).toBeNull();
    expect(sanitizeRoomCode([])).toBeNull();
    expect(sanitizeRoomCode('12345678901234567')).toBeNull(); // > 16 chars
    expect(sanitizeRoomCode('<script>')).toBeNull();
    expect(sanitizeRoomCode('room/123')).toBeNull();
    expect(sanitizeRoomCode('room.123')).toBeNull();
    expect(sanitizeRoomCode('room 123')).toBeNull();
  });
});

describe('RoomManager', () => {
  let roomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  it('creates a room with default vitals if it does not exist', () => {
    const room = roomManager.getOrCreateRoom('1234');
    expect(room).toEqual(DEFAULT_VITALS);
  });

  it('rejects invalid room codes on getOrCreateRoom and does not allocate memory', () => {
    expect(roomManager.getOrCreateRoom('')).toBeNull();
    expect(roomManager.getOrCreateRoom('invalid code with spaces')).toBeNull();
    expect(roomManager.getOrCreateRoom('<xss>')).toBeNull();
    expect(roomManager.rooms.size).toBe(0);
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

  it('rejects invalid room codes on updateRoomData', () => {
    const result = roomManager.updateRoomData('invalid room!', { bpm: 100 });
    expect(result).toBeNull();
  });

  it('tracks socket client connections per room', () => {
    expect(roomManager.addClient('1234', 'socket-1')).toBe(true);
    expect(roomManager.addClient('1234', 'socket-2')).toBe(true);

    expect(roomManager.getClientCount('1234')).toBe(2);
    expect(roomManager.getRoomBySocketId('socket-1')).toBe('1234');
  });

  it('rejects addClient with invalid room code or missing socketId', () => {
    expect(roomManager.addClient('invalid room name', 'socket-1')).toBe(false);
    expect(roomManager.addClient('1234', '')).toBe(false);
    expect(roomManager.rooms.size).toBe(0);
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
