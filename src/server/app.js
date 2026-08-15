import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.resolve(__dirname, '../../public');
const servicesPath = path.resolve(__dirname, '../services');
const constantsPath = path.resolve(__dirname, '../constants');

/**
 * Creates and configures the Express application.
 *
 * @returns {express.Application}
 */
export function createApp() {
  const app = express();

  // Configure Helmet with Content Security Policy
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          mediaSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", 'ws:', 'wss:'],
          imgSrc: ["'self'", 'data:', 'blob:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // Health check endpoint for uptime monitors / tests
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'aeros-vital-simulator',
      timestamp: new Date().toISOString(),
    });
  });

  // Serve shared source modules for native browser ES modules (restricted to non-server folders)
  app.use('/src/services', express.static(servicesPath));
  app.use('/src/constants', express.static(constantsPath));

  // Serve static assets from public/ directory
  app.use(express.static(publicPath));

  return app;
}
