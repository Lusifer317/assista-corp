/**
 * One-time privacy reset for analytics collected by the legacy tracker.
 *
 * The previous tracker sent page events before the consent choice was made.
 * Those historical events cannot be reliably separated from post-consent events,
 * because the old schema did not store a consent timestamp.
 *
 * Default behavior is a dry run. Pass --apply only after taking a verified
 * SQLite backup. Lead records and notes are preserved; only their anonymous
 * session association is removed.
 */
const { db } = require('../lib/db');

function readCounts() {
  return {
    sessions: db.prepare('SELECT COUNT(*) AS count FROM visitor_sessions').get().count,
    events: db.prepare('SELECT COUNT(*) AS count FROM analytics_events').get().count,
    linkedLeads: db.prepare('SELECT COUNT(*) AS count FROM leads WHERE session_id IS NOT NULL').get().count,
    totalLeads: db.prepare('SELECT COUNT(*) AS count FROM leads').get().count
  };
}

function main() {
  const before = readCounts();
  console.log('Legacy analytics privacy reset');
  console.log('Sessions to delete: ' + before.sessions);
  console.log('Events to delete: ' + before.events);
  console.log('Lead-to-session links to clear: ' + before.linkedLeads);
  console.log('Lead records preserved: ' + before.totalLeads);

  if (!process.argv.includes('--apply')) {
    console.log('\nDRY RUN ONLY. No data was changed.');
    console.log('After a verified database backup, run: node scripts/reset-legacy-analytics.js --apply');
    return;
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('DELETE FROM analytics_events').run();
    db.prepare('UPDATE leads SET session_id = NULL WHERE session_id IS NOT NULL').run();
    db.prepare('DELETE FROM visitor_sessions').run();
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  const after = readCounts();
  console.log('\nLegacy anonymous analytics removed.');
  console.log('Remaining sessions: ' + after.sessions);
  console.log('Remaining events: ' + after.events);
  console.log('Lead records preserved: ' + after.totalLeads);
}

try {
  main();
} catch (error) {
  console.error('Analytics privacy reset failed:', error.message);
  process.exitCode = 1;
}
