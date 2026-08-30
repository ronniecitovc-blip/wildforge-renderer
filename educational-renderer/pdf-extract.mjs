import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const manifestPath = process.argv[2] || 'pdf-manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const repo = 'ronniecitovc-blip/wildforge-renderer';
const branch = 'main';
const date = manifest.date;
const runId = manifest.run_id;
const pageStart = Math.max(1, Number(manifest.page_start || 1));
const pageEnd = Math.max(pageStart, Math.min(pageStart + 2, Number(manifest.page_end || pageStart)));
const sourcePdf = manifest.source_pdf || 'source.pdf';
const outDir = path.join('public', 'facebook', date, runId);

fs.mkdirSync(outDir, { recursive: true });

const prefix = path.join(outDir, 'page');
execFileSync('pdftoppm', [
  '-jpeg',
  '-r', '180',
  '-f', String(pageStart),
  '-l', String(pageEnd),
  sourcePdf,
  prefix,
], { stdio: 'inherit' });

const produced = fs.readdirSync(outDir)
  .filter((name) => /^page-\d+\.jpg$/.test(name))
  .sort();

if (produced.length === 0) {
  throw new Error('No se generaron imagenes desde el PDF.');
}

const imageUrls = produced.map((name) => (
  `https://raw.githubusercontent.com/${repo}/${branch}/public/facebook/${date}/${runId}/${name}`
));

const result = {
  status: 'ok',
  date,
  run_id: runId,
  file_id: manifest.file_id,
  file_name: manifest.file_name,
  page_start: pageStart,
  page_end: pageEnd,
  image_urls: imageUrls,
};

fs.writeFileSync('pdf-render-result.json', JSON.stringify(result, null, 2));
