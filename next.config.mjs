import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Pin the tracing root to this project (the repo lives under a large shared tree).
  outputFileTracingRoot: __dirname,
  // Comunica (rdf-parse) lazy-loads actors/config at runtime via require();
  // keep these packages external so Next does not try to bundle them server-side.
  serverExternalPackages: ['rdf-parse', 'n3'],
};

export default nextConfig;
