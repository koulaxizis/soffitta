/* ============================================================
   NETIZEN ID — gif.js
   Minimal single-frame GIF89a encoder (literal-code LZW)
   Zero dependencies — MIT License — Christos Koulaxizis
   ============================================================ */

(function () {
  "use strict";

  /* Encode an opaque canvas to a valid static GIF.
     Returns Uint8Array, or null on catastrophic failure. */
  function encode(canvas) {
    const w = canvas.width, h = canvas.height;
    const img = canvas.getContext("2d").getImageData(0, 0, w, h).data;

    /* Pass 1: exact palette. On overflow (>256 colors from antialiased
       text edges), retry posterized to 51-step levels (max 216 colors). */
    let res = buildIndex(img, w * h, 0);
    if (!res) res = buildIndex(img, w * h, 51);
    if (!res) return null;

    const out = [];

    /* Header: GIF89a */
    out.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);

    /* Logical Screen Descriptor — no global color table */
    out.push(w & 255, (w >> 8) & 255, h & 255, (h >> 8) & 255, 0x00, 0x00, 0x00);

    /* Image Descriptor + Local Color Table (256 entries, flag 0x87) */
    out.push(0x2C, 0, 0, 0, 0, w & 255, (w >> 8) & 255, h & 255, (h >> 8) & 255, 0x87);
    for (let i = 0; i < 768; i++) out.push(i < res.palette.length ? res.palette[i] : 0);

    /* LZW stream: literal codes only (valid, larger than compressed) */
    out.push(8); /* minimum code size */
    const lzw = lzwLiteral(res.index, res.palette.length / 3);
    for (let i = 0; i < lzw.length; i += 255) {
      const n = Math.min(255, lzw.length - i);
      out.push(n);
      for (let k = 0; k < n; k++) out.push(lzw[i + k]);
    }
    out.push(0x00); /* sub-block terminator */
    out.push(0x3B); /* trailer */

    return new Uint8Array(out);
  }

  function buildIndex(data, npix, quant) {
    const map = new Map();
    const palette = [];
    const index = new Uint8Array(npix);
    for (let i = 0, n = 0; n < npix; i += 4, n++) {
      let r = data[i], g = data[i + 1], b = data[i + 2];
      if (quant) {
        r = Math.min(255, Math.round(r / quant) * quant);
        g = Math.min(255, Math.round(g / quant) * quant);
        b = Math.min(255, Math.round(b / quant) * quant);
      }
      const key = (r << 16) | (g << 8) | b;
      let pi = map.get(key);
      if (pi === undefined) {
        if (palette.length === 768) return null; /* hit the 256-color cap */
        pi = palette.length / 3;
        map.set(key, pi);
        palette.push(r, g, b);
      }
      index[n] = pi;
    }
    return { index, palette };
  }

  /* GIF LZW emitting only literal codes: decoder-compatible dictionary
     growth tracked, CLEAR issued before the 4096-entry limit. */
  function lzwLiteral(index, colorCount) {
    const CLEAR = 256, EOI = 257;
    const bytes = [];
    let cur = 0, curBits = 0;
    const emit = (code, size) => {
      cur |= code << curBits;
      curBits += size;
      while (curBits >= 8) { bytes.push(cur & 255); cur >>= 8; curBits -= 8; }
    };
    let codeSize = 9;
    let nextCode = 258;
    let firstAfterClear = true;
    emit(CLEAR, codeSize);
    for (let n = 0; n < index.length; n++) {
      emit(index[n], codeSize);
      if (firstAfterClear) firstAfterClear = false;
      else nextCode++;
      if (nextCode === (1 << codeSize) && codeSize < 12) codeSize++;
      if (nextCode === 4096) {
        emit(CLEAR, codeSize);
        codeSize = 9; nextCode = 258; firstAfterClear = true;
      }
    }
    emit(EOI, codeSize);
    if (curBits > 0) bytes.push(cur & 255);
    return bytes;
  }

  window.NIDGif = { encode };
})();