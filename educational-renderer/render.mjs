import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const manifestPath = process.argv[2] || 'edu-manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const repo = 'ronniecitovc-blip/wildforge-renderer';
const branch = 'main';
const outDir = path.join('public', 'educativo', manifest.date, manifest.run_id);
fs.mkdirSync(outDir, { recursive: true });

const esc = (value = '') => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function wrap(text, max = 48, maxLines = 5) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = (line + ' ' + word).trim();
    if (next.length > max && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else line = next;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (words.length && lines.length === maxLines) {
    const joined = lines.join(' ');
    if (joined.length < String(text).length - 3) lines[maxLines - 1] = lines[maxLines - 1].replace(/[.,;:]?$/, '…');
  }
  return lines;
}

function textLines(lines, x, y, size, color, weight = 500, step = 1.28, anchor = 'start') {
  return lines.map((line, i) => `<text x="${x}" y="${y + i * size * step}" text-anchor="${anchor}" font-family="Arial, DejaVu Sans, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(line)}</text>`).join('');
}

function icon(area, color) {
  const a = String(area || '').toLowerCase();
  if (a.includes('matem')) return `<g transform="translate(830 62)"><circle cx="90" cy="90" r="80" fill="#fff" opacity=".2"/><text x="90" y="118" text-anchor="middle" font-family="Arial" font-size="86" font-weight="900" fill="#fff">×÷</text></g>`;
  if (a.includes('ciencia')) return `<g transform="translate(850 58)" stroke="#fff" stroke-width="12" fill="none"><path d="M60 20v55l-45 75c-15 28 3 55 35 55h95c32 0 50-27 35-55l-45-75V20"/><path d="M38 130h118"/><circle cx="75" cy="158" r="9" fill="#fff"/><circle cx="125" cy="177" r="7" fill="#fff"/></g>`;
  if (a.includes('comunic')) return `<g transform="translate(835 64)" fill="none" stroke="#fff" stroke-width="12"><path d="M15 25h155a20 20 0 0 1 20 20v95a20 20 0 0 1-20 20H80l-48 38 12-38H15a20 20 0 0 1-20-20V45a20 20 0 0 1 20-20z"/><path d="M35 70h115M35 105h95"/></g>`;
  return `<g transform="translate(850 65)" fill="none" stroke="#fff" stroke-width="12"><circle cx="85" cy="85" r="72"/><path d="M85 18c28 34 42 74 0 139M85 18c-28 34-42 74 0 139M15 85h140"/></g>`;
}

function card(x, y, w, h, heading, body, accent, index) {
  const title = wrap(heading, 28, 2);
  const content = wrap(body, 54, 6);
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="30" fill="#ffffff" stroke="#dbe7ef" stroke-width="3"/>
    <circle cx="${x + 48}" cy="${y + 55}" r="28" fill="${accent}"/>
    <text x="${x + 48}" y="${y + 66}" text-anchor="middle" font-family="Arial" font-size="30" font-weight="900" fill="#fff">${index}</text>
    ${textLines(title, x + 92, y + 55, 29, '#12304a', 800, 1.15)}
    ${textLines(content, x + 36, y + 130, 25, '#29465b', 500, 1.35)}
  </g>`;
}

function renderSvg(material) {
  const palette = material.palette || {};
  const primary = palette.primary || '#126e82';
  const accent = palette.accent || '#f59e0b';
  const pale = palette.pale || '#eef8fa';
  const sections = Array.isArray(material.sections) ? material.sections.slice(0, 3) : [];
  while (sections.length < 3) sections.push({ heading: sections.length === 0 ? 'Idea clave' : 'Para recordar', body: material.summary || material.purpose || '' });
  const questions = Array.isArray(material.activities) ? material.activities.slice(0, 3) : [];
  const title = wrap(material.title, 34, 3);
  const subtitle = wrap(material.subtitle || material.purpose || '', 66, 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <defs><linearGradient id="header" x1="0" x2="1"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${accent}"/></linearGradient></defs>
    <rect width="1080" height="1350" fill="${pale}"/>
    <rect width="1080" height="285" fill="url(#header)"/>
    <rect x="42" y="36" width="440" height="48" rx="24" fill="#fff" opacity=".22"/>
    <text x="262" y="69" text-anchor="middle" font-family="Arial" font-size="23" font-weight="800" fill="#fff">${esc((material.type || 'Ficha educativa') + ' · ' + (material.level || 'Educación básica'))}</text>
    ${textLines(title, 54, 135, 50, '#ffffff', 900, 1.08)}
    ${textLines(subtitle, 56, 242, 24, '#f8fafc', 500, 1.18)}
    ${icon(material.area, accent)}
    ${card(45, 320, 480, 320, sections[0].heading, sections[0].body, primary, 1)}
    ${card(555, 320, 480, 320, sections[1].heading, sections[1].body, accent, 2)}
    ${card(45, 670, 990, 250, sections[2].heading, sections[2].body, primary, 3)}
    <rect x="45" y="950" width="990" height="285" rx="34" fill="#fff8e8" stroke="${accent}" stroke-width="4"/>
    <rect x="45" y="950" width="990" height="66" rx="30" fill="${accent}"/>
    <text x="86" y="994" font-family="Arial" font-size="31" font-weight="900" fill="#fff">Ahora practica y reflexiona</text>
    ${questions.map((q, i) => textLines(wrap(`${i + 1}. ${q}`, 76, 2), 82, 1062 + i * 58, 25, '#263746', 600, 1.22)).join('')}
    <text x="54" y="1298" font-family="Arial" font-size="22" font-weight="800" fill="${primary}">INNOVAR PARA ENSEÑAR</text>
    <text x="1026" y="1298" text-anchor="end" font-family="Arial" font-size="20" fill="#52687a">${esc(material.area || 'Educación básica')} · ${esc(material.grade || '')}</text>
  </svg>`;
}

const results = [];
for (let i = 0; i < manifest.materials.length; i++) {
  const material = manifest.materials[i];
  const filename = `material-${String(i + 1).padStart(2, '0')}.jpg`;
  const diskPath = path.join(outDir, filename);
  await sharp(Buffer.from(renderSvg(material))).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(diskPath);
  const publicPath = `${outDir}/${filename}`.replace(/\\/g, '/');
  results.push({
    ...material,
    image_url: `https://raw.githubusercontent.com/${repo}/${branch}/${publicPath}`
  });
}
fs.writeFileSync('render-result.json', JSON.stringify({ status: 'ok', run_id: manifest.run_id, materials: results }, null, 2));
`