import { createApp } from './app';
import { initializeDatabase } from './database/db';
import { config } from './config';

async function bootstrap() {
  try {
    console.log('================================================================================');
    console.log('         PROJECT GHOSTCODE — THE CODE AUTOPSY LAB BACKEND STARTUP               ');
    console.log('================================================================================');
    console.log('Initializing SQLite database schema and capability registries...');
    await initializeDatabase();
    console.log('Database initialized successfully.');

    const app = createApp();
    app.listen(config.port, () => {
      console.log(`GHOSTCODE Backend running at: http://localhost:${config.port}`);
      console.log(`Health check available at:     http://localhost:${config.port}/health`);
      console.log('================================================================================');
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  bootstrap();
}
