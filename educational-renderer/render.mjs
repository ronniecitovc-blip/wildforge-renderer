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
  const compact = w < 600;
  const title = wrap(heading, compact ? 22 : 52, 2);
  const content = wrap(body, compact ? 31 : 72, compact ? 6 : 4);
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="30" fill="#ffffff" stroke="#dbe7ef" stroke-width="3"/>
    <circle cx="${x + 48}" cy="${y + 55}" r="28" fill="${accent}"/>
    <text x="${x + 48}" y="${y + 66}" text-anchor="middle" font-family="Arial" font-size="30" font-weight="900" fill="#fff">${index}</text>
    ${textLines(title, x + 92, y + 55, 26, '#12304a', 800, 1.15)}
    ${textLines(content, x + 36, y + 130, 22, '#29465b', 500, 1.34)}
  </g>`;
}

function renderTheory(material) {
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


function visualPalette(material) {
  const mono = material.visual_type === 'blanco_negro';
  const palette = material.palette || {};
  return {
    primary: mono ? '#111111' : (palette.primary || '#126e82'),
    accent: mono ? '#555555' : (palette.accent || '#f59e0b'),
    pale: mono ? '#ffffff' : (palette.pale || '#eef8fa'),
    line: mono ? '#111111' : '#cbdde7'
  };
}

function renderWorksheet(material) {
  const { primary, accent, pale, line } = visualPalette(material);
  const mono = material.visual_type === 'blanco_negro';
  const sections = Array.isArray(material.sections) ? material.sections.slice(0, 3) : [];
  const tasks = Array.isArray(material.activities) ? material.activities.slice(0, 3) : [];
  const title = wrap(material.title, 34, 2);
  const cards = [0, 1, 2].map((i) => {
    const y = 300 + i * 285;
    const heading = wrap(sections[i]?.heading || ('Actividad ' + (i + 1)), 30, 2);
    const task = wrap(tasks[i] || sections[i]?.body || '', 48, 3);
    return `<g>
      <rect x="42" y="${y}" width="996" height="260" rx="28" fill="#ffffff" stroke="${mono ? '#111111' : (i % 2 ? accent : primary)}" stroke-width="3"/>
      <circle cx="84" cy="${y + 45}" r="28" fill="${mono ? '#ffffff' : (i % 2 ? accent : primary)}" stroke="${primary}" stroke-width="3"/>
      <text x="84" y="${y + 56}" text-anchor="middle" font-family="Arial" font-size="28" font-weight="900" fill="${mono ? '#111111' : '#ffffff'}">${i + 1}</text>
      ${textLines(heading, 126, y + 48, 25, '#15324a', 800, 1.12)}
      ${textLines(task, 72, y + 112, 22, '#29465b', 600, 1.28)}
      <rect x="548" y="${y + 32}" width="250" height="190" rx="20" fill="${pale}" stroke="${line}" stroke-width="3" stroke-dasharray="10 8"/>
      <text x="673" y="${y + 65}" text-anchor="middle" font-family="Arial" font-size="18" font-weight="800" fill="${primary}">Representa o dibuja</text>
      <path d="M575 ${y + 190}h196 M575 ${y + 155}h196 M575 ${y + 120}h196" stroke="${line}" stroke-width="2" opacity=".7"/>
      <rect x="822" y="${y + 32}" width="190" height="88" rx="18" fill="#ffffff" stroke="${line}" stroke-width="3"/>
      <text x="842" y="${y + 60}" font-family="Arial" font-size="18" font-weight="800" fill="${primary}">Operación</text>
      <path d="M846 ${y + 96}h142" stroke="${primary}" stroke-width="2"/>
      <rect x="822" y="${y + 134}" width="190" height="88" rx="18" fill="#ffffff" stroke="${line}" stroke-width="3"/>
      <text x="842" y="${y + 162}" font-family="Arial" font-size="18" font-weight="800" fill="${primary}">Respuesta</text>
      <path d="M846 ${y + 198}h142" stroke="${primary}" stroke-width="2"/>
    </g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <defs><linearGradient id="wsHead" x1="0" x2="1"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${accent}"/></linearGradient></defs>
    <rect width="1080" height="1350" fill="${pale}"/>
    <rect x="24" y="20" width="1032" height="1310" rx="34" fill="${mono ? '#ffffff' : pale}" stroke="${primary}" stroke-width="4"/>
    <path d="M60 58h300M720 58h300" stroke="${primary}" stroke-width="2"/>
    <text x="60" y="49" font-family="Arial" font-size="18" font-weight="700" fill="${primary}">Nombre:</text>
    <text x="720" y="49" font-family="Arial" font-size="18" font-weight="700" fill="${primary}">Fecha:</text>
    <rect x="42" y="82" width="996" height="185" rx="30" fill="url(#wsHead)"/>
    <text x="540" y="116" text-anchor="middle" font-family="Arial" font-size="20" font-weight="800" fill="#ffffff">${esc((material.area || '') + ' · ' + (material.grade || ''))}</text>
    ${textLines(title, 540, 170, 44, '#ffffff', 900, 1.08, 'middle')}
    ${textLines(wrap(material.purpose || material.subtitle || '', 76, 2), 540, 240, 21, '#ffffff', 500, 1.15, 'middle')}
    ${cards}
    <text x="56" y="1288" font-family="Arial" font-size="21" font-weight="900" fill="${primary}">INNOVAR PARA ENSEÑAR</text>
    <text x="1024" y="1288" text-anchor="end" font-family="Arial" font-size="19" fill="${primary}">Contexto educativo del Perú</text>
  </svg>`;
}

function renderTimeline(material) {
  const { primary, accent, pale } = visualPalette(material);
  const sections = Array.isArray(material.sections) ? material.sections.slice(0, 3) : [];
  const tasks = Array.isArray(material.activities) ? material.activities.slice(0, 3) : [];
  const title = wrap(material.title, 34, 2);
  const events = [0, 1, 2].map((i) => {
    const y = 315 + i * 300;
    const heading = wrap(sections[i]?.heading || ('Momento ' + (i + 1)), 34, 2);
    const body = wrap(sections[i]?.body || '', 58, 4);
    const task = wrap(tasks[i] || '', 58, 2);
    return `<g>
      <circle cx="158" cy="${y + 78}" r="38" fill="${i % 2 ? accent : primary}" stroke="#ffffff" stroke-width="7"/>
      <text x="158" y="${y + 90}" text-anchor="middle" font-family="Arial" font-size="30" font-weight="900" fill="#ffffff">${i + 1}</text>
      <rect x="225" y="${y}" width="795" height="245" rx="28" fill="#ffffff" stroke="${i % 2 ? accent : primary}" stroke-width="3"/>
      ${textLines(heading, 265, y + 52, 30, i % 2 ? accent : primary, 900, 1.12)}
      ${textLines(body, 265, y + 120, 23, '#29465b', 500, 1.3)}
      <rect x="250" y="${y + 188}" width="740" height="40" rx="18" fill="${pale}"/>
      ${textLines(task, 270, y + 215, 18, '#334e61', 700, 1.1)}
    </g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <defs><linearGradient id="tlHead" x1="0" x2="1"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${accent}"/></linearGradient></defs>
    <rect width="1080" height="1350" fill="${pale}"/>
    <rect width="1080" height="250" fill="url(#tlHead)"/>
    <text x="54" y="62" font-family="Arial" font-size="22" font-weight="800" fill="#ffffff">${esc((material.area || '') + ' · ' + (material.level || 'Educación básica'))}</text>
    ${textLines(title, 54, 126, 46, '#ffffff', 900, 1.08)}
    ${textLines(wrap(material.subtitle || material.purpose || '', 70, 2), 56, 226, 22, '#ffffff', 500, 1.15)}
    <path d="M158 345V1125" stroke="${primary}" stroke-width="12" stroke-linecap="round"/>
    <path d="M130 1100l28 44 28-44" fill="${primary}"/>
    ${events}
    <text x="54" y="1298" font-family="Arial" font-size="22" font-weight="900" fill="${primary}">INNOVAR PARA ENSEÑAR</text>
    <text x="1026" y="1298" text-anchor="end" font-family="Arial" font-size="20" fill="#52687a">Perú · ${esc(material.grade || '')}</text>
  </svg>`;
}

function renderOrganizer(material) {
  const { primary, accent, pale, line } = visualPalette(material);
  const sections = Array.isArray(material.sections) ? material.sections.slice(0, 3) : [];
  const tasks = Array.isArray(material.activities) ? material.activities.slice(0, 3) : [];
  const title = wrap(material.title, 34, 2);
  const nodes = [0, 1, 2].map((i) => {
    const y = 500 + i * 245;
    const heading = wrap(sections[i]?.heading || ('Idea ' + (i + 1)), 32, 2);
    const body = wrap(sections[i]?.body || '', 64, 3);
    const task = wrap(tasks[i] || '', 62, 1);
    return `<g>
      <path d="M540 420 C540 ${y - 35}, 180 ${y - 35}, 180 ${y + 55}" fill="none" stroke="${i % 2 ? accent : primary}" stroke-width="5"/>
      <circle cx="180" cy="${y + 55}" r="18" fill="${i % 2 ? accent : primary}"/>
      <rect x="215" y="${y}" width="805" height="190" rx="30" fill="#ffffff" stroke="${i % 2 ? accent : primary}" stroke-width="3"/>
      ${textLines(heading, 255, y + 48, 28, i % 2 ? accent : primary, 900, 1.1)}
      ${textLines(body, 255, y + 108, 22, '#29465b', 500, 1.28)}
      <path d="M255 ${y + 158}h715" stroke="${line}" stroke-width="2"/>
      ${textLines(task, 255, y + 180, 17, '#52687a', 700, 1.05)}
    </g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <defs><linearGradient id="orgHead" x1="0" x2="1"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${accent}"/></linearGradient></defs>
    <rect width="1080" height="1350" fill="${pale}"/>
    <rect width="1080" height="250" fill="url(#orgHead)"/>
    <text x="54" y="60" font-family="Arial" font-size="22" font-weight="800" fill="#ffffff">${esc((material.area || '') + ' · ' + (material.grade || ''))}</text>
    ${textLines(title, 54, 126, 46, '#ffffff', 900, 1.08)}
    <rect x="165" y="285" width="750" height="135" rx="68" fill="#ffffff" stroke="${accent}" stroke-width="5"/>
    ${textLines(wrap(material.purpose || material.subtitle || '', 64, 3), 540, 330, 22, primary, 800, 1.25, 'middle')}
    ${nodes}
    <text x="54" y="1298" font-family="Arial" font-size="22" font-weight="900" fill="${primary}">INNOVAR PARA ENSEÑAR</text>
    <text x="1026" y="1298" text-anchor="end" font-family="Arial" font-size="20" fill="#52687a">Contexto peruano</text>
  </svg>`;
}

function renderSvg(material) {
  const visual = String(material.visual_type || material.type || '').toLowerCase();
  if (visual.includes('linea_tiempo')) return renderTimeline(material);
  if (visual.includes('organizador_visual')) return renderOrganizer(material);
  if (visual.includes('ficha_practica') || visual.includes('reto_matematico') || visual.includes('blanco_negro')) return renderWorksheet(material);
  return renderTheory(material);
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
