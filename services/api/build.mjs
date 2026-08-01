import { build } from 'esbuild';
import { readdirSync } from 'fs';
import { join } from 'path';

const handlersDir = './src/handlers';
const handlers = readdirSync(handlersDir)
  .filter(f => f.endsWith('.ts'))
  .map(f => join(handlersDir, f));

await build({
  entryPoints: handlers,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outdir: './dist/handlers',
  external: [
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/lib-dynamodb',
    '@aws-sdk/client-bedrock-runtime',
  ],
  sourcemap: true,
  minify: false,
});

console.log('✅ Build complete — handlers compiled to dist/handlers/');
