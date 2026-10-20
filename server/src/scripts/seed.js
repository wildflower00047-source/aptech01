import mongoose from 'mongoose';
import env from '../config/env.js';
import { seedDatabase } from './seed.lib.js';
import logger from '../utils/logger.js';

const run = async () => {
  try {
    await mongoose.connect(env.mongoUri);
    logger.info('Connected to MongoDB for seeding...');
    await seedDatabase({ force: true });
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
};

run();
