/* ============================================================
   NETIZEN ID — app.js
   Core: i18n, form, live preview, theme, tags, PWA wiring
   Designed by Christos Koulaxizis — MIT License
   ============================================================ */

(function () {
  "use strict";

  /* ---------- utilities ---------- */
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function store(key, val) {
    try {
      if (arguments.length === 2) localStorage.setItem("netizen:" + key, JSON.stringify(val));
      else { const v = localStorage.getItem("netizen:" + key); return v ? JSON.parse(v) : null; }
    } catch (e) { return null; }
  }

  function toast(msg, type) {
    const t = $("#toast");
    t.textContent = msg;
    t.className = type === "err" ? "err" : (type === "ok" ? "ok" : "");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.add("hidden"), 3500);
  }

  /* ID hash → serial + deterministic barcode */
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h;
  }
  function serialFrom(username) {
    const h = hash(username.toLowerCase().trim());
    return "NID-" + h.toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
  }

  /* Bridge 1: exposed for exporter.js */
  window.__nidHash = hash;
  
    /* ---------- localized date ---------- */
  function localizedDate() {
    return new Date().toLocaleDateString(
      state.lang === "el" ? "el-GR" : "en-GB",
      { day: "2-digit", month: "short", year: "numeric" }
    );
  }

  /* ---------- shareable avatar state (URL hash, no server, no PII) ---------- */
  function avatarToHash(st) {
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(st))))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return b64;
  }
  function avatarFromHash(h) {
    try {
      const b64 = h.replace(/-/g, "+").replace(/_/g, "/");
      const obj = JSON.parse(decodeURIComponent(escape(atob(b64))));
      if (obj && typeof obj === "object" && "face" in obj) return obj;
    } catch (e) { /* malformed hash — ignore */ }
    return null;
  }

  /* ---------- i18n ---------- */
  const I18N = {
    en: {
      app_tagline: "Live preview",
      identity_details: "🪪 Identity card details",
      sec_identity: "Identity", sec_contact: "Contact",
      sec_sites: "Sites & Socials", sec_bio: "Bio / Motto",
      sec_avatar: "🎨 Pixel Art Avatar",
      username: "Username *", fullname: "Full name", alias: "Nickname / handle",
      gender: "Gender (Male, Female, Plant…)", birthday: "Birthday",
      location: "City / country", address: "Address (optional)",
      phones: "Phones (one per line)", emails: "Emails (one per line)",
      websites: "Websites", blogs: "Blogs", socials: "Social networks (@user…)",
      ims: "Instant messengers", bio: "Say something memorable…",
      tags_title: "Tags & characteristics",
      tag_add_ph: "Add your own tag…", tag_add_btn: "Add",
      av_random: "🎲 Random avatar", av_face: "Face", av_skin: "Skin tone",
      av_hair: "Hair", av_hair_color: "Hair color", av_eyes: "Eyes",
      av_mouth: "Mouth", av_beard: "Beard", av_accessory: "Accessory",
      av_shirt: "Shirt", av_bg: "Background",
      card_netizen: "NETIZEN", card_id: "IDENTITY CARD",
      card_issued: "ISSUED", card_username: "USERNAME",
	  note_privacy: "No data leaves your browser. The exported card contains only what you filled in.",
      note_optional: "Everything is optional except the username. Blank fields stay hidden on the card.",
      err_username: "Please enter a username first.",
      ok_lang: "Language switched to English",
      ok_theme_dark: "Terminal dark mode", ok_theme_light: "Paper light mode",
      err_webp: "This browser doesn't export WEBP — saved as PNG instead.",
      err_gif: "Couldn't encode GIF — saved as PNG instead.",
      err_pdf: "PDF library missing — saved as PNG instead.",
      card_lbl_name: "Name", card_lbl_aka: "A.K.A.", card_lbl_gender: "Gender",
      card_lbl_born: "Born", card_lbl_loc: "Location", card_lbl_addr: "Address",
      card_lbl_tel: "Tel", card_lbl_mail: "Mail", card_lbl_web: "Web",
      card_lbl_blog: "Blog", card_lbl_soc: "Social", card_lbl_im: "IM",
      av_dl: "Download avatar:", scheme_label: "Card style",
      av_tools: "Avatar tools:", av_transparent: "Transparent background",
      av_copy: "Copy image", av_share: "🔗 Share link",
      ok_clip: "Avatar copied to clipboard",
      err_clip: "Image clipboard not supported here — use PNG download",
      ok_share: "Shareable avatar link copied"
    },
    el: {
      app_tagline: "Ζωντανή προεπισκόπηση",
      identity_details: "🪪 Στοιχεία ταυτότητας",
      sec_identity: "Ταυτότητα", sec_contact: "Επικοινωνία",
      sec_sites: "Ιστοσελίδες & Δίκτυα", sec_bio: "Βιογραφικό / Μότο",
      sec_avatar: "🎨 Pixel Art Άβαταρ",
      username: "Username *", fullname: "Ονοματεπώνυμο", alias: "Ψευδώνυμο",
      gender: "Φύλο (Άνδρας, Γυναίκα, Φυτό…)", birthday: "Γενέθλια",
      location: "Πόλη / χώρα", address: "Διεύθυνση (προαιρετικό)",
      phones: "Τηλέφωνα (ένα ανά γραμμή)", emails: "Emails (ένα ανά γραμμή)",
      websites: "Ιστοσελίδες", blogs: "Blogs", socials: "Κοινωνικά δίκτυα (@user…)",
      ims: "Μηνύματα (IMs)", bio: "Πες κάτι αξέχαστο…",
      tags_title: "Ετικέτες & χαρακτηριστικά",
      tag_add_ph: "Πρόσθεσε δική σου ετικέτα…", tag_add_btn: "Προσθήκη",
      av_random: "🎲 Τυχαίο άβαταρ", av_face: "Πρόσωπο", av_skin: "Χρώμα δέρματος",
      av_hair: "Μαλλιά", av_hair_color: "Χρώμα μαλλιών", av_eyes: "Μάτια",
      av_mouth: "Στόμα", av_beard: "Γένια", av_accessory: "Αξεσουάρ",
      av_shirt: "Κοστούμι", av_bg: "Φόντο",
      card_netizen: "NETIZEN", card_id: "ΤΑΥΤΟΤΗΤΑ",
      card_issued: "ΕΚΔΟΘΗΚΕ", card_username: "ΧΡΗΣΤΗΣ",
      note_privacy: "Κανένα δεδομένο δεν φεύγει από τον browser σου. Η κάρτα περιέχει μόνο ό,τι συμπλήρωσες.",
      note_optional: "Όλα είναι προαιρετικά εκτός από το username. Τα κενά πεδία μένουν κρυφά.",
      err_username: "Δώσε πρώτα ένα username.",
      ok_lang: "Η γλώσσα άλλαξε σε Ελληνικά",
      ok_theme_dark: "Σκοτεινή λειτουργία terminal", ok_theme_light: "Φωτεινή λειτουργία paper",
      err_webp: "Αυτός ο browser δεν εξάγει WEBP — αποθηκεύτηκε ως PNG.",
      err_gif: "Δεν βγήκε το GIF — αποθηκεύτηκε ως PNG.",
      err_pdf: "Το jsPDF δεν φορτώθηκε — αποθηκεύτηκε ως PNG.",
      card_lbl_name: "Όνομα", card_lbl_aka: "Ψευδώνυμο", card_lbl_gender: "Φύλο",
      card_lbl_born: "Γέννηση", card_lbl_loc: "Τόπος", card_lbl_addr: "Διεύθυνση",
      card_lbl_tel: "Τηλ", card_lbl_mail: "Email", card_lbl_web: "Ιστός",
      card_lbl_blog: "Blog", card_lbl_soc: "Δίκτυα", card_lbl_im: "IM",
      av_dl: "Λήψη άβαταρ:", scheme_label: "Στυλ κάρτας",
      av_tools: "Εργαλεία άβαταρ:", av_transparent: "Διαφανές φόντο",
      av_copy: "Αντιγραφή εικόνας", av_share: "🔗 Διαμοιρασμός",
      ok_clip: "Το άβαταρ αντιγράφηκε στο πρόχειρο",
      err_clip: "Το πρόχειρο εικόνας δεν υποστηρίζεται εδώ — κατέβασε PNG",
      ok_share: "Ο σύνδεσμος άβαταρ αντιγράφηκε"
    }
  };
  
    const TAGS_PRESET = [
    "Netizen", "Open-Sourcerer", "Creative Commoner", "A.I. Tamer",
    "Privacy Advocate", "Digital Nomad", "Cypherpunk", "Free Culture",
    "Mapper", "Bookworm", "Blogger", "Podcaster", "Dev", "Designer",
    "Night Owl", "Coffee-Powered", "Plants Are People Too", "Robot-Friendly"
  ];

  /* ---------- state ---------- */
  const state = {
    lang: store("lang") || ((navigator.language || "en").startsWith("el") ? "el" : "en"),
    theme: store("theme") ||
      (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"),
    avatar: Object.assign({}, window.NetizenAvatar.DEFAULT_STATE),
    cardScheme: "terminal",
    selectedTags: store("tags") || [],
    customTags: store("customTags") || []
  };

  const t = (k) => (I18N[state.lang] && I18N[state.lang][k]) || I18N.en[k] || k;

  /* Bridge: exporter.js reads translations through this */
  window.__nidT = t;
  
    /* Bridge: exporter.js reads the localized issue date through this */
  window.__nidDate = localizedDate;

  /* ---------- theme ---------- */
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    const btn = $("#theme-toggle");
    btn.textContent = state.theme === "dark" ? "☀️" : "🌙";
    btn.title = t(state.theme === "dark" ? "ok_theme_light" : "ok_theme_dark");
    store("theme", state.theme);
  }

  /* ---------- i18n application ---------- */
  function applyLang() {
    document.documentElement.lang = state.lang === "el" ? "el" : "en";
    $$("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      const v = I18N[state.lang][k];
      if (v) el.textContent = v;
    });
    $$("[data-i18n-ph]").forEach((el) => {
      const v = I18N[state.lang][el.getAttribute("data-i18n-ph")];
      if (v) el.placeholder = v;
    });
    store("lang", state.lang);
  }

  /* ---------- form → data ---------- */
  const FIELD_ORDER = [
    "fullname", "alias", "gender", "birthday", "location", "address",
    "phones", "emails", "websites", "blogs", "socials", "ims", "bio"
  ];
  const MULTILINE = ["phones", "emails", "websites", "blogs", "socials", "ims"];

  function collect() {
    const data = { username: $("#username").value.trim() };
    FIELD_ORDER.forEach((f) => {
      const el = document.querySelector('[name="' + f + '"]');
      if (!el) return;
      let v = el.value.trim();
      if (!v) return;
      if (MULTILINE.indexOf(f) >= 0) {
        v = v.split("\n").map((l) => l.trim()).filter(Boolean);
        if (!v.length) return;
      }
      data[f] = v;
    });
    if (state.selectedTags.length) data.tags = state.selectedTags.slice();
    data.avatar = state.avatar;
    data.serial = serialFrom(data.username || "anonymous");
    data.scheme = state.cardScheme;
    return data;
  }

  /* ---------- card rendering ---------- */
  /* Short labels for the card itself (form placeholders stay verbose) */
  const CARD_LABEL_KEYS = {
    fullname: "card_lbl_name", alias: "card_lbl_aka", gender: "card_lbl_gender",
    birthday: "card_lbl_born", location: "card_lbl_loc", address: "card_lbl_addr",
    phones: "card_lbl_tel", emails: "card_lbl_mail", websites: "card_lbl_web",
    blogs: "card_lbl_blog", socials: "card_lbl_soc", ims: "card_lbl_im"
  };

  function fmtValue(field, v) {
    if (MULTILINE.indexOf(field) >= 0) return v.join(" · ");
    return v;
  }

  function buildCard(data) {
    const card = document.createElement("div");
    card.className = "id-card scheme-" + (data.scheme || "terminal");

    /* photo */
    const photo = document.createElement("div");
    photo.className = "card-photo";
    const cv = document.createElement("canvas");
    cv.width = 160; cv.height = 160;
    photo.appendChild(cv);
    window.NetizenAvatar.paint(cv, data.avatar || window.NetizenAvatar.DEFAULT_STATE);

    /* body */
    const body = document.createElement("div");
    body.className = "card-body";
    const h = document.createElement("p");
    h.className = "card-headline";
    h.innerHTML = t("card_netizen") + ' <span class="cc">' + t("card_id") + "</span>";
    body.appendChild(h);

    const un = document.createElement("p");
    un.className = "card-username";
    un.textContent = data.username || "· · ·";
    body.appendChild(un);

    const dl = document.createElement("dl");
    FIELD_ORDER.forEach((f) => {
      if (f === "bio" || !(f in data)) return;
      const row = document.createElement("div");
      row.className = "card-row";
      const dt = document.createElement("dt"); dt.textContent = t(CARD_LABEL_KEYS[f]);
      const dd = document.createElement("dd"); dd.textContent = fmtValue(f, data[f]);
      row.appendChild(dt); row.appendChild(dd);
      dl.appendChild(row);
    });
    if (dl.children.length) body.appendChild(dl);

    if (data.bio) {
      const bio = document.createElement("p");
      bio.className = "card-bio";
      bio.textContent = "“" + data.bio + "”";
      body.appendChild(bio);
    }

    if (data.tags && data.tags.length) {
      const tw = document.createElement("div");
      tw.className = "card-tags";
      data.tags.forEach((tag) => {
        const chip = document.createElement("span");
        chip.className = "card-tag";
        chip.textContent = tag;
        tw.appendChild(chip);
      });
      body.appendChild(tw);
    }

    /* right rail */
    const rail = document.createElement("div");
    rail.className = "card-rail";
    const serial = document.createElement("span");
    serial.className = "card-serial";
    serial.textContent = data.serial;
    rail.appendChild(serial);

    const bar = document.createElement("div");
    bar.className = "card-barcode";
    const seed = hash(data.username || "nid");
    for (let i = 0; i < 12; i++) {
      const s = document.createElement("span");
      const on = ((seed >> i) & 1) === 1 || i % 5 === 0;
      s.className = on ? "on" : "off";
      bar.appendChild(s);
    }
    rail.appendChild(bar);

    const issue = document.createElement("span");
    issue.className = "card-issue";
    issue.textContent = t("card_issued") + " " + localizedDate();
    rail.appendChild(issue);

    card.appendChild(photo);
    card.appendChild(body);
    card.appendChild(rail);
    return card;
  }

  function render() {
    const holder = $("#cardHolder");
    holder.innerHTML = "";
    const data = collect();
    store("draft", data);
    holder.appendChild(buildCard(data));

    /* Bridge 2: current card data for exporters */
    window.__nidRenderData = data;
  }

  /* ---------- tags UI ---------- */
  function renderTags() {
    const wrap = $("#characteristics .tags-list");
    wrap.innerHTML = "";
    const all = TAGS_PRESET.concat(state.customTags);
    all.forEach((tag) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tag-chip" + (state.selectedTags.indexOf(tag) >= 0 ? " active" : "");
      chip.textContent = tag;
      chip.addEventListener("click", () => {
        const i = state.selectedTags.indexOf(tag);
        if (i >= 0) state.selectedTags.splice(i, 1);
        else state.selectedTags.push(tag);
        store("tags", state.selectedTags);
        renderTags();
        render();
      });
      wrap.appendChild(chip);
    });
  }

  function wireTagAdd() {
    const input = $("#customTagInput");
    const btn = $("#addTagBtn");
    const add = () => {
      const v = input.value.trim();
      if (!v) return;
      if (TAGS_PRESET.concat(state.customTags).indexOf(v) < 0) {
        state.customTags.push(v);
        store("customTags", state.customTags);
      }
      if (state.selectedTags.indexOf(v) < 0) state.selectedTags.push(v);
      store("tags", state.selectedTags);
      input.value = "";
      renderTags();
      render();
    };
    btn.addEventListener("click", add);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); add(); } });
  }

  /* ---------- draft restore ---------- */
  function restoreDraft(skipAvatar) {
    const d = store("draft");
    if (!d) return;
    Object.keys(d).forEach((k) => {
      const el = document.querySelector('[name="' + k + '"]');
      if (!el) return;
      if (Array.isArray(d[k])) el.value = d[k].join("\n");
      else if (typeof d[k] === "string" && k !== "username") el.value = d[k];
      else if (k === "username") el.value = d[k];
    });
    if (d.avatar && !skipAvatar) Object.assign(state.avatar, d.avatar);
    if (d.scheme) state.cardScheme = d.scheme;
  }

  /* ---------- bindings ---------- */
  function bind() {
    /* theme */
    $("#theme-toggle").addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      applyTheme();
    });

    /* language */
    const langSel = $("#lang-select");
    langSel.value = state.lang;
    langSel.addEventListener("change", () => {
      state.lang = langSel.value;
      applyLang();
      applyTheme(); /* refresh theme-toggle title in the new language */
      renderTags();
      render();
      toast(t("ok_lang"), "ok");
    });

    /* form → live preview */
    $("#identityForm").addEventListener("input", render);
    $("#identityForm").addEventListener("change", render);

    /* dice */
    $("#diceBtn").addEventListener("click", () => {
      Object.assign(state.avatar, window.NetizenAvatar.randomState());
      render();
    });
	
	    /* card scheme */
    const schemeSel = $("#cardScheme");
    schemeSel.value = state.cardScheme;
    schemeSel.addEventListener("change", () => {
      state.cardScheme = schemeSel.value;
      render();
    });

    /* avatar-only downloads */
    const uname = () => $("#username").value.trim();
    const transparent = () => $("#avatarTransparent").checked;
    $("#downloadAvatarPng").addEventListener("click", () =>
      window.NetizenExport.avatarPng(state.avatar, uname(), transparent()));
    $("#downloadAvatarSvg").addEventListener("click", () =>
      window.NetizenExport.avatarSvg(state.avatar, uname(), transparent()));

    /* avatar clipboard copy */
    $("#copyAvatarClip").addEventListener("click", () =>
      window.NetizenExport.avatarCopy(state.avatar, transparent()));

    /* shareable avatar link (self-contained URL hash — everything stays local) */
    $("#shareAvatarLink").addEventListener("click", () => {
      const link = location.href.split("#")[0] + "#av=" + avatarToHash(state.avatar);
      navigator.clipboard.writeText(link).then(
        () => toast(t("ok_share"), "ok"),
        () => toast(link, "") /* clipboard refused — at least show the link */
      );
    });

    /* exports (delegated to exporter.js) — data gathered once, per click */
    $("#downloadPng").addEventListener("click", () => {
      const data = collect();
      if (!data.username) return toast(t("err_username"), "err");
      window.NetizenExport.png(data);
    });
    $("#downloadJpg").addEventListener("click", () => {
      const data = collect();
      if (!data.username) return toast(t("err_username"), "err");
      window.NetizenExport.jpg(data);
    });
    $("#downloadGif").addEventListener("click", () => {
      const data = collect();
      if (!data.username) return toast(t("err_username"), "err");
      window.NetizenExport.gif(data);
    });
    $("#downloadWebp").addEventListener("click", () => {
      const data = collect();
      if (!data.username) return toast(t("err_username"), "err");
      window.NetizenExport.webp(data);
    });
    $("#downloadSvg").addEventListener("click", () => {
      const data = collect();
      if (!data.username) return toast(t("err_username"), "err");
      window.NetizenExport.svg(data);
    });
    $("#downloadPdf").addEventListener("click", () => {
      const data = collect();
      if (!data.username) return toast(t("err_username"), "err");
      window.NetizenExport.pdf(data);
    });
    $("#downloadHtml").addEventListener("click", () => {
      const data = collect();
      if (!data.username) return toast(t("err_username"), "err");
      window.NetizenExport.html(data);
    });

    wireTagAdd();
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    $("#year").textContent = new Date().getFullYear();

    /* stamp i18n keys onto dynamic bits */
    $("#username").closest(".field").querySelector("label").setAttribute("data-i18n", "username");
    const phMap = { fullname: "fullname", alias: "alias", gender: "gender",
      phones: "phones", emails: "emails", websites: "websites", blogs: "blogs",
      socials: "socials", ims: "ims", bio: "bio" };
    Object.keys(phMap).forEach((n) => {
      const el = document.querySelector('[name="' + n + '"]');
      if (el) el.setAttribute("data-i18n-ph", phMap[n]);
    });
    $("#customTagInput").setAttribute("data-i18n-ph", "tag_add_ph");

    /* restore avatar from a shared link (#av=…) — wins over local draft */
    let fromShared = false;
    if (location.hash.indexOf("#av=") === 0) {
      const shared = avatarFromHash(location.hash.slice(4));
      if (shared) { Object.assign(state.avatar, shared); fromShared = true; }
    }

    applyTheme();
    restoreDraft(fromShared);

    /* avatar editor inside form (reuse the static host from index.html) */
    let avHost = $("#avatarControls");
    if (!avHost) {
      avHost = document.createElement("div");
      avHost.id = "avatarControls";
      ($("#secAvatarAnchor") || $(".pane-form form")).appendChild(avHost);
    }
    window.NetizenAvatar.initUI(avHost, state.avatar, () => render());

    /* applyLang AFTER initUI so avatar-editor labels are translated too */
    applyLang();

    renderTags();
    render();
    bind();

    /* PWA */
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  });
})();