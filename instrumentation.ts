// Next.js Instrumentation API — runs once when the server starts
// This initializes the SQLite database schema and seeds default data
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamically import to avoid edge runtime issues
    const { runMigration } = await import('./db/migrate-init')
    await runMigration()
  }
}
