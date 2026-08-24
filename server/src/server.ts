import { createApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error('\n❌ Could not connect to MongoDB at', env.mongoUri);
    console.error('   Reason:', message);
    console.error('\n   Fixes:');
    console.error('   • Start a local MongoDB, or');
    console.error('   • Run the bundled in-memory MongoDB:  npm run mongo:memory');
    console.error('   • Or point MONGODB_URI at MongoDB Atlas in server/.env\n');
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 ChargeSense API listening on http://localhost:${env.port}`);
    console.log(`   Health check:  http://localhost:${env.port}/api/health`);
  });
}

void bootstrap();
