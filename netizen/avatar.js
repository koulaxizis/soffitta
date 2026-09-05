/* ============================================================
   NETIZEN ID — avatar.js
   Pixel Art Avatar Engine — 16×16, layered, zero dependencies
   Designed by Christos Koulaxizis — MIT License
   ============================================================ */

(function () {
  "use strict";

  const SIZE = 16;

  /* ---------- helpers ---------- */
  const pad = (rows) => {
    const g = rows.slice();
    while (g.length < SIZE) g.push("");
    return g;
  };

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
    const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
    const b = Math.min(255, Math.round((n & 255) * f));
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  /* ---------- palettes ---------- */
  const SKINS = [
    { id: "porcelain", c: "#ffe0c7" },
    { id: "sand",      c: "#f2c49b" },
    { id: "tan",       c: "#d99a6c" },
    { id: "brown",     c: "#a9673f" },
    { id: "deep",      c: "#6f4429" },
    { id: "leaf",      c: "#8ac926" },
    { id: "forest",    c: "#588157" },
    { id: "steel",     c: "#b8b8cc" },
    { id: "graphite",  c: "#8d99ae" },
    { id: "rustbot",   c: "#c1666b" }
  ];

  const HAIRS = [
    { id: "black",    c: "#231d2b" },
    { id: "brown",    c: "#6b4226" },
    { id: "chestnut", c: "#9b5a3c" },
    { id: "blonde",   c: "#e3b23c" },
    { id: "red",      c: "#c0392b" },
    { id: "auburn",   c: "#8b2500" },
    { id: "silver",   c: "#95a5a6" },
    { id: "white",    c: "#f2ecf7" },
    { id: "coral",    c: "#ff5d5d" },
    { id: "pink",     c: "#ff85a1" },
    { id: "teal",     c: "#00b89c" },
    { id: "blue",     c: "#70a1ff" },
    { id: "green",    c: "#6ab04c" },
    { id: "purple",   c: "#8e6fd8" }
  ];

  const SHIRTS = [
    { id: "coral",  c: "#ff5d5d" },
    { id: "teal",   c: "#00b89c" },
    { id: "gold",   c: "#ffc24b" },
    { id: "ink",    c: "#231d2b" },
    { id: "paper",  c: "#f2ecf7" },
    { id: "navy",   c: "#274690" },
    { id: "olive",  c: "#606c38" },
    { id: "wine",   c: "#9d0208" }
  ];

  const BGS = ["#ffe8d6", "#ffd6d6", "#d6f5ea", "#fff3c4", "#e6defc",
               "#2a2337", "#231d2b", "#12303a", "#3d2b1f"];

  /* ---------- face styles (base layer) ----------
     S skin | s skin-shade | T shirt | t shirt-shade
     H hair (for leaves/ears styling) | K fixed dark      */
  const FACES = {
    human: pad([
      "................",
      ".....SSSSSS.....",
      "....SSSSSSSS....",
      "...SSSSSSSSSS...",
      "...SSSSSSSSSS...",
      "...SSSSSSSSSS...",
      "...SSSSSSSSSS...",
      "...SSSSSSSSSS...",
      "....SSSSSSSS....",
      ".....SSSSSS.....",
      "......SSSS......",
      "......SSSS......",
      "......ssss......",
      "...TTTTTTTTTT...",
      "..TTTTTTTTTTTT..",
      "..tTTTTTTTTTTt.."
    ]),
    robot: pad([
      ".......K........",
      ".......K........",
      "....SSSSSSSS....",
      "...SSSSSSSSSS...",
      "..SSSSSSSSSSSS..",
      "..SSSSSSSSSSSS..",
      "..SSSSSSSSSSSS..",
      "..SSSSSSSSSSSS..",
      "..SSSSSSSSSSSS..",
      "...SSSSSSSSSS...",
      "....SSSSSSSS....",
      "......SSSS......",
      "......ssss......",
      "...TTTTTTTTTT...",
      "..TTTTTTTTTTTT..",
      "..tTTTTTTTTTTt.."
    ]),
    plant: pad([
      "......HHH.......",
      ".....HHHHH......",
      "......KK........",
      "....SSSSSSSS....",
      "...SSSSSSSSSS...",
      "...SSSSSSSSSS...",
      "...SSSSSSSSSS...",
      "...SSSSSSSSSS...",
      "...SSSSSSSSSS...",
      "....SSSSSSSS....",
      "......SSSS......",
      "......SSSS......",
      "......ssss......",
      "...TTTTTTTTTT...",
      "..TTTTTTTTTTTT..",
      "..tTTTTTTTTTTt.."
    ]),
    cat: pad([
      "..S..........S..",
      "..SS........SS..",
      "..SSSSSSSSSSSS..",
      "...SSSSSSSSSS...",
      "...SSSSSSSSSS...",
      "...SSSSSSSSSS...",
      "...SSSSSSSSSS...",
      "...SSSSSSSSSS...",
      "...SSSSSSSSSS...",
      "....SSSSSSSS....",
      "......SSSS......",
      "......SSSS......",
      "......ssss......",
      "...TTTTTTTTTT...",
      "..TTTTTTTTTTTT..",
      "..tTTTTTTTTTTt.."
    ])
  };

  /* ---------- hair ---------- */
  const HAIRSTYLES = {
    none: [],
    short: pad([
      "................",
      "................",
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "...HHhHHHHhHH...",
      "...HHHHHHHHHH..."
    ]),
    buzz: pad([
      "................",
      "................",
      "................",
      "....HHHHHHHH....",
      "...HHHHHHHHHH..."
    ]),
    long: pad([
      "................",
      ".....HHHHHH.....",
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "...HHHHHHHHHH...",
      "...HHH....HHH...",
      "...HHH....HHH...",
      "...HHHH..HHHH...",
      "....HHH..HHH...."
    ]),
    mohawk: pad([
      ".......HH.......",
      ".......HH.......",
      ".......HH.......",
      "......HHHH......",
      "......HHHH......"
    ]),
    afro: pad([
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "..HHHHHHHHHHHH..",
      "..HHHHHHHHHHHH..",
      "...HHHHHHHHHH..."
    ]),
    bun: pad([
      "......HHHH......",
      ".....HHHHHH.....",
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "...HHHHHHHHHH..."
    ]),
    sidepart: pad([
      "................",
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "...HHHHHhHHHH...",
      "...HhHHHHHHHH..."
    ])
  };

  /* ---------- eyes ----------
     e pupil | W eye-white | x ink | - ink   */
  const EYES = {
    neutral: pad(["", "", "", "", ".....e...e......"]),
    wide: pad([
      "",
      "",
      "",
      ".....WW...WW....",
      ".....We..eW.....",
      ".....WW...WW...."
    ]),
    happy: pad(["", "", "", "....x.....x.....", ".....x...x......"]),
    sleepy: pad(["", "", "", "", ".....-...-......"]),
    wink: pad(["", "", "", "", ".....e...x......"]),
    cyclops: pad(["", "", "", "", "......e.e.e....."])
  };

  /* ---------- mouths ---------- */
  const MOUTHS = {
    none: [],
    smile: pad(["", "", "", "", "", "", ".....M..M.......", "......MM........"]),
    neutral: pad(["", "", "", "", "", "", "......MM........"]),
    grin: pad(["", "", "", "", "", "", ".....MMMM......."]),
    open: pad(["", "", "", "", "", "", "......MMM.......", "......MMM......."]),
    smirk: pad(["", "", "", "", "", "", ".....MMM........"])
  };

  /* ---------- beards (drawn under mouth) ---------- */
  const BEARDS = {
    none: [],
    full: pad([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "....BBBBBBBB....",
      "....BBBBBBBB....",
      "....BBBBBBBB...."
    ]),
    goatee: pad(["", "", "", "", "", "", "", "", "", "", "......BB........", "......BB........"]),
    mustache: pad(["", "", "", "", "", "", ".....BBBB......."]),
    chinstrap: pad(["", "", "", "", "", "", "", "", "....B......B....", "....B......B....", "....B......B....", "....B......B...."])
  };

  /* ---------- accessories (topmost) — A = gold ---------- */
  const ACCESSORIES = {
    none: [],
    glasses: pad(["", "", "", "....AAAA..AAAA..", "....AAAA..AAAA..", "......AA........"]),
    sunglasses: pad(["", "", "", "....AAAA..AAAA..", "....AAAAAAAAAA..", "......AA........"]),
    eyepatch: pad(["", "", "", "....AAAA........", "....AAAA........", "....AAAA........", ".....AA........."]),
    earrings: pad(["", "", "", "", "", "...A........A..."]),
    headphones: pad(["", "....AAAAAA......", "...A........A...", "...A........A..."]),
    cap: pad(["....AAAAAAAA....", "...AAAAAAAAAA...", "..AAAAAAAAAAAA.."])
  };

  /* ---------- layer registry ---------- */
  const LAYERS = {
    face:       { options: Object.keys(FACES),         grid: (s) => FACES[s.face] },
    beard:      { options: Object.keys(BEARDS),        grid: (s) => BEARDS[s.beard] },
    hair:       { options: Object.keys(HAIRSTYLES),    grid: (s) => HAIRSTYLES[s.hair] },
    eyes:       { options: Object.keys(EYES),          grid: (s) => EYES[s.eyes] },
    mouth:      { options: Object.keys(MOUTHS),        grid: (s) => MOUTHS[s.mouth] },
    accessory:  { options: Object.keys(ACCESSORIES),  grid: (s) => ACCESSORIES[s.accessory] }
  };

  /* ---------- state ---------- */
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function randomState() {
    return {
      face: rand(LAYERS.face.options),
      hair: rand(LAYERS.hair.options.filter((o) => o !== "none")),
      beard: rand(LAYERS.beard.options),
      eyes: rand(LAYERS.eyes.options),
      mouth: rand(LAYERS.mouth.options),
      accessory: rand(LAYERS.accessory.options),
      skin: rand(SKINS).c,
      hairColor: rand(HAIRS).c,
      shirt: rand(SHIRTS).c,
      bg: rand(BGS)
    };
  }

  const DEFAULT_STATE = {
    face: "human", hair: "short", beard: "none",
    eyes: "neutral", mouth: "smile", accessory: "none",
    skin: "#f2c49b", hairColor: "#231d2b",
    shirt: "#ff5d5d", bg: "#2a2337"
  };

  /* ---------- render ----------
     Composites layers into a color buffer, then paints canvas.
     Chars: S skin, s skin shade, H hair, h hair shade, T shirt,
            t shirt shade, e/x/- ink, W white, M ink, B hair, A gold, K dark */
  function charColor(ch, st) {
    switch (ch) {
      case "S": return st.skin;
      case "s": return shade(st.skin, 0.72);
      case "H": return st.hairColor;
      case "h": return shade(st.hairColor, 0.7);
      case "T": return st.shirt;
      case "t": return shade(st.shirt, 0.75);
      case "B": return st.hairColor;
      case "A": return "#c9a227";
      case "K": return "#231d2b";
      case "e": case "x": case "-": case "M": return "#231d2b";
      case "W": return "#ffffff";
      default:  return null;
    }
  }

  function composite(st) {
    const bg = st.bg === null ? null : st.bg;
    const buf = [];
    for (let y = 0; y < SIZE; y++) {
      buf.push(new Array(SIZE).fill(bg));
    }
    const order = ["face", "beard", "hair", "eyes", "mouth", "accessory"];
    for (const key of order) {
      const grid = LAYERS[key].grid(st);
      for (let y = 0; y < SIZE && y < grid.length; y++) {
        const row = grid[y];
        for (let x = 0; x < Math.min(row.length, SIZE); x++) {
          const c = charColor(row[x], st);
          if (c) buf[y][x] = c;
        }
      }
    }
    return buf;
  }

  function paint(canvas, st) {
    const ctx = canvas.getContext("2d");
    const px = Math.max(1, Math.floor(canvas.width / SIZE));
    const buf = composite(st);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const c = buf[y][x];
        if (c === null) continue; /* transparent pixel — leave canvas clear */
        ctx.fillStyle = c;
        ctx.fillRect(x * px, y * px, px, px);
      }
    }
  }

  /* ---------- UI builder ---------- */
  function el(tag, cls, attrs) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }

  function swatchRow(colors, current, onPick) {
    const row = el("div", "swatch-row");
    colors.forEach((c) => {
      const b = el("button", "swatch", { type: "button", title: c });
      b.style.background = c;
      if (c.toLowerCase() === String(current).toLowerCase()) b.classList.add("active");
      b.addEventListener("click", () => {
        row.querySelectorAll(".swatch").forEach((s) => s.classList.remove("active"));
        b.classList.add("active");
        onPick(c);
      });
      row.appendChild(b);
    });
    return row;
  }

  function label(text, key) {
    const l = el("label", null, { "data-i18n": key });
    l.textContent = text;
    return l;
  }

  function selectRow(labelTxt, i18nKey, options, current, onPick) {
    const wrap = el("div", "av-field");
    wrap.appendChild(label(labelTxt, i18nKey));
    const sel = el("select");
    options.forEach((o) => {
      const opt = el("option", null, { value: o });
      opt.textContent = o.charAt(0).toUpperCase() + o.slice(1);
      if (o === current) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", () => onPick(sel.value));
    wrap.appendChild(sel);
    return wrap;
  }

  /**
   * Builds the avatar editor UI inside `container`.
   * onChange(state) fires on every mutation (state is mutated in place).
   */
  function initUI(container, state, onChange) {
    container.innerHTML = "";
    container.classList.add("avatar-editor");

    const notify = () => onChange(state);

    /* dice */
    const dice = el("button", "btn secondary dice-btn", { type: "button", id: "randomizeAvatar", "data-i18n": "av_random" });
    dice.textContent = "🎲 Random avatar";
    dice.addEventListener("click", () => {
      Object.assign(state, randomState());
      initUI(container, state, onChange); // rebuild with new selection highlights
      onChange(state);
    });
    container.appendChild(dice);

    const groups = el("div", "av-groups");

    /* face style + skin */
    const gFace = el("div", "av-group");
    gFace.appendChild(selectRow("Face", "av_face", LAYERS.face.options, state.face, (v) => { state.face = v; notify(); }));
    gFace.appendChild(label("Skin tone", "av_skin"));
    gFace.appendChild(swatchRow(SKINS.map((s) => s.c), state.skin, (c) => { state.skin = c; notify(); }));
    groups.appendChild(gFace);

    /* hair + color */
    const gHair = el("div", "av-group");
    gHair.appendChild(selectRow("Hair", "av_hair", LAYERS.hair.options, state.hair, (v) => { state.hair = v; notify(); }));
    gHair.appendChild(label("Hair color", "av_hair_color"));
    gHair.appendChild(swatchRow(HAIRS.map((h) => h.c), state.hairColor, (c) => { state.hairColor = c; notify(); }));
    groups.appendChild(gHair);

    /* features */
    const gFeat = el("div", "av-group");
    gFeat.appendChild(selectRow("Eyes", "av_eyes", LAYERS.eyes.options, state.eyes, (v) => { state.eyes = v; notify(); }));
    gFeat.appendChild(selectRow("Mouth", "av_mouth", LAYERS.mouth.options, state.mouth, (v) => { state.mouth = v; notify(); }));
    gFeat.appendChild(selectRow("Beard", "av_beard", LAYERS.beard.options, state.beard, (v) => { state.beard = v; notify(); }));
    groups.appendChild(gFeat);

    /* accessory + shirt + bg */
    const gAcc = el("div", "av-group");
    gAcc.appendChild(selectRow("Accessory", "av_accessory", LAYERS.accessory.options, state.accessory, (v) => { state.accessory = v; notify(); }));
    gAcc.appendChild(label("Shirt", "av_shirt"));
    gAcc.appendChild(swatchRow(SHIRTS.map((s) => s.c), state.shirt, (c) => { state.shirt = c; notify(); }));
    gAcc.appendChild(label("Background", "av_bg"));
    const bgWrap = swatchRow(BGS, state.bg, (c) => { state.bg = c; notify(); });
    bgWrap.classList.add("swatch-bg");
    gAcc.appendChild(bgWrap);
    groups.appendChild(gAcc);

    container.appendChild(groups);
  }

  /* ---------- public API ---------- */
  window.NetizenAvatar = {
    SIZE,
    DEFAULT_STATE,
    randomState,
    paint,
    composite,
    initUI
  };
})();