/**
 * qr-code.js — Minimal QR Code generator for VIBRRA Chrome Extension
 *
 * Based on Project Nayuki's QR Code generator (public domain).
 * Stripped to essentials: Byte mode, ECC level M, versions 1-10.
 * Sufficient for encoding URLs up to ~120 characters.
 *
 * Usage:
 *   VIBRRA_QR.render(canvasElement, 'vibrra://login/abc123', {
 *     scale: 5,
 *     foreground: '#FFE566',
 *     background: '#1A1A1A',
 *   });
 */
;(function (global) {
  'use strict';

  // ── Reed-Solomon & GF(256) arithmetic ──────────────────────────

  const GF_EXP = new Uint8Array(256);
  const GF_LOG = new Uint8Array(256);
  (function initGF() {
    let val = 1;
    for (let i = 0; i < 255; i++) {
      GF_EXP[i] = val;
      GF_LOG[val] = i;
      val = (val << 1) ^ (val >= 128 ? 0x11D : 0);
    }
    GF_EXP[255] = GF_EXP[0];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
  }

  function rsGeneratorPoly(degree) {
    let gen = new Uint8Array([1]);
    for (let i = 0; i < degree; i++) {
      const next = new Uint8Array(gen.length + 1);
      const factor = GF_EXP[i];
      for (let j = 0; j < gen.length; j++) {
        next[j] ^= gen[j];
        next[j + 1] ^= gfMul(gen[j], factor);
      }
      gen = next;
    }
    return gen;
  }

  function rsEncode(data, eccCount) {
    const gen = rsGeneratorPoly(eccCount);
    const result = new Uint8Array(eccCount);
    for (let i = 0; i < data.length; i++) {
      const factor = data[i] ^ result[0];
      result.copyWithin(0, 1);
      result[eccCount - 1] = 0;
      for (let j = 0; j < eccCount; j++) {
        result[j] ^= gfMul(gen[j + 1], factor);
      }
    }
    return result;
  }

  // ── QR Code version/capacity tables (ECC level M) ─────────────

  // Total codewords, ECC codewords per block, num blocks group1, data cw group1, num blocks group2, data cw group2
  const VERSION_TABLE = [
    null, // index 0 unused
    [26, 10, 1, 16, 0, 0],     // v1
    [44, 16, 1, 28, 0, 0],     // v2
    [70, 26, 1, 44, 0, 0],     // v3
    [100, 18, 2, 32, 0, 0],    // v4
    [134, 24, 2, 43, 0, 0],    // v5
    [172, 16, 4, 27, 0, 0],    // v6
    [196, 18, 4, 31, 0, 0],    // v7
    [242, 22, 2, 38, 2, 39],   // v8
    [292, 22, 3, 36, 2, 37],   // v9
    [346, 26, 4, 43, 1, 44],   // v10
  ];

  // Alignment pattern positions per version
  const ALIGN_POS = [
    null, [], [6, 18], [6, 22], [6, 26], [6, 30],
    [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
  ];

  // Format info bits for mask 0-7, ECC level M (01)
  const FORMAT_BITS = [
    0x5412, 0x5125, 0x5E7C, 0x5B4B, 0x45F9, 0x40CE, 0x4F97, 0x4AA0,
  ];

  // Version info bits (versions 7+)
  const VERSION_INFO = [
    null, null, null, null, null, null, null,
    0x07C94, 0x085BC, 0x09A99, 0x0A4D3,
  ];

  // ── Encode data as byte-mode codewords ─────────────────────────

  function encodeData(text) {
    const bytes = new TextEncoder().encode(text);
    const bits = [];

    function pushBits(val, len) {
      for (let i = len - 1; i >= 0; i--) {
        bits.push((val >>> i) & 1);
      }
    }

    // Mode indicator: byte mode = 0100
    pushBits(0b0100, 4);

    // Find minimum version
    let version = 0;
    for (let v = 1; v <= 10; v++) {
      const vt = VERSION_TABLE[v];
      const totalEcc = vt[1] * (vt[2] + vt[4]);
      const dataCapacity = vt[0] - totalEcc;
      // Byte mode: 4 mode + charCountBits + 8*len + 4 terminator (max)
      const charCountBits = v <= 9 ? 8 : 16;
      const needed = Math.ceil((4 + charCountBits + 8 * bytes.length) / 8);
      if (needed <= dataCapacity) {
        version = v;
        break;
      }
    }
    if (version === 0) throw new Error('Data too long for QR v1-10');

    const charCountBits = version <= 9 ? 8 : 16;
    pushBits(bytes.length, charCountBits);

    for (const b of bytes) {
      pushBits(b, 8);
    }

    // Calculate data capacity
    const vt = VERSION_TABLE[version];
    const totalEcc = vt[1] * (vt[2] + vt[4]);
    const dataCapacity = vt[0] - totalEcc;
    const totalDataBits = dataCapacity * 8;

    // Terminator (up to 4 zeros)
    const terminatorLen = Math.min(4, totalDataBits - bits.length);
    for (let i = 0; i < terminatorLen; i++) bits.push(0);

    // Pad to byte boundary
    while (bits.length % 8 !== 0) bits.push(0);

    // Convert to bytes
    const dataBytes = new Uint8Array(dataCapacity);
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] || 0);
      dataBytes[i / 8] = byte;
    }

    // Fill with pad bytes 0xEC, 0x11
    for (let i = Math.ceil(bits.length / 8); i < dataCapacity; i++) {
      dataBytes[i] = i % 2 === Math.ceil(bits.length / 8) % 2 ? 0xEC : 0x11;
    }

    return { version, dataBytes };
  }

  // ── Interleave data + ECC blocks ───────────────────────────────

  function interleave(version, dataBytes) {
    const vt = VERSION_TABLE[version];
    const eccPerBlock = vt[1];
    const g1Blocks = vt[2];
    const g1DataCw = vt[3];
    const g2Blocks = vt[4];
    const g2DataCw = vt[5];

    const dataBlocks = [];
    const eccBlocks = [];
    let offset = 0;

    for (let i = 0; i < g1Blocks; i++) {
      const block = dataBytes.slice(offset, offset + g1DataCw);
      dataBlocks.push(block);
      eccBlocks.push(rsEncode(block, eccPerBlock));
      offset += g1DataCw;
    }
    for (let i = 0; i < g2Blocks; i++) {
      const block = dataBytes.slice(offset, offset + g2DataCw);
      dataBlocks.push(block);
      eccBlocks.push(rsEncode(block, eccPerBlock));
      offset += g2DataCw;
    }

    // Interleave data codewords
    const result = [];
    const maxDataLen = Math.max(g1DataCw, g2DataCw);
    for (let i = 0; i < maxDataLen; i++) {
      for (const block of dataBlocks) {
        if (i < block.length) result.push(block[i]);
      }
    }
    // Interleave ECC codewords
    for (let i = 0; i < eccPerBlock; i++) {
      for (const block of eccBlocks) {
        result.push(block[i]);
      }
    }

    return new Uint8Array(result);
  }

  // ── Build QR matrix ────────────────────────────────────────────

  function createMatrix(version) {
    const size = version * 4 + 17;
    // 0 = white, 1 = black, -1 = unset
    const matrix = Array.from({ length: size }, () => new Int8Array(size).fill(-1));
    return { size, matrix };
  }

  function placeFinderPattern(matrix, row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r;
        const cc = col + c;
        if (rr < 0 || rr >= matrix.length || cc < 0 || cc >= matrix.length) continue;
        const inOuter = r === -1 || r === 7 || c === -1 || c === 7;
        const inBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[rr][cc] = (inBorder || inInner) && !inOuter ? 1 : 0;
      }
    }
  }

  function placeAlignmentPattern(matrix, row, col) {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const val = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0) ? 1 : 0;
        matrix[row + r][col + c] = val;
      }
    }
  }

  function placePatterns(qr, version) {
    const { size, matrix } = qr;

    // Finder patterns
    placeFinderPattern(matrix, 0, 0);
    placeFinderPattern(matrix, 0, size - 7);
    placeFinderPattern(matrix, size - 7, 0);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0 ? 1 : 0;
      matrix[i][6] = i % 2 === 0 ? 1 : 0;
    }

    // Alignment patterns
    if (version >= 2) {
      const pos = ALIGN_POS[version];
      for (const r of pos) {
        for (const c of pos) {
          // Skip if overlaps finder pattern
          if (r <= 8 && c <= 8) continue;
          if (r <= 8 && c >= size - 8) continue;
          if (r >= size - 8 && c <= 8) continue;
          placeAlignmentPattern(matrix, r, c);
        }
      }
    }

    // Dark module
    matrix[size - 8][8] = 1;

    // Reserve format info areas (filled later)
    for (let i = 0; i < 8; i++) {
      if (matrix[8][i] === -1) matrix[8][i] = 0;
      if (matrix[i][8] === -1) matrix[i][8] = 0;
      if (matrix[8][size - 1 - i] === -1) matrix[8][size - 1 - i] = 0;
      if (matrix[size - 1 - i][8] === -1) matrix[size - 1 - i][8] = 0;
    }
    if (matrix[8][8] === -1) matrix[8][8] = 0;

    // Reserve version info (v7+)
    if (version >= 7) {
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
          matrix[i][size - 11 + j] = 0;
          matrix[size - 11 + j][i] = 0;
        }
      }
    }
  }

  function placeData(qr, codewords) {
    const { size, matrix } = qr;
    let bitIdx = 0;
    const totalBits = codewords.length * 8;

    // Traverse columns right-to-left, two at a time
    for (let col = size - 1; col >= 1; col -= 2) {
      if (col === 6) col = 5; // Skip timing column

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < 2; j++) {
          const c = col - j;
          const upward = ((size - 1 - col) >> 1) % 2 === 0;
          const r = upward ? size - 1 - i : i;

          if (matrix[r][c] !== -1) continue;
          if (bitIdx < totalBits) {
            matrix[r][c] = (codewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
            bitIdx++;
          } else {
            matrix[r][c] = 0;
          }
        }
      }
    }
  }

  // ── Masking ────────────────────────────────────────────────────

  const MASK_FNS = [
    (r, c) => (r + c) % 2 === 0,
    (r, c) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ];

  function isDataModule(qr, version, r, c) {
    const { size } = qr;
    // Finder + separator
    if (r <= 8 && c <= 8) return false;
    if (r <= 8 && c >= size - 8) return false;
    if (r >= size - 8 && c <= 8) return false;
    // Timing
    if (r === 6 || c === 6) return false;
    // Alignment
    if (version >= 2) {
      const pos = ALIGN_POS[version];
      for (const pr of pos) {
        for (const pc of pos) {
          if (pr <= 8 && pc <= 8) continue;
          if (pr <= 8 && pc >= size - 8) continue;
          if (pr >= size - 8 && pc <= 8) continue;
          if (Math.abs(r - pr) <= 2 && Math.abs(c - pc) <= 2) return false;
        }
      }
    }
    // Format info
    if (r === 8 && (c <= 8 || c >= size - 8)) return false;
    if (c === 8 && (r <= 8 || r >= size - 8)) return false;
    // Version info
    if (version >= 7) {
      if (r < 6 && c >= size - 11) return false;
      if (c < 6 && r >= size - 11) return false;
    }
    // Dark module
    if (r === size - 8 && c === 8) return false;
    return true;
  }

  function applyMask(qr, version, maskIdx) {
    const { size, matrix } = qr;
    const fn = MASK_FNS[maskIdx];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (isDataModule(qr, version, r, c) && fn(r, c)) {
          matrix[r][c] ^= 1;
        }
      }
    }
  }

  function placeFormatInfo(qr, maskIdx) {
    const { size, matrix } = qr;
    const bits = FORMAT_BITS[maskIdx];

    // Horizontal (left of finder + right)
    const positions = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5],
      [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1],
    ];
    // Vertical (below finder + top)
    const vPositions = [
      [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8],
      [size - 7, 8], [size - 6, 8], [size - 5, 8], [size - 4, 8],
      [size - 3, 8], [size - 2, 8], [size - 1, 8],
    ];

    for (let i = 0; i < 15; i++) {
      const bit = (bits >>> (14 - i)) & 1;
      if (i < positions.length) {
        matrix[positions[i][0]][positions[i][1]] = bit;
      }
    }
    for (let i = 0; i < 15; i++) {
      const bit = (bits >>> i) & 1;
      matrix[vPositions[i][0]][vPositions[i][1]] = bit;
    }
  }

  function placeVersionInfo(qr, version) {
    if (version < 7) return;
    const { size, matrix } = qr;
    const bits = VERSION_INFO[version];
    for (let i = 0; i < 18; i++) {
      const bit = (bits >>> i) & 1;
      const r = Math.floor(i / 3);
      const c = size - 11 + (i % 3);
      matrix[r][c] = bit;
      matrix[c][r] = bit;
    }
  }

  // ── Penalty scoring for mask selection ─────────────────────────

  function penaltyScore(matrix) {
    const size = matrix.length;
    let score = 0;

    // Rule 1: consecutive same-color modules in rows/cols
    for (let r = 0; r < size; r++) {
      let count = 1;
      for (let c = 1; c < size; c++) {
        if (matrix[r][c] === matrix[r][c - 1]) {
          count++;
          if (count === 5) score += 3;
          else if (count > 5) score += 1;
        } else {
          count = 1;
        }
      }
    }
    for (let c = 0; c < size; c++) {
      let count = 1;
      for (let r = 1; r < size; r++) {
        if (matrix[r][c] === matrix[r - 1][c]) {
          count++;
          if (count === 5) score += 3;
          else if (count > 5) score += 1;
        } else {
          count = 1;
        }
      }
    }

    // Rule 2: 2x2 blocks of same color
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const v = matrix[r][c];
        if (v === matrix[r][c + 1] && v === matrix[r + 1][c] && v === matrix[r + 1][c + 1]) {
          score += 3;
        }
      }
    }

    // Rule 4: proportion of dark modules
    let dark = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c] === 1) dark++;
      }
    }
    const total = size * size;
    const pct = (dark * 100) / total;
    const prevFive = Math.floor(pct / 5) * 5;
    const nextFive = prevFive + 5;
    score += Math.min(Math.abs(prevFive - 50) / 5, Math.abs(nextFive - 50) / 5) * 10;

    return score;
  }

  // ── Main: generate QR code matrix ──────────────────────────────

  function generateQR(text) {
    const { version, dataBytes } = encodeData(text);
    const codewords = interleave(version, dataBytes);

    let bestMatrix = null;
    let bestPenalty = Infinity;

    for (let mask = 0; mask < 8; mask++) {
      const qr = createMatrix(version);
      placePatterns(qr, version);
      placeData(qr, codewords);
      applyMask(qr, version, mask);
      placeFormatInfo(qr, mask);
      placeVersionInfo(qr, version);

      const p = penaltyScore(qr.matrix);
      if (p < bestPenalty) {
        bestPenalty = p;
        bestMatrix = qr;
      }
    }

    return bestMatrix;
  }

  // ── Render to canvas ───────────────────────────────────────────

  function render(canvas, text, options = {}) {
    const {
      scale = 6,
      foreground = '#FFFFFF',
      background = '#111111',
      margin = 2,
    } = options;

    const qr = generateQR(text);
    const { size, matrix } = qr;
    const totalSize = (size + margin * 2) * scale;

    canvas.width = totalSize;
    canvas.height = totalSize;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, totalSize, totalSize);

    ctx.fillStyle = foreground;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c] === 1) {
          ctx.fillRect(
            (c + margin) * scale,
            (r + margin) * scale,
            scale,
            scale,
          );
        }
      }
    }
  }

  // ── Public API ─────────────────────────────────────────────────

  global.VIBRRA_QR = { render };

})(typeof window !== 'undefined' ? window : globalThis);
