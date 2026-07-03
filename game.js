"use strict";
/* =====================================================================
   STACK QUEST — GAME ENGINE
   Systems: hearts (3 per run), coins + item shop (potion, 50/50),
   combo streaks, boss HP battles with requeue, achievements, titles.
   ===================================================================== */

/* ---------- helpers ---------- */
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  if (a && b && typeof a === "object") {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every(k => deepEqual(a[k], b[k]));
  }
  return false;
}

function fmt(v) {
  if (v === undefined) return "undefined";
  return JSON.stringify(v);
}

/* ---------- persistence ---------- */
const SAVE_KEY = "stackQuestSave_v2";
let save = loadSave();
let session = null;

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (!s.achievements) s.achievements = [];
      if (s.coins === undefined) s.coins = 0;
      return s;
    }
  } catch (e) { /* corrupted save — start fresh */ }
  return { xp: 0, coins: 20, achievements: [], worlds: {} };
}
function persist() { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
function worldSave(id) {
  if (!save.worlds[id]) save.worlds[id] = { stars: 0, bossDefeated: false, bestPct: 0 };
  return save.worlds[id];
}

/* ---------- levels, titles, achievements ---------- */
function level() { return Math.floor(save.xp / 100) + 1; }
function title() {
  const lv = level();
  if (lv >= 10) return "Middle Office Legend";
  if (lv >= 7) return "Stack Wrangler";
  if (lv >= 5) return "Bug Slayer";
  if (lv >= 3) return "Junior Dev";
  if (lv >= 2) return "Code Cadet";
  return "Intern";
}

const ACHIEVEMENTS = [
  { id: "first_blood",  icon: "🩸", name: "First Blood",      desc: "Answer your first challenge correctly" },
  { id: "hands_on",     icon: "⚒️", name: "Hands-On Hacker",  desc: "Pass a Code Forge challenge with real running code" },
  { id: "combo_5",      icon: "🔥", name: "On Fire",          desc: "Hit a 5-answer combo" },
  { id: "boss_1",       icon: "⚔️", name: "Boss Slayer",      desc: "Defeat your first boss" },
  { id: "flawless",     icon: "💎", name: "Flawless",         desc: "Clear a world with 100% accuracy" },
  { id: "gauntlet_ace", icon: "🏅", name: "Decathlete",       desc: "Score 8+ in The Gauntlet" },
  { id: "level_5",      icon: "🎖️", name: "Bug Slayer",       desc: "Reach level 5" },
  { id: "all_bosses",   icon: "👑", name: "Stack Master",     desc: "Defeat all 7 bosses" }
];

function unlock(id) {
  if (save.achievements.includes(id)) return;
  save.achievements.push(id);
  persist();
  const a = ACHIEVEMENTS.find(x => x.id === id);
  toast(`${a.icon} Achievement unlocked: ${a.name}!`, "gold");
}

/* ---------- HUD & toasts ---------- */
function renderHud() {
  document.getElementById("hud-level").innerHTML = `Lv ${level()} · ${title()}`;
  document.getElementById("hud-xp").textContent = save.xp + " XP";
  document.getElementById("hud-xpbar").style.width = (save.xp % 100) + "%";
  document.getElementById("hud-coins").textContent = "🪙 " + save.coins;
}
function gainXp(n) {
  const before = level();
  save.xp += n;
  persist(); renderHud();
  if (level() > before) toast(`⬆️ Level up! Lv ${level()} — ${title()}`, "gold");
  if (level() >= 5) unlock("level_5");
}
function gainCoins(n) { save.coins += n; persist(); renderHud(); }

function toast(msg, kind) {
  const t = document.createElement("div");
  t.className = "toast" + (kind === "gold" ? " toast-gold" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  const others = document.querySelectorAll(".toast").length - 1;
  t.style.top = (18 + others * 54) + "px";
  setTimeout(() => t.remove(), 2800);
}

/* =====================================================================
   MAP
   ===================================================================== */
const app = document.getElementById("app");

function showMap() {
  session = null;
  const unlocked = save.achievements;
  const badges = ACHIEVEMENTS.map(a =>
    `<span class="badge ${unlocked.includes(a.id) ? "" : "locked"}" title="${a.name} — ${a.desc}">${a.icon}</span>`
  ).join("");

  let html = `
    <p class="subtitle">Seven worlds, one for each technology. Each world <b>teaches before it tests</b>:
    short 📖 lessons, then hands-on practice, then the boss. You get <b>3 ❤️ per run</b>, every question has a
    💡 hint, and the 📖 button on each card opens its Field Guide for reading anytime.</p>
    <div class="badge-row">${badges}</div>
    <div class="grid">`;

  for (const w of WORLDS) {
    const ws = worldSave(w.id);
    const stars = "★".repeat(ws.stars) + `<span class="off">${"★".repeat(3 - ws.stars)}</span>`;
    const lessons = w.questions.filter(q => q.type === "lesson").length;
    const handsOn = w.questions.filter(q => ["code", "parsons", "multifill", "match"].includes(q.type)).length;
    html += `
      <div class="world-card" style="--wc:${w.color}" onclick="startWorld('${w.id}')">
        <button class="guide-btn" title="Open the ${w.name} Field Guide" onclick="event.stopPropagation(); openGuide('${w.id}')">📖</button>
        <div class="w-icon">${w.icon}</div>
        <div class="w-name">${w.name}</div>
        <div class="w-desc">${w.desc}</div>
        <div class="w-meta">
          <span class="stars">${stars}</span>
          <span class="boss-badge">${ws.bossDefeated ? "👑 Boss slain" : `<span style="color:var(--muted)">${lessons} lessons · ${handsOn} hands-on</span>`}</span>
        </div>
        <div class="w-prog-outer"><div class="w-prog-inner" style="width:${ws.bestPct}%"></div></div>
      </div>`;
  }
  html += `</div>
    <div class="gauntlet-card" onclick="startGauntlet()">
      <div>
        <div class="w-name">🎲 The Gauntlet</div>
        <div class="w-desc" style="margin:4px 0 0">10 random challenges from every world, 3 hearts, no mercy. Daily warm-up before the new job.</div>
      </div>
      <div style="font-size:28px">→</div>
    </div>
    <div class="reset-link">Progress saves automatically in this browser · <a onclick="resetAll()">reset all progress</a></div>`;
  app.innerHTML = html;
  renderHud();
}

function resetAll() {
  if (confirm("Wipe all XP, coins, stars, and achievements?")) {
    save = { xp: 0, coins: 20, achievements: [], worlds: {} };
    persist(); showMap();
  }
}

/* =====================================================================
   RUNS
   ===================================================================== */
function newSession(world, mode, queue) {
  return {
    world, mode, queue,
    idx: 0, correct: 0, attempts: 0, streak: 0,
    xpEarned: 0, coinsEarned: 0,
    hearts: 3, maxHearts: 3, dead: false,
    phase: "questions",
    bossQueue: null, bossHp: 0, bossMaxHp: 0,
    fiftyUsed: false, matchState: null, codeAttempts: 0
  };
}

function startWorld(id) {
  const w = WORLDS.find(x => x.id === id);
  session = newSession(w, "world", [...w.questions]);
  renderQuestion();
}

function startGauntlet() {
  const pool = [];
  for (const w of WORLDS)
    for (const q of w.questions)
      if (q.type !== "lesson") pool.push({ ...q, _world: w });
  session = newSession(
    { name: "The Gauntlet", icon: "🎲", color: "#8b5cf6", id: "gauntlet" },
    "gauntlet",
    shuffle(pool).slice(0, 10)
  );
  renderQuestion();
}

function currentQuestion() {
  return session.phase === "boss" ? session.bossQueue[0] : session.queue[session.idx];
}
function questionColor(q) {
  return (session.mode === "gauntlet" && q._world) ? q._world.color : session.world.color;
}

/* =====================================================================
   RENDERING
   ===================================================================== */
const TYPE_LABEL = {
  mc: "Multiple choice", fill: "Type the answer", bug: "Spot the bug",
  multifill: "Complete the code", parsons: "Assemble the code",
  match: "Matching battle", code: "⚒️ Code Forge", lesson: "📖 Lesson"
};

function guideWorld() {
  const q = currentQuestion();
  return (session.mode === "gauntlet" && q && q._world) ? q._world : session.world;
}

function statusBar() {
  const s = session;
  const hearts = "❤️".repeat(s.hearts) + "🖤".repeat(s.maxHearts - s.hearts);
  const q = currentQuestion();
  const canFifty = q.type === "mc" && !s.fiftyUsed && save.coins >= 10;
  const canPotion = s.hearts < s.maxHearts && save.coins >= 15;
  return `
    <div class="status-bar">
      <span class="hearts" id="hearts">${hearts}</span>
      <span class="combo" id="combo">${s.streak > 1 ? "🔥 combo ×" + s.streak : ""}</span>
      <span class="spacer"></span>
      <button class="item-btn" onclick="openGuide('${guideWorld().id}')" title="Re-read this world's lessons anytime">📖 Guide</button>
      <button class="item-btn" onclick="buyPotion()" ${canPotion ? "" : "disabled"} title="Restore 1 heart">🧪 Potion <small>15🪙</small></button>
      <button class="item-btn" id="fifty-btn" onclick="buyFifty()" ${canFifty ? "" : "disabled"} title="Remove two wrong options (multiple choice only)">➗ 50/50 <small>10🪙</small></button>
    </div>`;
}

function renderQuestion() {
  const s = session;
  const q = currentQuestion();
  const color = questionColor(q);
  const worldTag = (s.mode === "gauntlet" && q._world) ? `${q._world.icon} ${q._world.name} · ` : "";
  s.fiftyUsed = false;

  let progress, counter;
  if (s.phase === "boss") {
    const hpPct = (s.bossHp / s.bossMaxHp) * 100;
    progress = `
      <div class="boss-strip">
        <span class="boss-face">${s.world.boss.icon}</span>
        <div class="boss-hpwrap">
          <div class="boss-hpname">${s.world.boss.name}</div>
          <div class="boss-hp-outer"><div class="boss-hp-inner" style="width:${hpPct}%"></div></div>
        </div>
        <span class="boss-hplabel">${s.bossHp}/${s.bossMaxHp} HP</span>
      </div>`;
    counter = "Boss battle";
  } else {
    progress = `<div class="q-prog-outer" style="--wc:${color}">
      <div class="q-prog-inner" style="width:${(s.idx / s.queue.length) * 100}%"></div></div>`;
    counter = `${s.idx + 1}/${s.queue.length}`;
  }

  let body = "";
  if (q.type === "lesson") body = renderLessonItem(q);
  else if (q.type === "mc") body = renderMc(q);
  else if (q.type === "fill") body = renderFill(q);
  else if (q.type === "bug") body = renderBug(q);
  else if (q.type === "multifill") body = renderMultifill(q);
  else if (q.type === "parsons") body = renderParsons(q);
  else if (q.type === "match") body = renderMatch(q);
  else if (q.type === "code") body = renderCode(q);

  const hintBar = (q.type !== "lesson" && q.hint)
    ? `<div class="hint-row">
         <button class="hint-btn" id="hint-btn" onclick="showHint()">💡 Hint${s.phase === "boss" ? " <small>5🪙</small>" : ""}</button>
         <div class="hint-box" id="hint-box" hidden></div>
       </div>`
    : "";

  app.innerHTML = `
    <div class="quiz-head" style="--wc:${color}">
      <button class="back-btn" onclick="confirmExit()">← Map</button>
      <div class="quiz-title">${s.world.icon} ${s.world.name}</div>
    </div>
    ${progress}
    ${statusBar()}
    <div class="q-card ${q.type === "lesson" ? "lesson-card" : ""}" style="--wc:${color}">
      <div class="q-type-tag">${worldTag}${TYPE_LABEL[q.type]} · ${counter}</div>
      <div class="q-text">${q.type === "lesson" ? q.title : q.q}</div>
      ${hintBar}
      ${body}
      <div id="feedback"></div>
    </div>`;

  if (q.type === "parsons") initParsons(q);
  if (q.type === "match") initMatch(q);
  const inp = document.getElementById("fill-input") || document.querySelector(".mf-input");
  if (inp) inp.focus();
}

function confirmExit() {
  if (session.idx === 0 && session.phase === "questions"
      || confirm("Leave this run? Hearts and world progress for this run are lost.")) showMap();
}

/* ---------- lessons, hints, field guide ---------- */
function renderLessonItem(q) {
  return `<div class="lesson-body">${q.body}</div>
    <button class="btn big" onclick="lessonDone()">Got it — let's practice ⚔️ <small style="opacity:.7">+2 XP</small></button>`;
}

function lessonDone() {
  session.xpEarned += 2;
  gainXp(2);
  next();
}

function showHint() {
  const s = session, q = currentQuestion();
  if (s.phase === "boss") {
    if (save.coins < 5) { toast("Need 5🪙 for a boss hint"); return; }
    gainCoins(-5);
  }
  const box = document.getElementById("hint-box");
  box.hidden = false;
  box.innerHTML = "💡 " + q.hint;
  document.getElementById("hint-btn").disabled = true;
}

function openGuide(worldId) {
  const w = WORLDS.find(x => x.id === worldId);
  const lessons = w.questions.filter(q => q.type === "lesson");
  const old = document.getElementById("guide-overlay");
  if (old) old.remove();
  const div = document.createElement("div");
  div.className = "overlay";
  div.id = "guide-overlay";
  div.onclick = e => { if (e.target === div) closeGuide(); };
  div.innerHTML = `
    <div class="overlay-card" style="--wc:${w.color}">
      <div class="overlay-head">
        <b>${w.icon} ${w.name} — Field Guide</b>
        <button class="back-btn" onclick="closeGuide()">✕ Close</button>
      </div>
      ${lessons.map(l => `<h3 class="guide-h">${l.title}</h3><div class="lesson-body">${l.body}</div>`).join("<hr class='guide-hr'>")}
    </div>`;
  document.body.appendChild(div);
}
function closeGuide() {
  const el = document.getElementById("guide-overlay");
  if (el) el.remove();
}

/* ---------- type renderers ---------- */
function renderMc(q) {
  return (q.code ? `<pre class="code">${esc(q.code)}</pre>` : "") +
    `<div class="opts">` +
    q.opts.map((o, i) => `<button class="opt" data-i="${i}" onclick="answerMc(${i})">${o}</button>`).join("") +
    `</div>`;
}

function renderFill(q) {
  return (q.code ? `<pre class="code">${esc(q.code).replace(/____/g, '<span class="blank-mark">____</span>')}</pre>` : "") +
    `<div class="fill-row">
      <input class="fill-input" id="fill-input" placeholder="Type your answer..." autocomplete="off" spellcheck="false"
             onkeydown="if(event.key==='Enter')answerFill()">
      <button class="btn" onclick="answerFill()">Submit</button>
    </div>`;
}

function renderBug(q) {
  return `<pre class="code" style="padding:10px 16px">` +
    q.code.map((line, i) =>
      `<span class="code-line" id="bugline-${i}" onclick="answerBug(${i})"><span class="ln">${i + 1}</span>${esc(line) || " "}</span>`
    ).join("") + `</pre>`;
}

function renderMultifill(q) {
  let idx = 0;
  const html = esc(q.code).replace(/\{\{(\d+)\}\}/g, (_, n) => {
    const width = Math.max(...q.blanks[+n].map(x => x.length), 4) + 2;
    return `<input class="mf-input" data-i="${n}" style="width:${width}ch" autocomplete="off" spellcheck="false"
             onkeydown="if(event.key==='Enter')submitMultifill()">`;
  });
  return `<pre class="code mf-pre">${html}</pre>
    <button class="btn big" onclick="submitMultifill()">Check my code ✓</button>`;
}

function renderParsons() {
  return `
    <div class="parsons-label">🧩 Click lines below to build the code, top to bottom. Click a placed line to send it back.</div>
    <pre class="code parsons-target" id="parsons-target"><span class="parsons-empty" id="parsons-empty">— your code goes here —</span></pre>
    <div class="parsons-pile" id="parsons-pile"></div>
    <button class="btn big" id="parsons-submit" onclick="submitParsons()" disabled>Check my code ✓</button>`;
}

function initParsons(q) {
  let order = shuffle(q.lines.map((_, i) => i));
  // ensure the pile isn't accidentally already solved
  if (order.every((v, i) => v === i) && order.length > 1) [order[0], order[1]] = [order[1], order[0]];
  session.parsons = { placed: [], pile: order };
  drawParsons(q);
}

function drawParsons(q) {
  const p = session.parsons;
  const target = document.getElementById("parsons-target");
  target.innerHTML = p.placed.length
    ? p.placed.map((li, pos) =>
        `<span class="code-line placed" onclick="parsonsRemove(${pos})"><span class="ln">${pos + 1}</span>${esc(q.lines[li])}</span>`).join("")
    : `<span class="parsons-empty">— your code goes here —</span>`;
  document.getElementById("parsons-pile").innerHTML =
    p.pile.map(li =>
      `<button class="parsons-chip" onclick="parsonsPlace(${li})">${esc(q.lines[li])}</button>`).join("");
  document.getElementById("parsons-submit").disabled = p.pile.length !== 0;
}

function parsonsPlace(li) {
  const p = session.parsons;
  p.pile = p.pile.filter(x => x !== li);
  p.placed.push(li);
  drawParsons(currentQuestion());
}
function parsonsRemove(pos) {
  const p = session.parsons;
  p.pile.push(p.placed[pos]);
  p.placed.splice(pos, 1);
  drawParsons(currentQuestion());
}

function submitParsons() {
  const q = currentQuestion();
  const p = session.parsons;
  const ok = p.placed.every((li, i) => li === i);
  document.getElementById("parsons-submit").style.display = "none";
  document.querySelectorAll(".parsons-target .code-line").forEach((el, i) => {
    el.onclick = null;
    el.classList.add(p.placed[i] === i ? "picked-right" : "picked-wrong");
  });
  const extra = ok ? null :
    `The correct order:<pre class="code" style="margin-top:8px">${q.lines.map(esc).join("\n")}</pre>`;
  resolve(ok, { xp: 15, extra });
}

function renderMatch() {
  return `
    <div class="match-label">🎯 Click an item on the left, then its partner on the right. Mistakes reduce your reward (but cost no hearts).</div>
    <div class="match-cols">
      <div class="match-col" id="match-left"></div>
      <div class="match-col" id="match-right"></div>
    </div>`;
}

function initMatch(q) {
  session.matchState = {
    left: shuffle(q.pairs.map((_, i) => i)),
    right: shuffle(q.pairs.map((_, i) => i)),
    selected: null, matched: new Set(), mistakes: 0
  };
  drawMatch(q);
}

function drawMatch(q) {
  const m = session.matchState;
  document.getElementById("match-left").innerHTML = m.left.map(i =>
    `<button class="match-item ${m.matched.has(i) ? "done" : ""} ${m.selected === i ? "sel" : ""}"
       onclick="matchLeft(${i})" ${m.matched.has(i) ? "disabled" : ""}><code>${esc(q.pairs[i][0])}</code></button>`).join("");
  document.getElementById("match-right").innerHTML = m.right.map(i =>
    `<button class="match-item ${m.matched.has(i) ? "done" : ""}"
       onclick="matchRight(${i})" ${m.matched.has(i) ? "disabled" : ""}>${esc(q.pairs[i][1])}</button>`).join("");
}

function matchLeft(i) {
  session.matchState.selected = i;
  drawMatch(currentQuestion());
}
function matchRight(i) {
  const q = currentQuestion();
  const m = session.matchState;
  if (m.selected === null) { toast("Pick an item on the left first"); return; }
  if (m.selected === i) {
    m.matched.add(i);
    m.selected = null;
    drawMatch(q);
    if (m.matched.size === q.pairs.length) {
      const perfect = m.mistakes === 0;
      resolve(true, {
        xp: perfect ? 15 : 8, heartSafe: true, breakCombo: !perfect,
        extra: perfect ? "🎯 Perfect matching — full reward!" : `${m.mistakes} mismatch${m.mistakes > 1 ? "es" : ""} — half reward, combo reset.`
      });
    }
  } else {
    m.mistakes++;
    m.selected = null;
    drawMatch(q);
    const el = document.querySelectorAll("#match-right .match-item")[m.right.indexOf(i)];
    if (el) { el.classList.add("shake"); setTimeout(() => el.classList.remove("shake"), 400); }
  }
}

function renderCode(q) {
  const testsHtml = q.tests.map((t, i) =>
    `<div class="test-row" id="test-${i}">
       <span class="test-status">•</span>
       <code>${esc(q.fnName)}(${t.args.map(a => esc(fmt(a))).join(", ")})</code>
       <span class="test-expect">→ ${esc(fmt(t.expect))}</span>
     </div>`).join("");
  return `
    <textarea class="editor" id="editor" spellcheck="false">${esc(q.starter)}</textarea>
    <div class="tests">${testsHtml}</div>
    <div class="code-btns">
      <button class="btn" onclick="runCode()">▶ Run tests</button>
      <button class="btn ghost" onclick="giveUpCode()">Show solution (−1 ❤️)</button>
    </div>
    <div class="run-output" id="run-output"></div>`;
}

function runCode() {
  const q = currentQuestion();
  const code = document.getElementById("editor").value;
  const out = document.getElementById("run-output");
  session.codeAttempts++;
  let fn;
  try {
    fn = new Function(`"use strict";\n${code}\nreturn ${q.fnName};`)();
    if (typeof fn !== "function") throw new Error(`${q.fnName} is not a function`);
  } catch (e) {
    out.innerHTML = `<div class="fb bad"><b class="verdict">💥 ${esc(e.name)}: ${esc(e.message)}</b>Fix the syntax and run again — attempts are free.</div>`;
    return;
  }
  let allPass = true;
  q.tests.forEach((t, i) => {
    const row = document.getElementById("test-" + i);
    const status = row.querySelector(".test-status");
    try {
      const result = fn(...JSON.parse(JSON.stringify(t.args)));
      const pass = deepEqual(result, t.expect);
      allPass = allPass && pass;
      status.textContent = pass ? "✅" : "❌";
      row.className = "test-row " + (pass ? "pass" : "fail");
      if (!pass) row.querySelector(".test-expect").innerHTML = `→ expected ${esc(fmt(t.expect))}, got <b>${esc(fmt(result))}</b>`;
    } catch (e) {
      allPass = false;
      status.textContent = "💥";
      row.className = "test-row fail";
      row.querySelector(".test-expect").innerHTML = `→ threw ${esc(e.name)}: ${esc(e.message)}`;
    }
  });
  if (allPass) {
    document.querySelector(".code-btns").style.display = "none";
    document.getElementById("editor").readOnly = true;
    out.innerHTML = "";
    unlock("hands_on");
    resolve(true, { xp: 20, extra: session.codeAttempts > 1 ? `Cracked it in ${session.codeAttempts} runs.` : "First try! ⚡" });
  } else {
    out.innerHTML = `<div class="fb bad" style="margin-top:12px"><b class="verdict">Not yet — check the failing tests above.</b>Attempts are free; experiment away.</div>`;
  }
}

function giveUpCode() {
  if (!confirm("Reveal the solution? Costs 1 ❤️ and earns no XP.")) return;
  const q = currentQuestion();
  document.querySelector(".code-btns").style.display = "none";
  document.getElementById("editor").readOnly = true;
  document.getElementById("run-output").innerHTML = "";
  resolve(false, { extra: `Here's one way:<pre class="code" style="margin-top:8px">${esc(q.solution)}</pre>` });
}

/* =====================================================================
   ANSWER HANDLERS (mc / fill / bug)
   ===================================================================== */
function answerMc(i) {
  const q = currentQuestion();
  document.querySelectorAll(".opt").forEach((b) => {
    const j = +b.dataset.i;
    b.disabled = true;
    if (j === q.a) b.classList.add("right");
    else if (j === i) b.classList.add("wrong");
  });
  resolve(i === q.a);
}

function answerFill() {
  const q = currentQuestion();
  const input = document.getElementById("fill-input");
  const val = input.value.trim();
  if (!val) return;
  input.disabled = true;
  const ok = q.a.some(ans => ans.toLowerCase() === val.toLowerCase());
  input.style.borderColor = ok ? "var(--green)" : "var(--red)";
  resolve(ok, { extra: ok ? null : `The answer was <code>${esc(q.a[0])}</code>.` });
}

function answerBug(i) {
  const q = currentQuestion();
  document.querySelectorAll(".code-line").forEach(l => l.onclick = null);
  const ok = i === q.a;
  document.getElementById("bugline-" + i).classList.add(ok ? "picked-right" : "picked-wrong");
  if (!ok) document.getElementById("bugline-" + q.a).classList.add("reveal-right");
  resolve(ok);
}

function submitMultifill() {
  const q = currentQuestion();
  const inputs = [...document.querySelectorAll(".mf-input")];
  if (inputs.some(inp => !inp.value.trim())) { toast("Fill in every blank first"); return; }
  let ok = true;
  inputs.forEach(inp => {
    const accepted = q.blanks[+inp.dataset.i];
    const good = accepted.some(a => a.toLowerCase() === inp.value.trim().toLowerCase());
    inp.classList.add(good ? "mf-right" : "mf-wrong");
    inp.disabled = true;
    if (!good) { ok = false; inp.title = "Answer: " + accepted[0]; }
  });
  document.querySelector(".q-card .btn.big").style.display = "none";
  const extra = ok ? null :
    "Answers: " + q.blanks.map((b, i) => `<code>${esc(b[0])}</code>`).join(", ") + ".";
  resolve(ok, { xp: 15, extra });
}

/* =====================================================================
   RESOLUTION, HEARTS, BOSS FLOW
   ===================================================================== */
function resolve(ok, opts = {}) {
  const s = session, q = currentQuestion();
  s.attempts++;
  let xp = 0, coins = 0, heartLost = false;

  if (ok) {
    s.correct++;
    if (opts.breakCombo) s.streak = 0; else s.streak++;
    if (s.phase === "boss") {
      s.bossHp--;
      xp = 25; coins = 5;
    } else {
      const base = opts.xp || 10;
      xp = base + Math.min(Math.max(s.streak - 1, 0), 5) * 2;
      coins = 2 + (s.streak >= 3 ? 1 : 0);
    }
    s.xpEarned += xp; s.coinsEarned += coins;
    gainXp(xp); gainCoins(coins);
    unlock("first_blood");
    if (s.streak >= 5) unlock("combo_5");
  } else {
    s.streak = 0;
    if (!opts.heartSafe) {
      s.hearts--;
      heartLost = true;
      if (s.hearts <= 0) s.dead = true;
    }
    if (s.phase === "boss") {
      // missed question goes to the back of the boss queue
      s.bossQueue.push(s.bossQueue.shift());
    }
  }

  const fb = document.getElementById("feedback");
  let btnLabel = "Continue →";
  if (s.dead) btnLabel = "💀 See what happened…";
  else if (s.phase === "boss") btnLabel = s.bossHp <= 0 ? "🏆 Claim victory →" : (ok ? "Next strike →" : "It counterattacks… →");
  else if (s.idx === s.queue.length - 1) btnLabel = s.mode === "gauntlet" ? "Finish →" : "⚔️ Face the boss →";

  const bossFx = s.phase === "boss"
    ? (ok ? `<b>💥 Direct hit!</b> ${s.world.boss.name} drops to ${s.bossHp}/${s.bossMaxHp} HP. `
          : `<b>${s.world.boss.icon} The boss strikes back!</b> That question will return… `)
    : "";

  fb.innerHTML = `
    <div class="fb ${ok ? "good" : "bad"}">
      <b class="verdict">${ok
        ? `✅ Correct! <span class="xp-gain">+${xp} XP</span> <span class="coin-gain">+${coins} 🪙</span>${s.streak >= 3 ? " · 🔥 combo ×" + s.streak : ""}`
        : `❌ Not quite.${heartLost ? ' <span class="heart-loss">−1 ❤️</span>' : ""}`}</b>
      ${bossFx}${opts.extra ? opts.extra + " " : ""}${q.why}
    </div>
    <button class="btn big" style="--wc:${questionColor(q)}" onclick="next()">${btnLabel}</button>`;
  updateHearts();
  fb.querySelector(".btn.big").focus();
}

function updateHearts() {
  const el = document.getElementById("hearts");
  if (el) el.textContent = "❤️".repeat(Math.max(session.hearts, 0)) + "🖤".repeat(session.maxHearts - Math.max(session.hearts, 0));
}

function next() {
  const s = session;
  if (s.dead) return showDefeat();
  if (s.phase === "boss") {
    if (s.bossHp <= 0) return showWorldResult(true);
    return renderQuestion();
  }
  s.idx++;
  s.codeAttempts = 0;
  if (s.idx >= s.queue.length) {
    if (s.mode === "gauntlet") return showGauntletResult();
    return showBossIntro();
  }
  renderQuestion();
}

/* ---------- items ---------- */
function buyPotion() {
  const s = session;
  if (save.coins < 15 || s.hearts >= s.maxHearts) return;
  gainCoins(-15);
  s.hearts++;
  updateHearts();
  toast("🧪 Glug… +1 ❤️");
  const btn = document.querySelector(".item-btn");
  if (btn && (save.coins < 15 || s.hearts >= s.maxHearts)) btn.disabled = true;
}

function buyFifty() {
  const s = session, q = currentQuestion();
  if (save.coins < 10 || q.type !== "mc" || s.fiftyUsed) return;
  const wrong = q.opts.map((_, i) => i).filter(i => i !== q.a);
  const removed = shuffle(wrong).slice(0, 2);
  document.querySelectorAll(".opt").forEach(b => {
    if (removed.includes(+b.dataset.i)) { b.disabled = true; b.classList.add("eliminated"); }
  });
  gainCoins(-10);
  s.fiftyUsed = true;
  document.getElementById("fifty-btn").disabled = true;
  toast("➗ Two wrong answers vanish");
}

/* =====================================================================
   BOSS INTRO, RESULTS, DEFEAT
   ===================================================================== */
function showBossIntro() {
  const s = session, b = s.world.boss;
  s.phase = "boss";
  s.bossQueue = [...b.questions];
  s.bossMaxHp = b.questions.length;
  s.bossHp = s.bossMaxHp;
  app.innerHTML = `
    <div class="boss-banner">
      <div class="b-icon">${b.icon}</div>
      <span class="boss-tag">BOSS BATTLE</span>
      <h2>${b.name}</h2>
      <p>${b.intro}</p>
      <p style="font-size:13px;color:var(--muted)">Each correct answer deals 1 damage (<b style="color:var(--gold)">+25 XP</b>, +5 🪙).
      Miss and you lose a heart — and the question returns. You have ${s.hearts} ❤️ left.</p>
      <button class="btn" style="--wc:${s.world.color}" onclick="renderQuestion()">Fight! ⚔️</button>
    </div>`;
}

function showWorldResult(bossWon) {
  const s = session, w = s.world;
  const pct = Math.round((s.correct / s.attempts) * 100);
  const stars = pct === 100 ? 3 : pct >= 75 ? 2 : 1;

  const ws = worldSave(w.id);
  ws.stars = Math.max(ws.stars, stars);
  ws.bestPct = Math.max(ws.bestPct, pct);
  if (bossWon) {
    ws.bossDefeated = true;
    unlock("boss_1");
    if (WORLDS.every(x => worldSave(x.id).bossDefeated)) unlock("all_bosses");
  }
  if (pct === 100) unlock("flawless");
  const bonus = 10 + (pct === 100 ? 10 : 0);
  gainCoins(bonus);
  persist();

  app.innerHTML = `
    <div class="result">
      <div class="r-icon">🏆</div>
      <h2>${w.boss.name} defeated!</h2>
      <div class="r-stars">${"★".repeat(stars)}<span class="off">${"★".repeat(3 - stars)}</span></div>
      <p>World conquered — the ${w.name} bows to you. <b style="color:var(--gold)">+${bonus} 🪙 victory bonus${pct === 100 ? " (flawless!)" : ""}</b></p>
      <div class="r-stats">
        <div class="r-stat"><b>${pct}%</b><span>accuracy</span></div>
        <div class="r-stat"><b style="color:var(--gold)">+${s.xpEarned}</b><span>XP</span></div>
        <div class="r-stat"><b>+${s.coinsEarned + bonus}</b><span>🪙 coins</span></div>
        <div class="r-stat"><b>${"❤️".repeat(s.hearts)}</b><span>hearts left</span></div>
      </div>
      <div class="r-btns">
        <button class="btn ghost" onclick="showMap()">World map</button>
        <button class="btn" style="--wc:${w.color}" onclick="startWorld('${w.id}')">Run it again</button>
      </div>
    </div>`;
}

function showDefeat() {
  const s = session, w = s.world;
  app.innerHTML = `
    <div class="result">
      <div class="r-icon">💀</div>
      <h2>Out of hearts!</h2>
      <p>${s.phase === "boss"
        ? `${w.boss.name} got you — it had ${s.bossHp} HP left. So close.`
        : `The ${w.name} claims another dev. The XP and coins you earned are yours to keep.`}</p>
      <div class="r-stats">
        <div class="r-stat"><b>${s.correct}/${s.attempts}</b><span>correct</span></div>
        <div class="r-stat"><b style="color:var(--gold)">+${s.xpEarned}</b><span>XP kept</span></div>
        <div class="r-stat"><b>+${s.coinsEarned}</b><span>🪙 kept</span></div>
      </div>
      <p style="font-size:13px">Tip: stockpile coins in easier worlds, then spend them on 🧪 potions in the hard ones.</p>
      <div class="r-btns">
        <button class="btn ghost" onclick="showMap()">World map</button>
        <button class="btn" style="--wc:${w.color}" onclick="${s.mode === "gauntlet" ? "startGauntlet()" : `startWorld('${w.id}')`}">⚔️ Try again</button>
      </div>
    </div>`;
}

function showGauntletResult() {
  const s = session;
  const pct = Math.round((s.correct / s.attempts) * 100);
  if (s.correct >= 8) unlock("gauntlet_ace");
  app.innerHTML = `
    <div class="result">
      <div class="r-icon">${s.correct >= 8 ? "🏅" : s.correct >= 5 ? "💪" : "📚"}</div>
      <h2>Gauntlet survived</h2>
      <p>${s.correct >= 8 ? "Sharp across the whole stack — interview-day form."
          : s.correct >= 5 ? "Solid. Revisit the worlds that stung."
          : "Rough run — dive back into individual worlds and come back."}</p>
      <div class="r-stats">
        <div class="r-stat"><b>${s.correct}/${s.queue.length}</b><span>correct</span></div>
        <div class="r-stat"><b>${pct}%</b><span>accuracy</span></div>
        <div class="r-stat"><b style="color:var(--gold)">+${s.xpEarned}</b><span>XP</span></div>
        <div class="r-stat"><b>+${s.coinsEarned}</b><span>🪙</span></div>
      </div>
      <div class="r-btns">
        <button class="btn ghost" onclick="showMap()">World map</button>
        <button class="btn" style="--wc:#8b5cf6" onclick="startGauntlet()">New gauntlet</button>
      </div>
    </div>`;
}

showMap();
