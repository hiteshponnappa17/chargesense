import fs from 'node:fs';
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from '../config/env';

/**
 * Boots a REAL `mongod` (downloaded on first run) bound to a fixed port with a
 * persistent data directory, then stays alive — emulating a locally-installed
 * MongoDB so `npm run seed` and `npm run dev` can connect normally. This is NOT
 * mock data: it is a genuine MongoDB server. Data is preserved across restarts.
 */
async function main(): Promise<void> {
  const dbPath = path.resolve(process.cwd(), env.memoryDbPath);
  fs.mkdirSync(dbPath, { recursive: true });

  // eslint-disable-next-line no-console
  console.log('⏳ Starting in-memory MongoDB (first run downloads the mongod binary, ~1 min)...');

  const mongod = await MongoMemoryServer.create({
    instance: {
      port: env.memoryDbPort,
      dbPath,
      storageEngine: 'wiredTiger',
    },
  });

  const uri = `mongodb://127.0.0.1:${env.memoryDbPort}/chargesense`;
  /* eslint-disable no-console */
  console.log('\n✅ In-memory MongoDB is running.');
  console.log(`   URI:       ${uri}`);
  console.log(`   Data dir:  ${dbPath} (persisted between restarts)`);
  console.log('\n   Keep this terminal open. In other terminals run:');
  console.log('     npm run seed      (from server/)   — load demo data');
  console.log('     npm run dev       (from repo root) — start API + client');
  console.log('\n   Press Ctrl+C to stop.\n');
  /* eslint-enable no-console */

  const shutdown = async () => {
    // eslint-disable-next-line no-console
    console.log('\n🛑 Stopping in-memory MongoDB (data preserved)...');
    await mongod.stop({ doCleanup: false, force: false });
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep the process alive indefinitely.
  await new Promise<void>(() => {});
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start in-memory MongoDB:', err);
  process.exit(1);
});
