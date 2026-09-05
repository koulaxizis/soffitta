/* ============================================================
   NETIZEN ID — exporter.js
   PNG / JPG / GIF / WEBP / SVG / PDF / HTML export
   All local. No network. Ever.
   MIT License — Christos Koulaxizis
   ============================================================ */

(function () {
  "use strict";

  const PDF_MM_W = 85.6, PDF_MM_H = 54;        /* ISO ID-1 */
  const RASTER_W = 1712, RASTER_H = 1080;      /* ID-1 @ ~200 dpi */
  const GIF_W = 856, GIF_H = 540;              /* lighter: literal LZW is bulky */

  const T = (k) => (window.__nidT ? window.__nidT(k) : k);

  function notify(msg, type) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = type === "err" ? "err" : (type === "ok" ? "ok" : "");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add("hidden"), 3500);
  }

  function xmlEsc(s) {
    return String(s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /* ---------- canvas painter (unchanged logic) ---------- */
  function drawCardDirect(d, w, h) {
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    const S = d.schemeVars;
    const pad = Math.round(w * 0.045);

    ctx.fillStyle = S.bg; ctx.fillRect(0, 0, w, h);

    const bandH = Math.round(h * 0.032);
    let x = 0;
    const bands = [[S.accent, 0.16], ["#ffc24b", 0.09], ["#00b89c", 0.13]];
    bands.forEach(([c, frac]) => { ctx.fillStyle = c; ctx.fillRect(x, 0, Math.round(w * frac), bandH); x += Math.round(w * frac); });
    ctx.fillStyle = S.accent; ctx.fillRect(x, 0, w - x, bandH);

    const phW = Math.round(w * 0.28);
    const phH = phW;
    const phX = pad, phY = Math.round((h - phH) / 2);
    ctx.fillStyle = "#231d2b"; ctx.fillRect(phX - 3, phY - 3, phW + 6, phH + 6);
    ctx.fillStyle = "#fff";     ctx.fillRect(phX, phY, phW, phH);

    const tmp = document.createElement("canvas");
    tmp.width = 256; tmp.height = 256;
    window.NetizenAvatar.paint(tmp, d.avatar);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, phX, phY, phW, phH);

    const tx = phX + phW + Math.round(w * 0.03);
    let ty = pad + bandH + Math.round(h * 0.07);
    ctx.textBaseline = "top";
    ctx.fillStyle = S.ink;
    ctx.font = "bold " + Math.round(h * 0.052) + "px monospace";
    ctx.fillText("NETIZEN", tx, ty);
    const nw = ctx.measureText("NETIZEN").width;
    ctx.fillStyle = S.accent;
    ctx.fillText("ID", tx + nw + Math.round(h * 0.02), ty);
    ty += Math.round(h * 0.085);
    ctx.fillStyle = S.ink;
    ctx.font = "bold " + Math.round(h * 0.062) + "px monospace";
    ctx.fillText(d.username || "···", tx, ty);
    ty += Math.round(h * 0.10);

    const fields = d.rows;
    fields.slice(0, 7).forEach((f) => {
      ctx.fillStyle = S.sub;
      ctx.font = "bold " + Math.round(h * 0.030) + "px monospace";
      ctx.fillText(f.label.toUpperCase(), tx, ty);
      const lw = ctx.measureText(f.label.toUpperCase()).width;
      ctx.fillStyle = S.ink;
      ctx.font = Math.round(h * 0.038) + "px monospace";
      ctx.fillText(String(f.value).slice(0, 34), tx + lw + 8, ty);
      ty += Math.round(h * 0.062);
    });

    if (d.bio && ty < h - pad * 2) {
      ctx.fillStyle = S.ink;
      ctx.font = "italic " + Math.round(h * 0.034) + "px monospace";
      ctx.fillText("“" + String(d.bio).slice(0, 42) + "”", tx, ty);
      ty += Math.round(h * 0.055);
    }

    const tags = (d.tags || []).slice(0, 4);
    if (tags.length) {
      ctx.font = "bold " + Math.round(h * 0.026) + "px monospace";
      const chipH = Math.round(h * 0.055);
      const tagGap = Math.round(w * 0.008);
      const maxX = w - pad - Math.round(w * 0.075);
      let tagX = tx;
      for (const tag of tags) {
        const tw = ctx.measureText(tag).width + Math.round(h * 0.03);
        if (tagX + tw > maxX) break;
        ctx.fillStyle = S.accent;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(tagX, ty, tw, chipH, 99);
          ctx.fill();
        } else {
          ctx.fillRect(tagX, ty, tw, chipH);
        }
        ctx.fillStyle = S.bg;
        ctx.fillText(tag, tagX + Math.round(h * 0.015), ty + Math.round(h * 0.012));
        tagX += tw + tagGap;
      }
    }

    const rx = w - pad;
    ctx.textAlign = "right";
    ctx.fillStyle = S.sub;
    ctx.font = "bold " + Math.round(h * 0.026) + "px monospace";
    ctx.fillText(d.serial, rx, pad + bandH + 4);

    const bcH = Math.round(h * 0.22);
    let bx = rx - 12 * 5;
    for (let i = 0; i < 12; i++) {
      const on = ((d.seedNum >> i) & 1) === 1 || i % 5 === 0;
      ctx.fillStyle = on ? S.ink : "rgba(0,0,0,.18)";
      ctx.fillRect(bx + i * 5, h - pad - bcH - Math.round(h * 0.07), 3, bcH);
    }
    ctx.fillStyle = S.sub;
    ctx.font = Math.round(h * 0.024) + "px monospace";
    ctx.fillText(d.issueDate, rx, h - pad);
    ctx.textAlign = "left";

    return cv;
  }

  /* ---------- payload (unchanged) ---------- */
  function payload(data) {
    const map = { fullname: "card_lbl_name", alias: "card_lbl_aka", gender: "card_lbl_gender",
      birthday: "card_lbl_born", location: "card_lbl_loc", address: "card_lbl_addr",
      phones: "card_lbl_tel", emails: "card_lbl_mail", websites: "card_lbl_web",
      blogs: "card_lbl_blog", socials: "card_lbl_soc", ims: "card_lbl_im" };
    const rows = [];
    Object.keys(map).forEach((k) => {
      if (data[k]) rows.push({ label: T(map[k]),
        value: Array.isArray(data[k]) ? data[k].join(" · ") : data[k] });
    });
    const schemeVars = {
      terminal: { bg: "#211c2b", ink: "#f2ecf7", sub: "#a79db5", accent: "#ff5c5c" },
      paper:    { bg: "#faf6ef", ink: "#231d2b", sub: "#6f6679", accent: "#ff5d5d" },
      mint:     { bg: "#eafaf5", ink: "#0d3d33", sub: "#4e7d72", accent: "#00b89c" },
      rose:     { bg: "#fff0ef", ink: "#33161a", sub: "#8a5b5f", accent: "#ff5d5d" }
    }[data.scheme || "terminal"];
    return {
      username: data.username, avatar: data.avatar, rows, bio: data.bio,
      tags: data.tags, serial: data.serial, schemeVars,
      seedNum: window.__nidHash(data.username || "nid"),
      issueDate: (window.__nidT ? window.__nidT("card_issued") : "ISSUED") + " " +
        (window.__nidDate ? window.__nidDate() : new Date().toISOString().slice(0, 10))
    };
  }

  /* ---------- SVG export (vector, infinite resolution) ---------- */
  function drawCardSVG(p) {
    const w = 856, h = 540;
    const S = p.schemeVars;
    const pad = Math.round(w * 0.045);
    const bandH = Math.round(h * 0.032);
    const phW = Math.round(w * 0.28), phH = phW;
    const phX = pad, phY = Math.round((h - phH) / 2);
    const tx = phX + phW + Math.round(w * 0.03);
    const rx = w - pad;
    const parts = [];

    /* avatar as tiny lossless pixel PNG (16×16) */
    const tmp = document.createElement("canvas");
    tmp.width = 16; tmp.height = 16;
    window.NetizenAvatar.paint(tmp, p.avatar);
    const avHref = tmp.toDataURL("image/png");

    parts.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
      '" viewBox="0 0 ' + w + " " + h + '" font-family="monospace">');
    parts.push('<rect width="' + w + '" height="' + h + '" fill="' + S.bg + '"/>');

    let bandX = 0;
    [[S.accent, 0.16], ["#ffc24b", 0.09], ["#00b89c", 0.13]].forEach(([c, f]) => {
      const bw = Math.round(w * f);
      parts.push('<rect x="' + bandX + '" y="0" width="' + bw + '" height="' + bandH + '" fill="' + c + '"/>');
      bandX += bw;
    });
    parts.push('<rect x="' + bandX + '" y="0" width="' + (w - bandX) + '" height="' + bandH + '" fill="' + S.accent + '"/>');

    parts.push('<rect x="' + (phX - 3) + '" y="' + (phY - 3) + '" width="' + (phW + 6) + '" height="' + (phH + 6) + '" fill="#231d2b"/>');
    parts.push('<rect x="' + phX + '" y="' + phY + '" width="' + phW + '" height="' + phH + '" fill="#ffffff"/>');
    parts.push('<image x="' + phX + '" y="' + phY + '" width="' + phW + '" height="' + phH +
      '" href="' + avHref + '" preserveAspectRatio="none" image-rendering="pixelated"/>');

    /* text helper: SVG y = baseline ≈ canvas-top + 0.8·fontSize */
    const text = (x, top, fs, fill, weight, content, anchor) =>
      '<text x="' + x + '" y="' + (top + Math.round(fs * 0.8)) + '" font-size="' + fs + '"' +
      (weight ? ' font-weight="' + weight + '"' : "") +
      (anchor ? ' text-anchor="' + anchor + '"' : "") +
      ' fill="' + fill + '">' + content + "</text>";

    let ty = pad + bandH + Math.round(h * 0.07);
    parts.push(text(tx, ty, Math.round(h * 0.052), S.ink, "bold",
      "NETIZEN <tspan fill=\u0022" + S.accent + "\u0022>ID</tspan>"));
    ty += Math.round(h * 0.085);
    parts.push(text(tx, ty, Math.round(h * 0.062), S.ink, "bold", xmlEsc(d_short(p.username))));
    ty += Math.round(h * 0.10);

    p.rows.slice(0, 7).forEach((f) => {
      parts.push(text(tx, ty, Math.round(h * 0.030), S.sub, "bold", xmlEsc(f.label.toUpperCase())));
      const lw = Math.round(f.label.length * Math.round(h * 0.030) * 0.62);
      parts.push(text(tx + lw + 8, ty, Math.round(h * 0.038), S.ink, null,
        xmlEsc(String(f.value).slice(0, 34))));
      ty += Math.round(h * 0.062);
    });

    if (p.bio && ty < h - pad * 2) {
      parts.push('<text x="' + tx + '" y="' + (ty + Math.round(h * 0.027)) +
        '" font-size="' + Math.round(h * 0.034) + '" font-style="italic" fill="' + S.ink +
        '">' + xmlEsc(String(p.bio).slice(0, 42)) + "</text>");
      ty += Math.round(h * 0.055);
    }

    /* tags (approximate widths — monospace keeps them predictable) */
    const tagFs = Math.round(h * 0.026);
    let tagX = tx;
    const maxX = rx - Math.round(w * 0.075);
    (p.tags || []).slice(0, 4).forEach((tag) => {
      const tw = Math.round(tag.length * tagFs * 0.62) + Math.round(h * 0.03);
      if (tagX + tw > maxX) return;
      const chipH = Math.round(h * 0.055);
      parts.push('<rect x="' + tagX + '" y="' + ty + '" width="' + tw + '" height="' + chipH +
        '" rx="' + Math.round(chipH / 2) + '" fill="' + S.accent + '"/>');
      parts.push(text(tagX + Math.round(h * 0.015), ty + Math.round(h * 0.012), tagFs, S.bg,
        "bold", xmlEsc(tag)));
      tagX += tw + Math.round(w * 0.008);
    });

    /* rail */
    parts.push(text(rx, pad + bandH + 4, Math.round(h * 0.026), S.sub, "bold",
      xmlEsc(p.serial), "end"));
    const bcH = Math.round(h * 0.22);
    const bcTop = h - pad - bcH - Math.round(h * 0.07);
    const bx = rx - 12 * 5;
    for (let i = 0; i < 12; i++) {
      const on = ((p.seedNum >> i) & 1) === 1 || i % 5 === 0;
      parts.push('<rect x="' + (bx + i * 5) + '" y="' + bcTop + '" width="3" height="' + bcH +
        '" fill="' + (on ? S.ink : "rgba(0,0,0,.18)") + '"/>');
    }
    parts.push(text(rx, h - pad - Math.round(h * 0.019), Math.round(h * 0.024), S.sub, null,
      xmlEsc(p.issueDate), "end"));

    parts.push("</svg>");
    return parts.join("");
  }

  function d_short(u) { return u || "···"; }

  /* ---------- standalone HTML (was publisher.js) ---------- */
  function standalonePage(data, imageDataUrl) {
    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
      '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n' +
      "<title>Netizen ID — " + xmlEsc(data.username) + "</title>\n" +
      '<meta name="robots" content="index,follow">\n' +
      "<style>body{margin:0;background:#15121a;display:grid;place-items:center;" +
      "min-height:100vh;font-family:monospace;color:#f2ecf7}" +
      "img{max-width:92vw;box-shadow:0 6px 30px rgba(0,0,0,.5);border-radius:14px}" +
      "footer p{font-size:.75rem}" +
      "footer a{color:#0fbfa0;text-decoration:none}</style>\n</head>\n<body>\n" +
      '<img src="' + imageDataUrl + '" alt="Netizen ID card of ' + xmlEsc(data.username) + '">\n' +
      '<footer><p><a href="https://koulaxizis.github.io/netizen/">Make your own Netizen ID</a></p></footer>\n' +
      "</body>\n</html>";
  }

  /* ---------- format builders ---------- */
  function safeName(u, fallback) {
    return String(u || fallback || "card").replace(/[^a-z0-9_-]/gi, "_") || "card";
  }
  function baseName(data) { return "netizen-id_" + safeName(data.username); }

  function rasterExport(ext, mime, quality, warnOnFallback) {
    return function (data) {
      const p = payload(data);
      const cv = drawCardDirect(p, RASTER_W, RASTER_H);
      const name = baseName(data) + "." + ext;
      cv.toBlob((blob) => {
        if (blob && blob.type === mime) return downloadBlob(blob, name);
        /* browser silently refused the mime (e.g. WEBP on Firefox/Safari) */
        if (warnOnFallback) notify(T("err_webp"), "err");
        cv.toBlob((png) => downloadBlob(png, baseName(data) + ".png"), "image/png");
      }, mime, quality);
    };
  }

  /* ---------- public API ---------- */
  window.__nidExportPayload = payload;   /* bridge kept (unused externally, harmless) */
  window.__nidDrawCard = drawCardDirect; /* bridge kept */

  window.NetizenExport = {
    png:  rasterExport("png",  "image/png",  undefined, false),
    jpg:  rasterExport("jpg",  "image/jpeg", 0.95,      false),
    webp: rasterExport("webp", "image/webp", 0.95,      true),

    gif: function (data) {
      const p = payload(data);
      const cv = drawCardDirect(p, GIF_W, GIF_H);
      const bytes = window.NIDGif.encode(cv);
      if (!bytes) {
        notify(T("err_gif"), "err");
        cv.toBlob((png) => downloadBlob(png, baseName(data) + ".png"), "image/png");
        return;
      }
      downloadBlob(new Blob([bytes], { type: "image/gif" }), baseName(data) + ".gif");
    },

    svg: function (data) {
      const svg = drawCardSVG(payload(data));
      downloadBlob(new Blob([svg], { type: "image/svg+xml" }), baseName(data) + ".svg");
    },

    pdf: function (data) {
      const p = payload(data);
      const cv = drawCardDirect(p, RASTER_W, RASTER_H);
      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) {
        notify(T("err_pdf"), "err");
        cv.toBlob((png) => downloadBlob(png, baseName(data) + ".png"), "image/png");
        return;
      }
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [PDF_MM_W, PDF_MM_H] });
      pdf.addImage(cv.toDataURL("image/png"), "PNG", 0, 0, PDF_MM_W, PDF_MM_H);
      pdf.save(baseName(data) + ".pdf");
    },

        html: function (data) {
      const p = payload(data);
      const cv = drawCardDirect(p, RASTER_W, RASTER_H);
      const html = standalonePage(data, cv.toDataURL("image/png"));
      downloadBlob(new Blob([html], { type: "text/html" }), safeName(data.username, "netizen") + ".html");
    },

    /* ---------- avatar-only exports (profile picture use-case) ---------- */
    avatarPng: function (avatar, username, transparent) {
      const st = transparent ? Object.assign({}, avatar, { bg: null }) : avatar;
      const cv = document.createElement("canvas");
      cv.width = 1024; cv.height = 1024;   /* 16 × 64 — exact multiple, pixel-perfect */
      window.NetizenAvatar.paint(cv, st);
      const name = "netizen-avatar_" + safeName(username, "anon") + ".png";
      cv.toBlob((blob) => downloadBlob(blob, name), "image/png");
    },

    avatarSvg: function (avatar, username, transparent) {
      const st = transparent ? Object.assign({}, avatar, { bg: null }) : avatar;
      const buf = window.NetizenAvatar.composite(st);
      const parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" ' +
        'width="16" height="16" shape-rendering="crispEdges">'];
      for (let y = 0; y < window.NetizenAvatar.SIZE; y++) {
        let x = 0;
        while (x < window.NetizenAvatar.SIZE) {
          const c = buf[y][x];
          let run = 1;
          while (x + run < window.NetizenAvatar.SIZE && buf[y][x + run] === c) run++;
          if (c !== null) { /* transparent pixels produce no rect */
            parts.push('<rect x="' + x + '" y="' + y + '" width="' + run + '" height="1" fill="' + c + '"/>');
          }
          x += run;
        }
      }
      parts.push("</svg>");
      const name = "netizen-avatar_" + safeName(username, "anon") + ".svg";
      downloadBlob(new Blob([parts.join("")], { type: "image/svg+xml" }), name);
    },

    avatarCopy: function (avatar, transparent) {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        notify(T("err_clip"), "err");
        return;
      }
      const st = transparent ? Object.assign({}, avatar, { bg: null }) : avatar;
      const cv = document.createElement("canvas");
      cv.width = 512; cv.height = 512;
      window.NetizenAvatar.paint(cv, st);
      cv.toBlob((blob) => {
        navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
          .then(() => notify(T("ok_clip"), "ok"))
          .catch(() => notify(T("err_clip"), "err"));
      }, "image/png");
    }
  };
})();