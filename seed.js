/**
 * Useme Team - Root Seed Script Entrypoint
 * Usage: node seed.js [--force] [--dry-run] [--export=path]
 */
const { runSeed } = require('./seed/seed-index');

if (typeof require !== 'undefined' && require.main === module) {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const exportArg = args.find(a => a.startsWith('--export='));
  const exportPath = exportArg ? exportArg.split('=')[1] : null;

  try {
    const result = runSeed({ force, dryRun, exportPath });
    process.exit(result.integrityErrors > 0 ? 1 : 0);
  } catch (err) {
    console.error('[Seed] Error:', err);
    process.exit(1);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runSeed };
}
