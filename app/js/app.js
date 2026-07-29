/* ============================================================
   PRIMO — app
   State machine a scene (tutto in una finestra, zero scroll
   infinito), wizard in 3 passi, dashboard live.
   ============================================================ */

(function () {
  "use strict";

  const G = window.gsap || null;
  if (!G) document.documentElement.classList.add("no-gsap");

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const fmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const euro = (v) => fmt.format(Math.round(v));

  /* ---------------- stato ---------------- */

  const state = {
    scene: "hero",
    goals: { short: null, mid: null, long: null },
    income: 1200,
    incomeType: "fisso",
    age: "20s",
    family: "solo",
    cityId: null,
    housing: null,
    vehicle: "mezzi",
    jarsPref: "inf",
  };

  let budget = null;           // output del motore
  let catValues = {};          // valori correnti (dopo i tocchi dell'utente)

  const STORAGE = "primo-state-v1";

  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify({ goals: state.goals, income: state.income, incomeType: state.incomeType, age: state.age, family: state.family, cityId: state.cityId, housing: state.housing, vehicle: state.vehicle, jarsPref: state.jarsPref, catValues })); } catch (e) {}
    window.dispatchEvent(new Event("primo:save"));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (!s.cityId || !s.housing) return false;
      Object.assign(state, { goals: s.goals || state.goals, income: s.income ?? 1200, incomeType: s.incomeType || "fisso", age: s.age || "20s", family: s.family || "solo", cityId: s.cityId, housing: s.housing, vehicle: s.vehicle || "mezzi", jarsPref: s.jarsPref || "inf" });
      catValues = s.catValues || {};
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- scene ---------------- */

  const ORDER = ["hero", "goals", "income", "city"];

  function showScene(name, animate = true) {
    state.scene = name;
    $$(".scene").forEach((s) => s.classList.toggle("is-active", s.dataset.scene === name));

    const dots = $("#stepDots");
    const idx = ORDER.indexOf(name);
    dots.classList.toggle("show", idx > 0);
    $$("li", dots).forEach((li, i) => li.classList.toggle("on", i <= idx - 1));

    $("#btnRestart").hidden = !(name === "dash" || name === "done" || name === "table");

    const sc = $(`.scene[data-scene="${name}"]`);
    if (sc) sc.scrollTop = 0;
    window.scrollTo(0, 0);
    if (G && sc && animate) {
      const items = $$(".panel-head, .goal-col, .income-box, .city-col, .housing-col, .panel-foot, .card, .dash-head, .done-head, .done-stats, .done-goals, .done-advice, .done-quote, .done-actions", sc);
      if (items.length) {
        const tw = G.fromTo(items, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: "power3.out", delay: 0.15, clearProps: "transform,opacity" });
        /* rete di sicurezza: se i rAF sono sospesi (tab in background),
           il contenuto non deve restare invisibile */
        setTimeout(() => { if (tw.progress() < 1) tw.progress(1); }, 1700);
      }
    }
  }

  function next() {
    const i = ORDER.indexOf(state.scene);
    if (i === -1) return;
    if (state.scene === "city") return; // gestito da btnBuild
    showScene(ORDER[i + 1] || "city");
  }

  function back() {
    const i = ORDER.indexOf(state.scene);
    if (i > 0) showScene(ORDER[i - 1]);
  }

  $$("[data-next]").forEach((b) => b.addEventListener("click", next));
  $$("[data-back]").forEach((b) => b.addEventListener("click", back));

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.target.tagName === "BUTTON") return;
    if (state.scene === "goals" && !$("#btnGoalsNext").disabled) next();
    else if (state.scene === "income") next();
    else if (state.scene === "city" && !$("#btnBuild").disabled) startBuild();
  });

  /* ---------------- hero ---------------- */

  function initHero() {
    const track = $("#tickerTrack");
    const items = [...TICKER, ...TICKER].map(([a, b]) => `<span>${a} · <b>${b}</b></span>`).join("");
    track.innerHTML = items;

    if (G) {
      const t1 = G.to(".hero-title .w", { y: 0, duration: 1.1, stagger: 0.09, ease: "power4.out", delay: 0.25 });
      const t2 = G.to(".reveal", { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", delay: 0.7, onComplete: () => $$(".reveal").forEach((r) => r.classList.add("in")) });
      setTimeout(() => { if (t1.progress() < 1) t1.progress(1); if (t2.progress() < 1) t2.progress(1); }, 2400);
    } else {
      $$(".reveal").forEach((r) => r.classList.add("in"));
    }
  }

  $("#btnStart").addEventListener("click", () => showScene("goals"));

  /* magnetic buttons (solo pointer fine) */
  if (matchMedia("(pointer: fine)").matches && G) {
    $$(".btn-primary").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        G.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.4, ease: "power3.out" });
      });
      btn.addEventListener("pointerleave", () => G.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" }));
    });
  }

  /* ---------------- goals ---------------- */

  function initGoals() {
    const grid = $("#goalsGrid");
    grid.innerHTML = "";
    for (const [key, col] of Object.entries(GOALS)) {
      const el = document.createElement("div");
      el.className = "goal-col";
      el.dataset.h = key;
      el.innerHTML = `
        <div class="goal-col-head">
          <span class="goal-col-title">${col.title}</span>
          <span class="goal-col-when">${col.when} <span class="goal-check">✓</span></span>
        </div>`;
      col.items.forEach((g) => {
        const b = document.createElement("button");
        b.className = "goal-chip";
        b.dataset.h = key;
        b.dataset.id = g.id;
        b.innerHTML = `<span class="g-emoji">${g.emoji}</span><span>${g.label}</span><span class="g-cost">${g.cost ? "~" + euro(g.cost) : "su misura"}</span>`;
        b.addEventListener("click", () => {
          const was = state.goals[key] === g.id;
          state.goals[key] = was ? null : g.id;
          $$(`.goal-chip[data-h="${key}"]`, grid).forEach((c) => c.classList.toggle("on", c.dataset.id === state.goals[key]));
          updateGoalsNext();
        });
        el.appendChild(b);
      });
      grid.appendChild(el);
    }
    updateGoalsNext();
  }

  /* un obiettivo per orizzonte: breve, medio e lungo */
  function updateGoalsNext() {
    const n = ["short", "mid", "long"].filter((k) => state.goals[k]).length;
    const btn = $("#btnGoalsNext");
    btn.disabled = n < 3;
    btn.innerHTML = n < 3
      ? `Scegline ancora ${3 - n} <span class="arrow">→</span>`
      : `Avanti <span class="arrow">→</span>`;
    $$("#goalsGrid .goal-col").forEach((col) => col.classList.toggle("chosen", !!state.goals[col.dataset.h]));
  }

  /* ---------------- income ---------------- */

  const incomeInput = $("#incomeInput");
  const incomeRange = $("#incomeRange");
  const incomeHint = $("#incomeHint");

  function setRangeFill(el) {
    const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
    el.style.setProperty("--fill", pct + "%");
  }

  function updateIncome(v, fromRange) {
    state.income = Math.max(0, Math.min(99999, v | 0));
    if (!fromRange) incomeRange.value = Math.min(state.income, +incomeRange.max);
    incomeInput.value = state.income;
    setRangeFill(incomeRange);

    let hint;
    if (state.income === 0) hint = "Anche con 0€ fissi si può iniziare: il piano parte da <b>1€</b> quando arriva qualcosa.";
    else if (state.income < 300) hint = "Paghetta o lavoretti? Perfetto: è il momento migliore per imparare.";
    else if (state.income < 900) hint = "Part-time o stage: costruire l'abitudine ora vale <b>più dello stipendio</b>.";
    else if (state.income < 1500) hint = "Lo stipendio medio d'ingresso in Italia è qui: vediamo quanto respiro ti lascia la tua città.";
    else if (state.income < 2500) hint = "Buona base: con le regole giuste qui si costruisce <b>davvero</b>.";
    else hint = "Ottima base: il rischio ora si chiama <i>lifestyle inflation</i>. Il piano ti tiene dritto.";
    if (state.incomeType === "piva" && state.income > 0) {
      hint = `Partita IVA: <b>${euro(state.income * 0.5)}</b> vanno subito da parte per il fisco — il piano si costruisce sui <b>${euro(state.income * 0.5)}</b> che restano.`;
    }
    incomeHint.innerHTML = hint;
  }

  incomeInput.addEventListener("input", () => updateIncome(parseInt(incomeInput.value.replace(/\D/g, ""), 10) || 0, false));
  incomeRange.addEventListener("input", () => updateIncome(+incomeRange.value, true));

  /* età e famiglia: cambiano stime e obiettivi */
  function initProfile() {
    const build = (elId, list, key) => {
      const wrap = $("#" + elId);
      list.forEach((o) => {
        const b = document.createElement("button");
        b.dataset.id = o.id;
        b.textContent = (o.emoji ? o.emoji + " " : "") + o.label;
        b.classList.toggle("on", state[key] === o.id);
        b.addEventListener("click", () => {
          state[key] = o.id;
          $$("button", wrap).forEach((x) => x.classList.toggle("on", x.dataset.id === o.id));
        });
        wrap.appendChild(b);
      });
    };
    build("ageChoice", AGES, "age");
    build("familyChoice", FAMILY, "family");
  }

  function syncProfile() {
    $$("#ageChoice button").forEach((x) => x.classList.toggle("on", x.dataset.id === state.age));
    $$("#familyChoice button").forEach((x) => x.classList.toggle("on", x.dataset.id === state.family));
  }

  /* tipo di entrate: stipendio fisso o partita IVA */
  $$("#typeToggle .type-btn").forEach((b) => {
    b.addEventListener("click", () => {
      state.incomeType = b.dataset.type;
      $$("#typeToggle .type-btn").forEach((x) => {
        const on = x.dataset.type === state.incomeType;
        x.classList.toggle("on", on);
        x.setAttribute("aria-checked", on);
      });
      updateIncome(state.income, false);
    });
  });

  /* ---------------- city ---------------- */

  function initCity() {
    const grid = $("#cityGrid");
    const render = (filter = "") => {
      grid.innerHTML = "";
      CITIES.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase())).forEach((c) => {
        const b = document.createElement("button");
        b.className = "city-btn" + (state.cityId === c.id ? " on" : "");
        b.setAttribute("role", "option");
        b.innerHTML = `${c.name}<small>stanza ~${euro(c.r)}/mese</small>`;
        b.addEventListener("click", () => {
          state.cityId = c.id;
          $$(".city-btn", grid).forEach((x) => x.classList.remove("on"));
          b.classList.add("on");
          updateCityPreview();
        });
        grid.appendChild(b);
      });
    };
    render();
    $("#citySearch").addEventListener("input", (e) => render(e.target.value));

    const hg = $("#housingGrid");
    HOUSING.forEach((h) => {
      const b = document.createElement("button");
      b.className = "housing-btn";
      b.dataset.id = h.id;
      b.innerHTML = `<span class="h-emoji">${h.emoji}</span><span>${h.label}</span><small style="color:var(--faint)">${h.desc}</small>`;
      b.addEventListener("click", () => {
        state.housing = h.id;
        $$(".housing-btn", hg).forEach((x) => x.classList.toggle("on", x.dataset.id === h.id));
        updateCityPreview();
      });
      hg.appendChild(b);
    });

    const vg = $("#vehicleGrid");
    VEHICLES.forEach((v) => {
      const b = document.createElement("button");
      b.className = "housing-btn" + (v.id === state.vehicle ? " on" : "");
      b.dataset.id = v.id;
      b.innerHTML = `<span class="h-emoji">${v.emoji}</span><span>${v.label}</span><small style="color:var(--faint)">${v.desc}</small>`;
      b.addEventListener("click", () => {
        state.vehicle = v.id;
        $$(".housing-btn", vg).forEach((x) => x.classList.toggle("on", x.dataset.id === v.id));
        updateCityPreview();
      });
      vg.appendChild(b);
    });
  }

  function updateCityPreview() {
    $("#btnBuild").disabled = !(state.cityId && state.housing);
    const box = $("#cityPreview");
    if (!state.cityId || !state.housing) { box.hidden = true; return; }
    const c = CITIES.find((x) => x.id === state.cityId);
    const v = VEHICLES.find((x) => x.id === state.vehicle) || VEHICLES[0];
    let casa = state.housing === "genitori" ? 0 : state.housing === "stanza" ? c.r : Math.round(c.m * (state.housing === "mutuo" ? 0.9 : 1));
    box.hidden = false;
    box.innerHTML = `A <b>${c.name}</b> stimiamo: casa <b>${euro(casa)}</b>, spesa <b>~${euro(state.housing === "genitori" ? c.g * 0.35 : c.g)}</b>, trasporti <b>${euro(v.cost == null ? c.t : v.cost)}</b> (${v.label.toLowerCase()}) al mese. Se i tuoi numeri sono diversi, li aggiusti dopo — coi cursori o scrivendo le cifre.`;
  }

  /* ---------------- loading → dashboard ---------------- */

  $("#btnBuild").addEventListener("click", startBuild);

  function startBuild() {
    showScene("loading");
    const line = $("#loadingLine");
    let i = 0;
    line.textContent = LOADING_LINES[0];
    const int = setInterval(() => {
      i++;
      if (i >= LOADING_LINES.length) {
        clearInterval(int);
        buildDashboard(true);
        showScene("dash");
        tourMaybe();
        return;
      }
      line.textContent = LOADING_LINES[i];
    }, 520);
  }

  /* ---------------- dashboard ---------------- */

  const GROUP_META = {
    fisco:     { label: "Fisco",            color: "#ff5c72" },
    fissi:     { label: "Tetto & bollette", color: "#7c5cff" },
    vivere:    { label: "Vivere",           color: "#4bd8c4" },
    svago:     { label: "Svago & desideri", color: "#ff7a59" },
    dono:      { label: "Beneficenza",      color: "#ff8ac2" },
    risparmio: { label: "Futuro",           color: "#d9ff4b" },
  };

  function buildDashboard(fresh) {
    budget = computeBudget(state);

    if (fresh || !Object.keys(catValues).length) {
      catValues = {};
      budget.cats.forEach((c) => (catValues[c.id] = c.val));
    }
    save();

    /* mese */
    $("#dashMonth").textContent = new Date().toLocaleDateString("it-IT", { month: "long" });

    /* pills */
    const h = HOUSING.find((x) => x.id === state.housing);
    $("#dashPills").innerHTML = `
      <span class="pill">📍 <b>${budget.city.name}</b></span>
      <span class="pill">💶 <b>${euro(state.income)}</b>/mese</span>
      <span class="pill">${h.emoji} <b>${h.label}</b></span>
      <span class="pill">${budget.vehicle.emoji} <b>${budget.vehicle.label}</b></span>
      ${budget.family !== "solo" ? `<span class="pill">${(FAMILY.find((f) => f.id === budget.family) || {}).emoji || ""} <b>${(FAMILY.find((f) => f.id === budget.family) || {}).label || ""}</b></span>` : ""}
      ${budget.isPiva ? `<span class="pill">🧾 <b>Partita IVA</b></span>` : ""}`;

    /* il set di gruppi del donut può cambiare (fisco sì/no) */
    $("#donutArcs").innerHTML = "";

    renderCats();
    updateLive(true);
    initTeachers();
  }

  /* --- righe categorie --- */

  function renderCats() {
    const list = $("#catsList");
    list.innerHTML = "";
    budget.cats.forEach((c) => {
      const row = document.createElement("div");
      row.className = "cat" + (c.id === "risparmio" ? " cat-save" : "");
      row.dataset.id = c.id;
      const isSave = c.id === "risparmio";
      row.innerHTML = `
        <span class="cat-emoji">${c.emoji}</span>
        <span class="cat-name">${c.label} <small>${c.sub}</small></span>
        <span class="cat-value">
          <input data-valinput type="text" inputmode="numeric" maxlength="5" value="${catValues[c.id]}" ${isSave ? "readonly" : ""} aria-label="${c.label} in euro" /><span class="cat-suffix">€</span><small data-pct></small>
        </span>
        <input class="range" type="range" min="0" max="${Math.max(50, state.income)}" step="1" value="${catValues[c.id]}" ${isSave ? "disabled" : ""} aria-label="${c.label} (cursore)" />`;
      const range = $(".range", row);
      const valInput = $("[data-valinput]", row);
      if (!isSave) {
        range.addEventListener("input", () => {
          catValues[c.id] = +range.value;
          updateLive(false);
          save();
        });
        valInput.addEventListener("focus", () => valInput.select());
        valInput.addEventListener("input", () => {
          const v = Math.max(0, Math.min(99999, parseInt(valInput.value.replace(/\D/g, ""), 10) || 0));
          catValues[c.id] = v;
          range.value = Math.min(v, +range.max);
          updateLive(false);
          save();
        });
        valInput.addEventListener("blur", () => { valInput.value = catValues[c.id]; });
        valInput.addEventListener("keydown", (e) => { if (e.key === "Enter") valInput.blur(); });
      }
      list.appendChild(row);
    });
  }

  /* --- aggiornamento live (slider, donut, gauge, obiettivi) --- */

  function updateLive(animate) {
    const income = state.income;
    const others = budget.cats.filter((c) => c.id !== "risparmio").reduce((s, c) => s + (catValues[c.id] || 0), 0);
    let saving = income - others;
    const deficitNow = saving < 1 ? 1 - saving : 0;
    saving = Math.max(saving, income > 0 || others === 0 ? 1 : 1);
    catValues.risparmio = saving;

    /* righe */
    $$(".cat").forEach((row) => {
      const id = row.dataset.id;
      const v = catValues[id] || 0;
      const valInput = $("[data-valinput]", row);
      if (valInput !== document.activeElement) valInput.value = v;
      $("[data-pct]", row).textContent = income > 0 ? Math.round((v / income) * 100) + "%" : "";
      const range = $(".range", row);
      if (id === "risparmio") range.value = v;
      setRangeFill(range);

      /* viaggi non è una spesa: è una busta che si riempie */
      if (id === "viaggi") {
        $(".cat-name small", row).textContent = v > 0
          ? `non li spendi ora: tra 12 mesi sono ${euro(v * 12)} per partire`
          : "si accumula ogni mese";
      }
      if (id === "risparmio") {
        $(".cat-name small", row).textContent = "intoccabile — viaggi e sfizi hanno già la loro busta";
      }
    });

    /* donut per gruppi (il fisco appare solo con la partita IVA) */
    const groups = {};
    Object.keys(GROUP_META).forEach((g) => { if (budget.cats.some((c) => c.group === g)) groups[g] = 0; });
    budget.cats.forEach((c) => (groups[c.group] += catValues[c.id] || 0));
    const total = Object.values(groups).reduce((a, b) => a + b, 0) || 1;

    const R = 78, CIRC = 2 * Math.PI * R;
    const arcs = $("#donutArcs");
    if (!arcs.childElementCount) {
      Object.keys(groups).forEach((g) => {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("class", "seg");
        c.setAttribute("cx", 100); c.setAttribute("cy", 100); c.setAttribute("r", R);
        c.dataset.g = g;
        c.setAttribute("stroke", GROUP_META[g].color);
        arcs.appendChild(c);
      });
    }
    let off = 0;
    Object.entries(groups).forEach(([g, v]) => {
      const frac = v / total;
      const seg = $(`circle[data-g="${g}"]`, arcs);
      seg.setAttribute("stroke-dasharray", `${Math.max(0, frac * CIRC - 1.5)} ${CIRC}`);
      seg.setAttribute("stroke-dashoffset", -off * CIRC);
      off += frac;
    });

    countUp($("#donutTotal"), total, animate);

    /* legenda */
    $("#donutLegend").innerHTML = Object.entries(groups).map(([g, v]) => `
      <li>
        <span class="dot" style="background:${GROUP_META[g].color}"></span>
        <span class="l-name">${GROUP_META[g].label}</span>
        <span class="l-val">${euro(v)}</span>
        <span class="l-pct">${Math.round((v / total) * 100)}%</span>
      </li>`).join("");

    /* card piano: risparmio e investimenti, separati */
    const inv = catValues.investimento || 0;
    countUp($("#saveRisp"), saving, animate);
    countUp($("#saveInv"), inv, animate);
    const sn = $("#saveNote");
    if (deficitNow > 0) {
      sn.innerHTML = `⚠️ Così spendi <b style="color:var(--danger)">${euro(deficitNow)}</b> più di quanto entra. Lima qualche cursore — anche tenere solo 1€ conta.`;
    } else if (saving <= 5 && inv <= 5) {
      sn.innerHTML = `<b style="color:var(--lime)">1€ è meglio di niente. Sul serio.</b> Non è la cifra: è l'abitudine. Quando le entrate cresceranno, l'abitudine sarà già lì.`;
    } else {
      sn.innerHTML = `Il <b style="color:var(--lime)">risparmio</b> è il tuo cuscino: non si tocca. Gli <b style="color:#b09dff">investimenti</b> sono soldi che lavorano: due cose diverse, due salvadanai diversi.`;
    }

    renderGoalsGuide($("#goalsGuide"));
    renderJars();

    /* gauge tenore di vita: ricalcolato sui numeri veri, non sulla stima */
    const tasseNow = catValues.tasse || 0;
    const fixedNow = ["casa", "bollette", "spesa", "trasporti", "salute"].reduce((s, k) => s + (catValues[k] || 0), 0);
    budget.spendibile = income - tasseNow;
    budget.fixed = fixedNow;
    budget.essenziali = fixedNow;
    budget.ratio = deficitNow > 0 ? 1.5 : budget.spendibile > 0 ? fixedNow / budget.spendibile : 2;
    Object.assign(budget, gradeFor(budget.ratio, budget.city.name));

    const fill = $("#gaugeFill");
    const r = Math.min(1, Math.max(0, budget.ratio));
    fill.style.strokeDashoffset = 163 - 163 * r;
    fill.style.stroke = budget.gradeColor;
    $("#vitaGrade").textContent = budget.grade;
    $("#vitaGrade").style.color = budget.gradeColor;
    $("#vitaLabel").textContent = budget.gradeLabel;
    $("#vitaNote").textContent = budget.gradeNote;
  }

  /* guida per obiettivo, in parole semplici: quanto serve, dove, come stai */
  function renderGoalsGuide(wrap) {
    const rows = goalPlan(state, budget, catValues);
    if (!rows.length) { wrap.innerHTML = ""; return; }
    wrap.innerHTML = rows.map((r) => {
      const entro = r.months >= 24 ? `${Math.round(r.months / 12)} anni` : `${r.months} mesi`;
      if (r.ok) {
        return `<div class="gg ok">${r.emoji} <b>${r.label}</b> (${euro(r.cost)}): con <b>${euro(r.rate)}/mese</b> in ${r.bucketName} ci arrivi in <b class="gg-state">${fmtMonths(r.eta)}</b> ✓</div>`;
      }
      return `<div class="gg gap">${r.emoji} <b>${r.label}</b> (${euro(r.cost)} entro ${entro}): servono <b class="gg-state">~${euro(r.needed)}/mese</b> in ${r.bucketName} — ora ne metti ${euro(r.rate)}</div>`;
    }).join("");
  }

  /* --- maestri --- */

  let teacherIdx = 0, teacherTimer = null;

  function initTeachers() {
    const card = $("#teacherCard");
    const dots = $("#teacherDots");
    dots.innerHTML = TEACHERS.map((_, i) => `<span${i === 0 ? ' class="on"' : ""}></span>`).join("");
    showTeacher(0);
    clearInterval(teacherTimer);
    teacherTimer = setInterval(() => showTeacher(teacherIdx + 1), 9000);
    card.onclick = () => { showTeacher(teacherIdx + 1); clearInterval(teacherTimer); teacherTimer = setInterval(() => showTeacher(teacherIdx + 1), 9000); };
    card.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.onclick(); } };
  }

  function showTeacher(i) {
    teacherIdx = i % TEACHERS.length;
    const t = TEACHERS[teacherIdx];
    const q = $("#teacherQuote"), n = $("#teacherName");
    q.classList.add("teacher-fade"); n.classList.add("teacher-fade");
    setTimeout(() => {
      q.textContent = "«" + t.quote + "»";
      n.textContent = t.name + " — " + t.rule;
      q.classList.remove("teacher-fade"); n.classList.remove("teacher-fade");
    }, 280);
    $$("#teacherDots span").forEach((d, j) => d.classList.toggle("on", j === teacherIdx));
  }

  /* --- count-up --- */

  const countState = new WeakMap();

  function countUp(el, to, animate) {
    const from = countState.get(el) ?? 0;
    countState.set(el, to);
    if (!animate || Math.abs(to - from) < 2) { el.textContent = euro(to); return; }
    const t0 = performance.now(), dur = 900;
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = euro(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ---------------- piano del mese (buste integrate) ---------------- */

  function renderJars() {
    if (!budget) return;
    const plan = buildJars("inf", catValues, budget);

    const mainRows = plan.main.map((m) => `
      <div class="jar jar-main">
        <span class="jar-emoji">🏦</span>
        <div class="jar-info"><div class="jar-name">Lascia sul conto</div><div class="jar-items">${m.label || m.ids.join(", ")}</div></div>
        <span class="jar-amount">${euro(m.amount)}</span>
      </div>`).join("");

    const jarRows = plan.jars.map((j) => `
      <div class="jar ${j.cls || ""}">
        <span class="jar-emoji">${j.emoji}</span>
        <div class="jar-info"><div class="jar-name">${j.name}</div><div class="jar-items">${j.note || ""}</div></div>
        <span class="jar-amount">${euro(j.amount)}</span>
      </div>`).join("");

    const note = `<p class="jars-note">Appena entrano i soldi, dividili in quest'ordine — su conti, buste o anche solo su un foglio. Quello che non vedi non lo spendi.</p>`;

    $("#jarsList").innerHTML = jarRows + mainRows + note;
  }

  /* ---------------- scena finale: piano confermato ---------------- */

  function renderDone() {
    const saving = (catValues.risparmio || 1) + (catValues.investimento || 0);
    const base = budget.spendibile > 0 ? budget.spendibile : state.income || 1;
    const pct = saving / base;
    const totalOut = budget.cats.reduce((s, c) => s + (catValues[c.id] || 0), 0);
    const liveDeficit = totalOut - state.income;

    let title, sub;
    if (liveDeficit > 0) {
      title = `Hai guardato i numeri <em>in faccia</em>.`;
      sub = `È la cosa più difficile, e l'hai già fatta. Si parte da ${euro(saving)} al mese: non è la cifra, è l'abitudine — e le abitudini crescono con le entrate.`;
    } else if (pct >= 0.2) {
      title = `Da manuale. <em>Letteralmente.</em>`;
      sub = `Stai seguendo la regola 70/30 dei maestri meglio di molti adulti: risparmio, investimenti e persino qualcosa da donare. Ora c'è solo da non mollare — il piano lavora anche quando dormi.`;
    } else if (pct >= 0.1) {
      title = `Solido. Il futuro <em>ringrazia</em>.`;
      sub = `Ogni mese una parte di quello che guadagni resta tua per sempre. È esattamente così che si comincia.`;
    } else {
      title = `Piccolo oggi. <em>Gigante domani.</em>`;
      sub = `A ${budget.city.name} non è facile, e tu un piano ce l'hai comunque. Proteggi quei ${euro(saving)} al mese come se fossero mille.`;
    }
    $("#doneTitle").innerHTML = title;
    $("#doneSub").textContent = sub;

    /* risparmio e investimenti separati; il patrimonio totale a 5 anni
       è la somma, ma è un'altra cosa: è quanto ti ritroverai */
    const r = catValues.risparmio || 1;
    const i = catValues.investimento || 0;
    $("#doneStats").innerHTML = `
      <div class="done-stat"><b data-stat="m">€0</b><span>🌱 risparmio al mese</span></div>
      <div class="done-stat"><b data-stat="y1">€0</b><span>📈 investiti al mese</span></div>
      <div class="done-stat"><b data-stat="y5">€0</b><span>🏦 patrimonio tra 5 anni</span></div>`;
    countUp($(`[data-stat="m"]`), r, true);
    countUp($(`[data-stat="y1"]`), i, true);
    countUp($(`[data-stat="y5"]`), (r + i) * 60, true);

    /* dove migliorare (con i consigli precisi per gli obiettivi) */
    const advice = buildAdvice(budget, catValues, state);
    $("#doneAdvice").innerHTML =
      `<p class="done-advice-title">${advice[0].tone === "ok" ? "Il verdetto" : "Dove puoi migliorare"}</p>` +
      advice.map((x) => `<div class="advice ${x.tone}"><span>${x.emoji}</span><p>${x.html}</p></div>`).join("");
  }

  /* la tabella di marcia: paga prima te stesso, poi tutto il resto */
  function doneTableRows() {
    const plan = buildJars("inf", catValues, budget);
    const find = (id) => plan.jars.find((j) => j.ids.includes(id));
    const rows = [];
    const push = (j, cls, text) => { if (j) rows.push({ cls, text, amount: j.amount }); };

    push(find("risparmio"), "lime", `<b>Paga prima te stesso</b>: nel salvadanaio Risparmio — non si tocca`);
    push(find("investimento"), "lime", `Poi i soldi che lavorano: metti in <b>Investimenti</b>`);
    push(find("beneficenza"), "", `Metti in <b>Dono</b> — dare è ricchezza`);
    push(find("tasse"), "tax", `Sposta nel salvadanaio <b>Fisco</b>: non è tuo`);
    plan.main.forEach((m) => rows.push({ cls: "", text: `Lascia sul conto per <b>casa e bollette</b>`, amount: m.amount }));
    ["spesa", "trasporti", "salute", "abbonamenti", "hobby", "shopping", "viaggi"].forEach((id) => {
      push(find(id), "", `Metti in <b>${(find(id) || {}).name || id}</b>`);
    });
    return rows;
  }

  function renderDoneTable() {
    const rows = doneTableRows();
    const month = new Date().toLocaleDateString("it-IT", { month: "long" });
    $("#doneTable").innerHTML =
      `<p class="done-table-title">La tua tabella di marcia — ogni volta che entrano soldi</p>` +
      rows.map((row, idx) => `
        <div class="dt-row ${row.cls}">
          <span class="dt-num">${idx + 1}</span>
          <span class="dt-text">${row.text}</span>
          <span class="dt-amount">${euro(row.amount)}</span>
        </div>`).join("") +
      `<p class="dt-foot">Vale per ${month} e per ogni mese finché non cambia qualcosa. Copiala, scrivila a mano o falle una foto: deve stare dove la vedi.</p>`;
  }

  $("#btnCopyTable").addEventListener("click", async () => {
    const rows = doneTableRows();
    const month = new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" });
    const strip = (s) => s.replace(/<[^>]+>/g, "");
    const lines = [
      `PRIMO EURO — tabella di marcia (${month})`,
      `${budget.city.name} · ${euro(state.income)}/mese${budget.isPiva ? " · Partita IVA" : ""}`,
      ``,
      `Ogni volta che entrano soldi:`,
      ...rows.map((row, idx) => `${idx + 1}. ${strip(row.text)}: ${euro(row.amount)}`),
      ``,
      `Ogni euro conta. Anche uno.`,
    ];
    const btn = $("#btnCopyTable");
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      btn.textContent = "✓ Copiata!";
      setTimeout(() => (btn.textContent = "📋 Copia la tabella"), 1800);
    } catch (e) {
      prompt("Copia la tabella:", lines.join(" · "));
    }
  });

  $("#btnConfirm").addEventListener("click", () => {
    tourEnd();
    renderDone();
    showScene("done");
  });

  $("#btnBackDash").addEventListener("click", () => showScene("dash"));

  /* "vado così" → la schermata finale: la tabella di marcia */
  $("#btnDoneOk").addEventListener("click", () => {
    renderDoneTable();
    showScene("table");
  });

  $("#btnTableBack").addEventListener("click", () => showScene("dash"));

  /* ---------------- mini tour guidato ---------------- */

  const TOUR_KEY = "primo-tour-v1";
  const TOUR_STEPS = [
    { sel: ".card-cats", text: "Queste sono le tue spese, già stimate sulla tua città. <b>Trascina i cursori</b> o <b>clicca su una cifra e scrivi</b> quella vera: il resto si sistema da solo." },
    { sel: ".card-save", text: "Questo è <b>il tuo piano</b>: quanto mettere da parte e dove, appena entrano i soldi. Viaggi, hobby e shopping <b>hanno la loro busta</b> — non si pagano mai coi risparmi. Quando i numeri ti tornano, premi <b>✓ Conferma il piano</b>." },
    { sel: ".card-donut", text: "Qui vedi <b>dove va ogni euro</b> in un colpo d'occhio, e sotto quanto respiri nella tua città. Obiettivo del gioco: far crescere la fetta verde, anche di 1€ alla volta." },
  ];

  let tourIdx = -1, coachEl = null;

  function tourStart() {
    tourIdx = -1;
    $(".dash").classList.add("touring");
    tourNext();
  }

  function tourNext() {
    tourIdx++;
    if (tourIdx >= TOUR_STEPS.length) { tourEnd(); return; }
    $$(".tour-focus").forEach((el) => el.classList.remove("tour-focus"));
    const step = TOUR_STEPS[tourIdx];
    const target = $(step.sel);
    if (target) {
      target.classList.add("tour-focus");
      target.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    if (!coachEl) {
      coachEl = document.createElement("div");
      coachEl.className = "coach";
      document.body.appendChild(coachEl);
    }
    const last = tourIdx === TOUR_STEPS.length - 1;
    coachEl.innerHTML = `
      <span class="coach-step">Passo ${tourIdx + 1} di ${TOUR_STEPS.length}</span>
      <p class="coach-text">${step.text}</p>
      <div class="coach-actions">
        <button class="coach-skip" data-skip>Salta la guida</button>
        <button class="btn-primary btn-small" data-nextstep>${last ? "Ho capito ✓" : "Avanti →"}</button>
      </div>`;
    $("[data-nextstep]", coachEl).addEventListener("click", tourNext);
    $("[data-skip]", coachEl).addEventListener("click", tourEnd);
  }

  function tourEnd() {
    $(".dash").classList.remove("touring");
    $$(".tour-focus").forEach((el) => el.classList.remove("tour-focus"));
    if (coachEl) { coachEl.remove(); coachEl = null; }
    try { localStorage.setItem(TOUR_KEY, "1"); } catch (e) {}
  }

  function tourMaybe() {
    try { if (localStorage.getItem(TOUR_KEY)) return; } catch (e) {}
    setTimeout(tourStart, 1400); // dopo l'animazione di ingresso
  }

  $("#btnTour").addEventListener("click", tourStart);

  /* ---------------- azioni dashboard ---------------- */

  $("#btnReset").addEventListener("click", () => buildDashboard(true));

  $("#btnRestart").addEventListener("click", () => {
    try { localStorage.removeItem(STORAGE); } catch (e) {}
    state.goals = { short: null, mid: null, long: null };
    state.cityId = null; state.housing = null;
    state.incomeType = "fisso"; state.jarsPref = "inf"; state.vehicle = "mezzi";
    state.age = "20s"; state.family = "solo";
    syncProfile();
    $$("#typeToggle .type-btn").forEach((x) => x.classList.toggle("on", x.dataset.type === "fisso"));
    $$("#vehicleGrid .housing-btn").forEach((x) => x.classList.toggle("on", x.dataset.id === "mezzi"));
    catValues = {};
    $$(".goal-chip").forEach((c) => c.classList.remove("on"));
    updateGoalsNext();
    $$(".city-btn").forEach((c) => c.classList.remove("on"));
    $$("#housingGrid .housing-btn").forEach((c) => c.classList.remove("on"));
    updateCityPreview();
    showScene("hero");
  });

  /* ---------------- init ---------------- */

  initHero();
  initGoals();
  initCity();
  initProfile();
  updateIncome(state.income, false);

  if (load()) {
    /* bentornato: ripristina le selezioni e vai dritto al piano */
    updateIncome(state.income, false);
    $$("#typeToggle .type-btn").forEach((x) => x.classList.toggle("on", x.dataset.type === state.incomeType));
    syncProfile();
    $$(".goal-chip").forEach((c) => c.classList.toggle("on", state.goals[c.dataset.h] === c.dataset.id));
    updateGoalsNext();
    $$(".city-btn").forEach((c) => c.classList.toggle("on", c.textContent.toLowerCase().startsWith((CITIES.find(x => x.id === state.cityId) || {}).name?.toLowerCase() || "~")));
    $$("#housingGrid .housing-btn").forEach((c) => c.classList.toggle("on", c.dataset.id === state.housing));
    $$("#vehicleGrid .housing-btn").forEach((c) => c.classList.toggle("on", c.dataset.id === state.vehicle));
    updateCityPreview();
    buildDashboard(false);
    showScene("dash", false);
  }
})();
