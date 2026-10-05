/**
 * Prisma Database Seed Script for SubsRadar
 * Run via: npx tsx prisma/seed.ts
 */

import { db } from '../server/db.ts';

async function main() {
  console.log('Seeding SubsRadar database...');
  const state = db.resetToSeed();
  console.log(`Seeded user: ${state.user.email} with ${state.subscriptions.length} subscriptions and ${state.savedScenarios.length} saved scenarios.`);
}

main().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
