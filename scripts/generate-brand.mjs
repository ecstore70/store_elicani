#!/usr/bin/env node
/**
 * Generates the official Elicani brand assets from the production brand source:
 *
 *  - MARK_RAW: faithful vector trace of the official cart-"e" symbol
 *    (traced with potrace from the official reference artwork).
 *  - Poppins Black (SIL Open Font License 1.1, fonts.google.com/poppins)
 *    shaped into the language-independent "Elicani" wordmark and outlined
 *    to pure SVG paths (no font dependency at runtime).
 *
 * Outputs:
 *  - public/brand/*.svg      primary / dark / monochrome logo + mark variants
 *  - public/brand/*.png      PWA app icons, apple touch icon, OG image
 *  - public/brand/elicani-favicon.ico  (16/32/48)
 *  - src/app/icon.svg, src/app/apple-icon.png   (Next.js app icons)
 *  - src/lib/brand/logo-paths.ts                (inline SVG data for <Logo/>)
 *
 * Run: node scripts/generate-brand.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_BRAND = path.join(ROOT, "public", "brand");
const OUT_APP = path.join(ROOT, "src", "app");
const OUT_LIB = path.join(ROOT, "src", "lib", "brand");
fs.mkdirSync(OUT_BRAND, { recursive: true });

/* ------------------------------------------------------------------ */
/* Brand palette (from the official reference artwork)                 */
/* ------------------------------------------------------------------ */
const C = {
  primary: "#2563EB", // Azul principal
  dark: "#0F172A", // Escuro
  muted: "#94A3B8", // Cinza
  background: "#F8FAFC", // Fundo
  white: "#FFFFFF",
};

/* ------------------------------------------------------------------ */
/* 1. Mark — traced vector of the cart-"e" symbol                       */
/* ------------------------------------------------------------------ */
// potrace group transform: translate(0,188) scale(0.1,-0.1)
const MARK_RAW = [
  "M597 1846 c-76 -28 -117 -86 -117 -164 0 -58 28 -106 79 -136 26 -15\n58 -20 137 -24 71 -3 107 -9 115 -18 6 -8 33 -161 60 -340 27 -179 58 -371 70\n-427 41 -203 114 -297 265 -344 53 -16 101 -18 464 -18 298 0 416 3 447 13 94\n28 193 125 196 193 2 26 -4 36 -24 47 -23 14 -35 13 -115 -6 -174 -41 -277\n-55 -409 -55 -208 0 -326 39 -444 149 -74 68 -124 163 -148 278 -13 66 -14 93\n-4 159 19 138 93 258 202 327 87 56 171 81 291 87 184 10 299 -27 399 -126 61\n-62 94 -121 111 -202 22 -107 -12 -173 -110 -209 -114 -43 -303 -78 -509 -95\n-46 -4 -83 -10 -83 -15 0 -4 13 -25 29 -48 21 -28 51 -51 98 -74 l68 -33 145\n1 c114 1 162 6 225 23 178 47 298 136 369 271 73 138 73 317 1 469 -46 97\n-161 213 -255 260 -138 67 -107 65 -845 68 -553 2 -677 0 -708 -11z",
  "M1653 1359 c-58 -11 -116 -43 -148 -81 -34 -40 -64 -105 -65 -137 0\n-24 0 -24 83 -17 91 7 321 42 380 57 33 9 37 13 32 32 -16 51 -55 95 -107 120\n-62 29 -117 38 -175 26z",
  "M245 1350 c-164 -5 -195 -12 -215 -50 -16 -31 -12 -85 10 -113 35\n-44 66 -48 319 -39 l233 7 29 33 c16 18 29 44 29 58 0 41 -29 84 -65 100 -35\n14 -46 15 -340 4z",
  "M358 971 c-116 -6 -129 -8 -152 -30 -21 -20 -26 -34 -26 -73 0 -40 5\n-53 26 -73 15 -14 36 -26 48 -27 75 -5 437 5 463 13 41 13 73 53 73 91 0 40\n-24 82 -55 96 -27 12 -138 13 -377 3z",
  "M1242 303 c-45 -22 -74 -67 -79 -122 -4 -36 0 -53 19 -80 37 -54 72\n-75 126 -75 60 0 114 31 136 78 61 130 -73 263 -202 199z",
  "M1880 301 c-48 -26 -72 -62 -77 -118 -4 -39 0 -55 19 -82 37 -55 71\n-75 128 -75 57 0 91 20 128 75 45 65 14 167 -62 203 -45 21 -93 20 -136 -3z",
];

/** Transform one potrace path (abs M + rel c/l/z, with implicit repeats) with x*0.1 / 188-y*0.1. */
function transformMark(d) {
  const tokens = d.match(/[MmLlCcZz]|-?\d*\.?\d+/g);
  const isNum = (t) => t !== undefined && /^[MmLlCcZz]$/.test(t) === false;
  let out = [];
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === "M") {
      const x = parseFloat(tokens[i++]) * 0.1;
      const y = 188 - parseFloat(tokens[i++]) * 0.1;
      out.push(`M${r(x)} ${r(y)}`);
    } else if (cmd === "c") {
      do {
        const n = tokens.slice(i, i + 6).map(parseFloat);
        i += 6;
        out.push(
          `c${r(n[0] * 0.1)} ${r(n[1] * -0.1)} ${r(n[2] * 0.1)} ${r(n[3] * -0.1)} ${r(n[4] * 0.1)} ${r(n[5] * -0.1)}`
        );
      } while (isNum(tokens[i]));
    } else if (cmd === "l") {
      do {
        const dx = parseFloat(tokens[i++]) * 0.1;
        const dy = parseFloat(tokens[i++]) * -0.1;
        out.push(`l${r(dx)} ${r(dy)}`);
      } while (isNum(tokens[i]));
    } else if (cmd === "z" || cmd === "Z") {
      out.push("z");
    } else {
      throw new Error(`unexpected command ${cmd}`);
    }
  }
  return out.join(" ");
}
const r = (n) => Math.round(n * 100) / 100;

/** Bounding box of a path — handles absolute M/L/C/Q and relative c/l (with implicit repeats). */
function pathBBox(d) {
  let x = 0, y = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const tokens = d.match(/[MmLlCcQqHhVvZz]|-?\d*\.?\d+/g);
  const isNum = (t) => t !== undefined && /^[MmLlCcQqHhVvZz]$/.test(t) === false;
  const visit = (px, py) => {
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  };
  const num = () => parseFloat(tokens[i++]);
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === "M") { x = num(); y = num(); visit(x, y); }
    else if (cmd === "m") { x += num(); y += num(); visit(x, y); }
    else if (cmd === "L") { do { x = num(); y = num(); visit(x, y); } while (isNum(tokens[i])); }
    else if (cmd === "l") { do { x += num(); y += num(); visit(x, y); } while (isNum(tokens[i])); }
    else if (cmd === "C") {
      do { visit(num(), num()); visit(num(), num()); x = num(); y = num(); visit(x, y); } while (isNum(tokens[i]));
    } else if (cmd === "c") {
      do {
        visit(x + num(), y + num()); visit(x + num(), y + num());
        x += num(); y += num(); visit(x, y);
      } while (isNum(tokens[i]));
    } else if (cmd === "Q") {
      do { visit(num(), num()); x = num(); y = num(); visit(x, y); } while (isNum(tokens[i]));
    } else if (cmd === "q") {
      do { visit(x + num(), y + num()); x += num(); y += num(); visit(x, y); } while (isNum(tokens[i]));
    }
    // H/V/Z not emitted by our pipeline; ignore safely.
  }
  return { x1: minX, y1: minY, x2: maxX, y2: maxY };
}

function translatePath(d, tx, ty) {
  return d.replace(/([Mm])(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (_, c, x, y) =>
    `M${r(parseFloat(x) + tx)} ${r(parseFloat(y) + ty)}`
  );
}

// Normalize: apply trace transform, then shift bbox to origin.
const markPaths = MARK_RAW.map(transformMark);
const markBox = markPaths.reduce(
  (acc, d) => {
    const b = pathBBox(d);
    return {
      x1: Math.min(acc.x1, b.x1), y1: Math.min(acc.y1, b.y1),
      x2: Math.max(acc.x2, b.x2), y2: Math.max(acc.y2, b.y2),
    };
  },
  { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity }
);
const markW = r(markBox.x2 - markBox.x1);
const markH = r(markBox.y2 - markBox.y1);
const markOut = markPaths.map((d) => translatePath(d, -markBox.x1, -markBox.y1));
const MARK_VIEWBOX = `0 0 ${markW} ${markH}`;

/* ------------------------------------------------------------------ */
/* 2. Wordmark — "Elicani" in Poppins Black, rounded + outlined         */
/* ------------------------------------------------------------------ */
const font = opentype.parse(
  fs.readFileSync(path.join(ROOT, "scripts", "brand", "Poppins-Black.ttf")).buffer
);
const TEXT = "Elicani";
const STROKE = 14; // corner-rounding stroke (em units) — soft rounded look, counters stay open
const CAP_TARGET = 100; // final cap height in mark space units

// Split a path into contours (each begins with M).
function contours(path) {
  const list = [];
  let cur = null;
  const cmds = path.commands;
  for (const c of cmds) {
    if (c.type === "M") {
      if (cur) list.push(cur);
      cur = { type: "M", ...c, commands: [c] };
    } else {
      cur.commands.push(c);
    }
  }
  if (cur) list.push(cur);
  return list;
}
function contourBBox(c) {
  let x = 0, y = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const cmd of c.commands) {
    if (cmd.type === "M") { x = cmd.x; y = cmd.y; }
    else if (cmd.type === "L") { x = cmd.x; y = cmd.y; }
    else if (cmd.type === "C") { x = cmd.x1; y = cmd.y1; x = cmd.x2; y = cmd.y2; x = cmd.x; y = cmd.y; }
    else if (cmd.type === "Q") { x = cmd.x1; y = cmd.y1; x = cmd.x; y = cmd.y; }
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { x1: minX, y1: minY, x2: maxX, y2: maxY };
}
// Shape each glyph with kerning; separate the blue i-dots from the stems.
let xCursor = 0;
let prevGlyph = null;
const bodyContours = [];
const dotContours = [];
let glyphBox = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
for (const ch of TEXT) {
  const glyph = font.charToGlyph(ch);
  if (prevGlyph) xCursor += font.getKerningValue(prevGlyph, glyph);
  const p = glyph.getPath(xCursor, 0, 1000);
  const b = p.getBoundingBox();
  glyphBox = {
    x1: Math.min(glyphBox.x1, b.x1), y1: Math.min(glyphBox.y1, b.y1),
    x2: Math.max(glyphBox.x2, b.x2), y2: Math.max(glyphBox.y2, b.y2),
  };
  const cs = contours(p);
  if (ch === "i" && cs.length === 2) {
    const boxes = cs.map(contourBBox);
    // The dot is the shorter of the two contours (stem is the tall one).
    const heights = boxes.map((b) => b.y2 - b.y1);
    const dotIdx = heights[0] < heights[1] ? 0 : 1;
    bodyContours.push(cs[1 - dotIdx]);
    dotContours.push(cs[dotIdx]);
  } else {
    bodyContours.push(...cs);
  }
  xCursor += glyph.advanceWidth;
  prevGlyph = glyph;
}
const capHeight = Math.abs(glyphBox.y1); // 'E' cap height at size 1000

// Scale so the ROUNDED cap height equals CAP_TARGET, baseline at 62% of mark height.
const k = CAP_TARGET / (capHeight + STROKE);
const baselineY = r(markH * 0.62);
// Position: wordmark starts 33 units after the mark (reference spacing), incl. stroke bleed.
const GAP = 33;
const wordLeft = markW + GAP;
const tx = wordLeft + (STROKE / 2) * k - glyphBox.x1 * k;

function placePath(cs) {
  const out = [];
  for (const c of cs) {
    for (const cmd of c.commands) {
      if (cmd.type === "M") out.push(`M${r(cmd.x * k + tx)} ${r(cmd.y * k + baselineY)}`);
      else if (cmd.type === "L") out.push(`L${r(cmd.x * k + tx)} ${r(cmd.y * k + baselineY)}`);
      else if (cmd.type === "C")
        out.push(
          `C${r(cmd.x1 * k + tx)} ${r(cmd.y1 * k + baselineY)} ${r(cmd.x2 * k + tx)} ${r(cmd.y2 * k + baselineY)} ${r(cmd.x * k + tx)} ${r(cmd.y * k + baselineY)}`
        );
      else if (cmd.type === "Q")
        out.push(`Q${r(cmd.x1 * k + tx)} ${r(cmd.y1 * k + baselineY)} ${r(cmd.x * k + tx)} ${r(cmd.y * k + baselineY)}`);
    }
    out.push("Z");
  }
  return out.join(" ");
}

const wordBody = placePath(bodyContours);
const wordDots = dotContours.map((c) => placePath([c]));
const strokePx = r(STROKE * k);
const wordBox = pathBBox(wordBody);
const logoW = r(wordBox.x2 + strokePx / 2);
const LOGO_VIEWBOX = `0 0 ${logoW} ${markH}`;

/* ------------------------------------------------------------------ */
/* 3. SVG asset files                                                   */
/* ------------------------------------------------------------------ */
const markG = (fill) =>
  markOut.map((d) => `<path d="${d}" fill="${fill}"/>`).join("");
const wordG = (fill) =>
  `<path d="${wordBody}" fill="${fill}" stroke="${fill}" stroke-width="${strokePx}" stroke-linejoin="round" stroke-linecap="round"/>`;
const dotsG = (fill) =>
  wordDots.map((d) => `<path d="${d}" fill="${fill}" stroke="${fill}" stroke-width="${strokePx}" stroke-linejoin="round" stroke-linecap="round"/>`).join("");

function logoSvg({ mark, word, dots }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}" role="img" aria-label="Elicani">
  <title>Elicani</title>
  ${markG(mark)}
  ${wordG(word)}
  ${dotsG(dots)}
</svg>
`;
}
function markSvg(fill, viewBox = MARK_VIEWBOX) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Elicani">
  <title>Elicani</title>
  ${markG(fill)}
</svg>
`;
}

const files = {
  // Primary logo (light backgrounds): blue mark + navy wordmark, blue i-dots
  "elicani-logo.svg": logoSvg({ mark: C.primary, word: C.dark, dots: C.primary }),
  "elicani-logo-light.svg": logoSvg({ mark: C.primary, word: C.dark, dots: C.primary }),
  // Dark backgrounds: blue mark + white wordmark
  "elicani-logo-dark.svg": logoSvg({ mark: C.primary, word: C.white, dots: C.primary }),
  // Monochrome (print / special use)
  "elicani-monochrome.svg": logoSvg({ mark: C.dark, word: C.dark, dots: C.dark }),
  "elicani-monochrome-light.svg": logoSvg({ mark: C.white, word: C.white, dots: C.white }),
  // Standalone mark (blue is background-agnostic per the reference)
  "elicani-mark.svg": markSvg(C.primary),
  "elicani-mark-light.svg": markSvg(C.primary),
  "elicani-mark-dark.svg": markSvg(C.primary),
  "elicani-mark-mono.svg": markSvg(C.dark),
  "elicani-mark-white.svg": markSvg(C.white),
  // SVG favicon — standalone mark
  "elicani-favicon.svg": markSvg(C.primary),
};
for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT_BRAND, name), content);
}
fs.writeFileSync(path.join(OUT_APP, "icon.svg"), files["elicani-favicon.svg"]);
console.log(`svg: ${Object.keys(files).length + 1} ficheiros`);

/* ------------------------------------------------------------------ */
/* 4. Raster assets (PNG/ICO/OG)                                        */
/* ------------------------------------------------------------------ */
const markSvgBuf = (fill, size) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${MARK_VIEWBOX}">${markG(fill)}</svg>`
  );
const logoSvgBuf = (w) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${Math.round((w * markH) / logoW)}" viewBox="${LOGO_VIEWBOX}">${markG(C.primary)}${wordG(C.dark)}${dotsG(C.primary)}</svg>`
  );

// App tile: blue squircle + white mark (per the reference app icon)
async function tileIcon(size, out) {
  const markSize = Math.round(size * 0.58);
  const markTop = Math.round((size - (markSize * markH) / markW) / 2);
  const markLeft = Math.round((size - markSize) / 2);
  const mark = await sharp(markSvgBuf(C.white, markSize)).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0x25, g: 0x63, b: 0xeb, alpha: 1 } },
  })
    .composite([
      { input: mark, left: markLeft, top: markTop },
    ])
    .png()
    .toFile(out);
}

await tileIcon(192, path.join(OUT_BRAND, "elicani-icon-192.png"));
await tileIcon(512, path.join(OUT_BRAND, "elicani-icon-512.png"));
await tileIcon(180, path.join(OUT_BRAND, "elicani-apple-icon.png"));
await tileIcon(180, path.join(OUT_APP, "apple-icon.png"));

// favicon.ico: 16/32/48 — white tile + blue mark (per the reference favicon)
async function icoEntry(size) {
  const markSize = Math.round(size * 0.72);
  const markTop = Math.round((size - (markSize * markH) / markW) / 2);
  const markLeft = Math.round((size - markSize) / 2);
  const mark = await sharp(markSvgBuf(C.primary, markSize)).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0xff, g: 0xff, b: 0xff, alpha: 1 } },
  })
    .composite([{ input: mark, left: markLeft, top: markTop }])
    .png()
    .toBuffer();
}
{
  const entries = [];
  for (const size of [16, 32, 48]) entries.push({ size, buf: await icoEntry(size) });
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dir = [];
  for (const e of entries) {
    const d = Buffer.alloc(16);
    d.writeUInt8(e.size === 48 ? 48 : e.size, 0); // width (0 = 256)
    d.writeUInt8(e.size === 48 ? 48 : e.size, 1); // height
    d.writeUInt8(0, 2); // colors
    d.writeUInt8(0, 3); // reserved
    d.writeUInt16LE(1, 4); // planes
    d.writeUInt16LE(32, 6); // bpp
    d.writeUInt32LE(e.buf.length, 8);
    d.writeUInt32LE(offset, 12);
    offset += e.buf.length;
    dir.push(d);
  }
  fs.writeFileSync(
    path.join(OUT_BRAND, "elicani-favicon.ico"),
    Buffer.concat([header, ...dir, ...entries.map((e) => e.buf)])
  );
  // Also place it as the app favicon (replaces the default Next.js favicon.ico).
  fs.writeFileSync(
    path.join(OUT_APP, "favicon.ico"),
    Buffer.concat([header, ...dir, ...entries.map((e) => e.buf)])
  );
}

// Open Graph image: 1200×630, clean composition, no tagline
{
  const ogW = 1200, ogH = 630;
  const logoWpx = 620;
  const logo = await sharp(logoSvgBuf(logoWpx)).png().toBuffer();
  const meta = await sharp(logo).metadata();
  await sharp({
    create: { width: ogW, height: ogH, channels: 4, background: { r: 0xf8, g: 0xfa, b: 0xfc, alpha: 1 } },
  })
    .composite([
      { input: logo, left: Math.round((ogW - logoWpx) / 2), top: Math.round((ogH - meta.height) / 2) },
    ])
    .png()
    .toFile(path.join(OUT_BRAND, "elicani-og.png"));
}
console.log("png: icons + favicon.ico + og");

/* ------------------------------------------------------------------ */
/* 5. Inline path data for the React <Logo/> component                 */
/* ------------------------------------------------------------------ */
const ts = `// AUTO-GENERATED by scripts/generate-brand.mjs — do not edit by hand.
// Official Elicani brand geometry: cart-"e" mark (traced from the reference
// artwork) + "Elicani" wordmark (Poppins Black, OFL, outlined to paths).

/** Standalone mark viewBox (cart-"e" symbol). */
export const MARK_VIEWBOX = "${MARK_VIEWBOX}";
/** Mark path data (fill with the appropriate brand color). */
export const MARK_PATHS = ${JSON.stringify(markOut, null, 2)} as const;

/** Full horizontal logo viewBox (mark + wordmark). */
export const LOGO_VIEWBOX = "${LOGO_VIEWBOX}";
/** Wordmark body outline — draw with a same-color round stroke of this width. */
export const WORDMARK_BODY = "${wordBody}";
/** The two i-dots (rendered in the brand blue on color variants). */
export const WORDMARK_DOTS = ${JSON.stringify(wordDots, null, 2)} as const;
/** Corner-rounding stroke width for the wordmark (logo viewBox units). */
export const WORDMARK_STROKE = ${strokePx};
`;
fs.mkdirSync(OUT_LIB, { recursive: true });
fs.writeFileSync(path.join(OUT_LIB, "logo-paths.ts"), ts);
console.log("logo-paths.ts escrito · mark", MARK_VIEWBOX, "· logo", LOGO_VIEWBOX);
