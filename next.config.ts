import type { NextConfig } from 'next';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', override: true });

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // ── Standalone output ─────────────────────────────────────────────────────
  // Next.js copies only the required files + a minimal server.js into
  // .next/standalone/  — no full node_modules needed at runtime.
  // The binary shipped with Electron (process.execPath) runs server.js directly.
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    PROJECT_ID: process.env.HAPPYSEEDS_PROJECT_ID ?? '',
    REACTUS_BASE_URL: process.env.REACTUS_BASE_URL ?? '',
  },
  // better-sqlite3 is a native addon — must stay external (not bundled by webpack)
  serverExternalPackages: ['better-sqlite3', 'bcryptjs', 'jsonwebtoken'],
  allowedDevOrigins: ['**.*.*'],
};

export default nextConfig;
