import cron from 'node-cron';
import { VersionsService } from '../features/versions/versions.service.js';

const versionsService = new VersionsService();

export function startVersionPurgeJob(): void {
  const retentionDays = parseInt(process.env['VERSION_RETENTION_DAYS'] ?? '30', 10);

  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    const deleted = await versionsService.purgeOldVersions(retentionDays);
    console.log(`[purge-versions] Deleted ${deleted} old version(s) (retention: ${retentionDays} days)`);
  });
}
