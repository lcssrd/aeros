import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server/app.js';

describe('Express HTTP App', () => {
  const app = createApp();

  it('serves health status on /health endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('serves static files like index.html', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  it('includes security headers from Helmet with strict script-src CSP', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');

    const csp = res.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it('serves client-required shared modules under /src/services and /src/constants', async () => {
    const resServices = await request(app).get('/src/services/vitalsService.js');
    expect(resServices.status).toBe(200);

    const resConstants = await request(app).get('/src/constants/medical.js');
    expect(resConstants.status).toBe(200);
  });

  it('does NOT expose server source files under /src/server', async () => {
    const resApp = await request(app).get('/src/server/app.js');
    expect(resApp.status).toBe(404);

    const resRoomManager = await request(app).get('/src/server/roomManager.js');
    expect(resRoomManager.status).toBe(404);
  });
});
