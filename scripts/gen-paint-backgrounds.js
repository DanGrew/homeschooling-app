#!/usr/bin/env node
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function mkChunk(type, data) {
  const b = Buffer.alloc(12 + data.length);
  b.writeUInt32BE(data.length, 0);
  b.write(type, 4, 'ascii');
  data.copy(b, 8);
  b.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return b;
}
function writePNG(filePath, w, h, pixelFn) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const raw = [];
  for (let y = 0; y < h; y++) {
    raw.push(0);
    for (let x = 0; x < w; x++) { const [r,g,b] = pixelFn(x,y,w,h); raw.push(r,g,b); }
  }
  fs.writeFileSync(filePath, Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    mkChunk('IHDR', ihdr),
    mkChunk('IDAT', zlib.deflateSync(Buffer.from(raw))),
    mkChunk('IEND', Buffer.alloc(0))
  ]));
}
function lerp(a, b, t) { return Math.round(a + (b - a) * Math.max(0, Math.min(1, t))); }

const W = 400, H = 300;
const outDir = path.join(__dirname, '..', 'app/activities/paint-playground/backgrounds');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const BG = [
  { name: 'sky',    fn: (x,y,w,h) => [lerp(135,196,y/h), lerp(206,224,y/h), lerp(235,255,y/h)] },
  { name: 'grass',  fn: (x,y,w,h) => [lerp(34,72,y/h),   lerp(139,107,y/h), lerp(34,20,y/h)]   },
  { name: 'sunset', fn: (x,y,w,h) => [lerp(255,140,y/h), lerp(120,40,y/h),  lerp(60,100,y/h)]  },
  { name: 'night',  fn: (x,y,w,h) => [lerp(15,5,y/h),    lerp(20,8,y/h),    lerp(60,25,y/h)]   },
  { name: 'ocean',  fn: (x,y,w,h) => [lerp(0,0,y/h),     lerp(105,50,y/h),  lerp(148,100,y/h)] },
  { name: 'sand',   fn: (x,y,w,h) => [lerp(240,210,y/h), lerp(220,185,y/h), lerp(160,130,y/h)] },
];

BG.forEach(({ name, fn }) => {
  const p = path.join(outDir, name + '.png');
  writePNG(p, W, H, fn);
  console.log('wrote ' + name + '.png');
});
