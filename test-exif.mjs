import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./airemover.html', import.meta.url), 'utf8');
const variantStart = html.indexOf('  // Lens aperture ladders');
const writerStart = html.indexOf('  // ----- EXIF writer -----');
const writerEnd = html.indexOf('  function decodeImage');
const code = html.slice(variantStart, writerStart) + html.slice(writerStart, writerEnd);
const factory = new Function(code + '\nreturn { PROFILES, nextVariant, buildEXIF, injectExif };');
const { PROFILES, nextVariant, buildEXIF, injectExif } = factory();

const TYPES = { 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 10: 8 };
const fail = msg => { throw new Error(msg); };
const assert = (cond, msg) => { if (!cond) fail(msg); };

function parse(app1) {
  const dv = new DataView(app1.buffer, app1.byteOffset, app1.byteLength);
  assert(app1[0] === 0xFF && app1[1] === 0xE1, 'APP1 marker missing');
  assert(dv.getUint16(2, false) <= app1.length - 2, 'APP1 length mismatch');
  assert(app1[4] === 0x45 && app1[5] === 0x78 && app1[6] === 0x69 && app1[7] === 0x66, 'Exif header missing');
  const base = 10;
  assert(app1[base] === 0x49 && app1[base + 1] === 0x49, 'TIFF is not II');
  assert(dv.getUint16(base + 2, true) === 42, 'TIFF magic wrong');

  const readIFD = off => {
    const n = dv.getUint16(base + off, true);
    const entries = [];
    let prev = -1;
    for (let i = 0; i < n; i++) {
      const at = base + off + 2 + i * 12;
      const tag = dv.getUint16(at, true);
      const type = dv.getUint16(at + 2, true);
      const count = dv.getUint32(at + 4, true);
      const size = TYPES[type] * count;
      assert(tag > prev, `tags not sorted at ${tag}`);
      prev = tag;
      const valOff = size <= 4 ? at + 8 - base : dv.getUint32(at + 8, true);
      assert(valOff >= 0 && valOff + size <= app1.length - base, `value out of bounds for tag ${tag}`);
      entries.push({ tag, type, count, size, valOff });
    }
    return entries;
  };
  const ascii = e => {
    let s = '';
    for (let i = 0; i < e.count; i++) s += String.fromCharCode(app1[base + e.valOff + i]);
    return s.replace(/\0+$/, '');
  };
  const num = e => {
    const at = base + e.valOff;
    return e.type === 3 ? dv.getUint16(at, true) : dv.getUint32(at, true);
  };
  const rat = e => {
    const at = base + e.valOff;
    return [dv.getUint32(at, true), dv.getUint32(at + 4, true)];
  };

  const ifd0 = readIFD(dv.getUint32(base + 4, true));
  const pointer = ifd0.find(e => e.tag === 0x8769);
  assert(pointer, 'no ExifIFD pointer');
  const exif = readIFD(num(pointer));
  const byTag = list => new Map(list.map(e => [e.tag, e]));
  return { ifd0: byTag(ifd0), exif: byTag(exif), ascii, num, rat };
}

const requiredExif = [0x829A, 0x829D, 0x8822, 0x8827, 0x9000, 0x9003, 0x9004, 0x9010, 0x9201, 0x9202, 0x9207, 0x9209, 0x920A, 0x9290, 0xA001, 0xA002, 0xA003, 0xA405, 0xA420, 0xA432, 0xA433, 0xA434];
const requiredIfd0 = [0x010F, 0x0110, 0x0112, 0x011A, 0x0128, 0x0131, 0x0132, 0x0213];

let shots = 0;
for (const key of Object.keys(PROFILES)) {
  const combos = new Set();
  for (let i = 0; i < 30; i++) {
    const shot = nextVariant(key);
    const dims = [4000, 3000];
    const app1 = buildEXIF(shot, ...dims);
    const { ifd0, exif, ascii, num, rat } = parse(app1);

    for (const t of requiredIfd0) assert(ifd0.has(t), `${key}: missing IFD0 tag ${t.toString(16)}`);
    for (const t of requiredExif) assert(exif.has(t), `${key}: missing Exif tag ${t.toString(16)}`);

    assert(ascii(ifd0.get(0x010F)) === shot.make, `${key}: make mismatch`);
    assert(ascii(ifd0.get(0x0110)) === shot.model, `${key}: model mismatch`);
    assert(ascii(exif.get(0xA434)) === shot.lensName, `${key}: lens mismatch`);
    assert(num(exif.get(0xA002)) === dims[0] && num(exif.get(0xA003)) === dims[1], `${key}: dimensions mismatch`);
    assert(num(exif.get(0xA405)) === shot.focal35, `${key}: 35mm equivalent mismatch`);
    assert(ascii(exif.get(0xA420)).length === 32, `${key}: bad unique id`);
    assert(/^\d{4}:\d\d:\d\d \d\d:\d\d:\d\d$/.test(ascii(exif.get(0x9003))), `${key}: bad dateformat`);
    assert(ascii(exif.get(0x9010)) === shot.offset, `${key}: offset mismatch`);

    const [n, d] = rat(exif.get(0x829D));
    assert(n > 0 && d > 0, `${key}: bad f-number`);
    const [en, ed] = rat(exif.get(0x829A));
    assert(en > 0 && ed > 0, `${key}: bad exposure`);
    assert(num(exif.get(0x8827)) === shot.iso, `${key}: ISO mismatch`);
    if (shot.serial) assert(ascii(exif.get(0xA431)) === shot.serial, `${key}: body serial mismatch`);
    if (shot.lensSerial) assert(ascii(exif.get(0xA435)) === shot.lensSerial, `${key}: lens serial mismatch`);

    // Exposure must describe a physically reachable scene (EV 4-17).
    const ev = Math.log2((shot.aperture ** 2) / shot.shutter) - Math.log2(shot.iso / 100);
    assert(ev > 4 && ev < 17, `${key}: implausible EV ${ev.toFixed(2)}`);

    combos.add(`${shot.lensName}|${shot.aperture}|${shot.shutter}|${shot.iso}|${shot.focal}`);
    shots++;
  }
  assert(combos.size === 30, `${key}: only ${combos.size} distinct combinations`);
}

const sample = new Uint8Array([0xFF, 0xD8, 0xFF, 0xD9]);
const out = new Uint8Array(await (await injectExif(new Blob([sample]), nextVariant('canon'), 6000, 4000)).arrayBuffer());
assert(out[0] === 0xFF && out[1] === 0xD8, 'SOI lost');
assert(out[2] === 0xFF && out[3] === 0xE1, 'APP1 not after SOI');
assert(out[out.length - 2] === 0xFF && out[out.length - 1] === 0xD9, 'EOI lost');
const injected = parse(out.subarray(2));
assert(injected.num(injected.exif.get(0xA002)) === 6000, 'injected width wrong');

console.log(`OK: ${shots} shots across ${Object.keys(PROFILES).length} profiles, 30 distinct combos each, EXIF parses clean`);
