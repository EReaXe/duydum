#!/usr/bin/env node
'use strict';

// Lossless local MP3 trimming: retain complete Layer III frames from the start.
const fs = require('node:fs');
const path = require('node:path');

function headerAt(bytes, offset) {
  if (offset + 4 > bytes.length) return null;
  const word = bytes.readUInt32BE(offset);
  if ((word >>> 21) !== 0x7ff) return null;
  const version = (word >>> 19) & 3;
  const layer = (word >>> 17) & 3;
  const bitrateIndex = (word >>> 12) & 15;
  const sampleIndex = (word >>> 10) & 3;
  if (version === 1 || layer !== 1 || !bitrateIndex || bitrateIndex === 15 || sampleIndex === 3) return null;
  const rates = version === 3
    ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
    : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
  const sampleRate = [44100, 48000, 32000][sampleIndex] / (version === 3 ? 1 : version === 2 ? 2 : 4);
  const samples = version === 3 ? 1152 : 576;
  const length = Math.floor((version === 3 ? 144000 : 72000) * rates[bitrateIndex] / sampleRate) + ((word >>> 9) & 1);
  return {version, sampleRate, samples, length, crc: ((word >>> 16) & 1) === 0, mono: ((word >>> 6) & 3) === 3};
}

function trimMp3(input, output, maximumSeconds = 16) {
  if (!(maximumSeconds > 0 && Number.isFinite(maximumSeconds))) throw Error('Maximum seconds must be a positive number.');
  const bytes = fs.readFileSync(input);
  let start = 0;
  if (bytes.subarray(0, 3).toString('ascii') === 'ID3') {
    if (bytes.length < 10 || [...bytes.subarray(6, 10)].some(value => value > 127)) throw Error('Invalid ID3 header.');
    const tagSize = (bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9];
    start = 10 + tagSize + (bytes[3] === 4 && (bytes[5] & 16) ? 10 : 0);
  }
  let first;
  for (; start + 4 < bytes.length; start++) {
    first = headerAt(bytes, start);
    if (!first) continue;
    const second = headerAt(bytes, start + first.length);
    const third = second && headerAt(bytes, start + first.length + second.length);
    if (second && third && [second, third].every(h => h.version === first.version && h.sampleRate === first.sampleRate)) break;
  }
  if (!first || start + first.length >= bytes.length) throw Error('No validated Layer III frame sequence found.');
  let offset = start, samples = 0, frames = 0;
  while (offset < bytes.length) {
    const h = headerAt(bytes, offset);
    if (!h || h.version !== first.version || h.sampleRate !== first.sampleRate || offset + h.length > bytes.length) {
      const tail = bytes.subarray(offset);
      if (tail.length === 128 && tail.subarray(0, 3).toString() === 'TAG') break;
      if (tail.every(value => value === 0)) break;
      throw Error(`Invalid or incomplete frame at byte ${offset}; refusing output.`);
    }
    if ((samples + h.samples) / first.sampleRate > maximumSeconds) break;
    samples += h.samples; offset += h.length; frames++;
  }
  if (!frames) throw Error('Maximum duration is shorter than one frame.');
  const result = Buffer.from(bytes.subarray(start, offset));
  // Old seek tables report the full original duration. Disable their signatures;
  // keep the complete first frame so audio starts at the original position.
  const sideInfo = first.version === 3 ? (first.mono ? 17 : 32) : (first.mono ? 9 : 17);
  const xingOffset = 4 + (first.crc ? 2 : 0) + sideInfo;
  const clearedMetadata = [];
  for (const [position, signatures] of [[xingOffset, ['Xing', 'Info']], [36, ['VBRI']]]) {
    const signature = result.subarray(position, position + 4).toString('ascii');
    if (signatures.includes(signature)) {
      if (first.crc) throw Error('CRC-protected metadata requires an external encoder.');
      result.fill(0, position, position + 4); clearedMetadata.push(signature);
    }
  }
  let verifiedOffset = 0, verifiedSamples = 0;
  while (verifiedOffset < result.length) {
    const h = headerAt(result, verifiedOffset);
    if (!h || verifiedOffset + h.length > result.length) throw Error('Output frame verification failed.');
    verifiedOffset += h.length; verifiedSamples += h.samples;
  }
  const seconds = verifiedSamples / first.sampleRate;
  if (verifiedOffset !== result.length || seconds > maximumSeconds) throw Error('Output duration verification failed.');
  fs.mkdirSync(path.dirname(path.resolve(output)), {recursive: true});
  fs.writeFileSync(output, result);
  return {inputBytes: bytes.length, outputBytes: result.length, frames, sampleRate: first.sampleRate, seconds, clearedMetadata};
}

if (require.main === module) {
  const [input, output, seconds = '16'] = process.argv.slice(2);
  if (!input || !output) { console.error('Usage: node scripts/prepare-audio.cjs input.mp3 output.mp3 [maximum-seconds]'); process.exitCode = 1; }
  else { try { console.log(JSON.stringify(trimMp3(input, output, Number(seconds)))); } catch (error) { console.error(error.message); process.exitCode = 1; } }
}
module.exports = {headerAt, trimMp3};
