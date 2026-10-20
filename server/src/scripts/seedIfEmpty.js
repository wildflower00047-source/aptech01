import mongoose from 'mongoose';
import env from '../config/env.js';
import { seedDatabase } from './seed.lib.js';
import logger from '../utils/logger.js';

// Seeds demo data only when the database is empty. Used by the root `npm run dev`
// bootstrap so a fresh clone works with a single command.
const run = async () => {
  try {
    await mongoose.connect(env.mongoUri);
    await seedDatabase({ force: false });
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error(`Seed (if empty) failed: ${error.message}`);
    process.exit(1);
  }
};

run();
