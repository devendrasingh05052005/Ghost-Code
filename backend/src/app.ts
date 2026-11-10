import express from 'express';
import cors from 'cors';
import routes from './api/routes';

export function createApp(): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use('/api', routes);

  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      platform: 'GHOSTCODE Code Autopsy Lab'
    });
  });

  return app;
}
