import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const h = fs.readFileSync(path.join(root, 'legacy-game.html'), 'utf8');

function sliceBracedOrBracketed(name) {
  const needle = `const ${name} = `;
  const idx = h.indexOf(needle);
  if (idx === -1) throw new Error(`Missing ${name}`);
  let i = idx + needle.length;
  const open = h[i];
  if (open !== '{' && open !== '[') throw new Error(`${name}: expected {{ or [, got ${open}`);
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  for (let j = i; j < h.length; j++) {
    const c = h[j];
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return h.slice(i, j + 1);
    }
  }
  throw new Error(`${name}: unclosed`);
}

const outDir = path.join(root, 'scripts', '_extracted');
fs.mkdirSync(outDir, { recursive: true });

const names = [
  'WEATHER_TYPES',
  'BUCKET_TIERS',
  'ROD_TIERS',
  'FROG_COLOR_VARIANTS',
  'CATCH_MASTER_DATA',
  'GRAPHICS_CONFIG',
  'POOL_WEIGHTS',
  'FIGHT_PARAMS',
  'SPECIAL_ON_CATCH',
  'BASE_DEFAULTS',
  'LOCATION_DISPLAY',
  'SHOP_ITEMS',
  'LOCATIONS',
  'DAY_NIGHT_CYCLE',
  'RAT_FACTS',
  'PARROT_JOKES',
  'PIRATE_QUOTES',
  'COLLECTIBLES',
  'COMPANIONS_DATABASE',
  'BALLOON_HIDEOUTS',
  'GOALS',
  'DESERT_SET',
  'ARCTIC_SET',
  'XP_BALANCING',
  'FARVANDE',
  'REGNEHISTORIE_TEMPLATES',
  'LETTE_REGNEHISTORIE_TEMPLATES',
  'OP_MULTIPLIERS',
];

for (const n of names) {
  try {
    const body = sliceBracedOrBracketed(n);
    fs.writeFileSync(path.join(outDir, `${n}.txt`), body, 'utf8');
    console.log(n, body.length);
  } catch (e) {
    console.error(n, e.message);
  }
}
