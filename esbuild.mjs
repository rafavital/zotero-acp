import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/bootstrap.ts'],
  bundle: true,
  outfile: 'build/bootstrap.js',
  platform: 'browser', // Zotero 9 runs in a browser-like environment (Firefox ESR)
  format: 'iife',     // Zotero expects bootstrap.js to be a script that defines global functions
  target: 'es2022',
  logLevel: 'info',
};

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('watching...');
} else {
  await esbuild.build(buildOptions);
}