/**
 * Standalone B2B → n3rve-submissions migration script.
 * Run via: npx ts-node src/scripts/migrate-b2b.ts [--dry-run]
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminService } from '../admin/admin.service';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`\n🚀 Starting B2B migration (dryRun=${dryRun})\n`);

  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);

  try {
    const result = await adminService.migrateB2BFiles(dryRun);
    console.log('\n✅ Migration complete!\n');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await app.close();
  }
}

main();
