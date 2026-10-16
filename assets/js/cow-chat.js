/* Cow chat: a tiny chat widget where the cow only ever says "moo".
   Nothing is saved or sent anywhere. */
(function () {
  var MAX_LEN = 500;

  var css = `
  .cc-root{--cc-bg:#fff;--cc-fg:#222;--cc-muted:#777;--cc-line:#e5e5e5;--cc-soft:#f6f7f9;--cc-accent:#043361;--cc-accent-fg:#fff;--cc-blush:#f4b6c4;
    position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:9999;font:inherit;font-size:15px}
  @media (prefers-color-scheme:dark){.cc-root{--cc-bg:#262833;--cc-fg:#dadbdf;--cc-muted:#9a9cab;--cc-line:#3a3d4d;--cc-soft:#2c2f3b;--cc-accent:#3eb7f0;--cc-accent-fg:#20212b;--cc-blush:#c98a9a}}
  .cc-toggle{width:58px;height:58px;border-radius:50%;border:1px solid var(--cc-line);background:var(--cc-bg);color:var(--cc-accent);cursor:pointer;
    box-shadow:0 3px 12px rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center;padding:0;transition:transform .2s,box-shadow .2s}
  .cc-toggle svg{width:38px;height:38px;transition:transform .3s}
  .cc-toggle:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.16)}
  .cc-toggle:hover svg{animation:cc-wiggle .6s ease-in-out}
  @keyframes cc-wiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-10deg)}75%{transform:rotate(8deg)}}
  .cc-toggle:focus-visible,.cc-send:focus-visible,.cc-close:focus-visible{outline:3px solid var(--cc-fg);outline-offset:2px}
  .cc-panel{position:absolute;right:0;bottom:70px;width:min(360px,calc(100vw - 40px));height:min(480px,calc(100vh - 120px));
    background:var(--cc-bg);color:var(--cc-fg);border:1px solid var(--cc-line);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.2);
    display:none;flex-direction:column;overflow:hidden}
  .cc-root.cc-open .cc-panel{display:flex}
  .cc-head{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--cc-line);font-weight:bold;background:var(--cc-soft);color:var(--cc-accent)}
  .cc-head svg{width:24px;height:24px;flex-shrink:0}
  .cc-head span{flex:1}
  .cc-close{background:none;border:none;color:var(--cc-muted);font-size:20px;cursor:pointer;line-height:1;padding:2px 6px;border-radius:6px}
  .cc-log{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
  .cc-msg{max-width:80%;padding:8px 12px;border-radius:16px;line-height:1.35;word-wrap:break-word;white-space:pre-wrap}
  .cc-me{align-self:flex-end;background:var(--cc-accent);color:var(--cc-accent-fg);border-bottom-right-radius:4px}
  .cc-cow{align-self:flex-start;background:var(--cc-cow);border-bottom-left-radius:4px}
  .cc-msg,.cc-ascii{flex-shrink:0}
  .cc-ascii{align-self:flex-start;max-width:100%;overflow-x:auto;margin:0;padding:2px 0;
    font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;line-height:1.25;color:var(--cc-fg);background:none}
  .cc-bellnote{flex-shrink:0;align-self:center;font-size:12px;color:var(--cc-muted);padding:2px 8px;text-align:center}
  .cc-root pre.cc-ascii{border:none;border-radius:0;box-shadow:none;background:none;padding:2px 0;max-width:100%}
  .cc-ascii.cc-thinking{color:var(--cc-muted)}
  .cc-form{display:flex;gap:8px;padding:10px;border-top:1px solid var(--cc-line)}
  .cc-input{flex:1;min-width:0;border:1px solid var(--cc-line);border-radius:20px;padding:8px 14px;background:var(--cc-bg);color:var(--cc-fg);font:inherit}
  .cc-input:focus{outline:2px solid var(--cc-accent);outline-offset:0}
  .cc-send{border:none;border-radius:20px;padding:0 14px;background:var(--cc-accent);color:var(--cc-accent-fg);font:inherit;cursor:pointer}
  @media (prefers-reduced-motion:reduce){.cc-toggle,.cc-toggle svg{transition:none;animation:none!important}}
  `;

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // Cute line-drawn cow face; uses the theme colour via currentColor.
  var COW_LOGO =
    '<svg viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12.5 10.5 Q10 7 11.5 4.5 Q14 7.5 15.5 9"/>' +
      '<path d="M27.5 10.5 Q30 7 28.5 4.5 Q26 7.5 24.5 9"/>' +
      '<path d="M10.5 14 Q5 11.5 3 14 Q5.5 17.5 10.5 16.5"/>' +
      '<path d="M29.5 14 Q35 11.5 37 14 Q34.5 17.5 29.5 16.5"/>' +
      '<path d="M10.5 25 Q9 18 11 13 Q14 8.5 20 8.5 Q26 8.5 29 13 Q31 18 29.5 25"/>' +
      '<path d="M15.5 9.2 Q13.5 12.5 15 15 Q17.5 15.5 18.5 12.5 Q19 10 18 8.6" fill="currentColor" stroke-width="1.2"/>' +
      '<rect x="10" y="23" width="20" height="12" rx="6" fill="var(--cc-blush)" stroke="currentColor"/>' +
      '<circle cx="16" cy="29" r="1.1" fill="currentColor" stroke="none"/>' +
      '<circle cx="24" cy="29" r="1.1" fill="currentColor" stroke="none"/>' +
      '<circle cx="15.2" cy="18.8" r="1.4" fill="currentColor" stroke="none"/>' +
      '<circle cx="24.8" cy="18.8" r="1.4" fill="currentColor" stroke="none"/>' +
    '</svg>';

  var root = document.createElement("div");
  root.className = "cc-root";
  root.innerHTML =
    '<div class="cc-panel" role="dialog" aria-label="Chat with cow">' +
      '<div class="cc-head">' + COW_LOGO + '<span>Chat with cow</span>' +
        '<button class="cc-close" aria-label="Close chat">\u00D7</button></div>' +
      '<div class="cc-log" aria-live="polite"></div>' +
      '<form class="cc-form">' +
        '<input class="cc-input" type="text" maxlength="' + MAX_LEN + '" placeholder="Say something\u2026" aria-label="Your message" autocomplete="off">' +
        '<button class="cc-send" type="submit">Send</button>' +
      '</form>' +
          '</div>' +
    '<button class="cc-toggle" aria-label="Open chat with cow" aria-expanded="false">' + COW_LOGO + '</button>';
  document.body.appendChild(root);

  var toggle = root.querySelector(".cc-toggle");
  var closeBtn = root.querySelector(".cc-close");
  var log = root.querySelector(".cc-log");
  var form = root.querySelector(".cc-form");
  var input = root.querySelector(".cc-input");
  var greeted = false;

  function add(text, who) {
    var m = document.createElement("div");
    m.className = "cc-msg " + (who === "me" ? "cc-me" : "cc-cow");
    m.textContent = text;
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }

  var turns = 0;          // how many messages the visitor has sent
  var BELL_AFTER = 5;     // the cow earns a bell after this many turns
  var bellRung = false;

  var WRAP = 20;  // max characters per line inside the bubble

  function wrap(text) {
    var lines = [], line = "";
    text.split(/\s+/).forEach(function (word) {
      while (word.length > WRAP) {            // break very long words (like long moos)
        if (line) { lines.push(line); line = ""; }
        lines.push(word.slice(0, WRAP));
        word = word.slice(WRAP);
      }
      if (!word) return;
      if ((line + " " + word).trim().length > WRAP) { lines.push(line); line = word; }
      else line = (line + " " + word).trim();
    });
    if (line || !lines.length) lines.push(line);
    return lines;
  }

  // Mirrored cowsay: the cow stands on the left and speaks to the right.
  function cowArt(text, thinking, bell) {
    var lines = wrap(text);
    var w = Math.max.apply(null, lines.map(function (l) { return l.length; }));
    var pad = "                    "; // bubble starts to the right of the cow
    var out = [pad + " " + "_".repeat(w + 2)];
    lines.forEach(function (l, i) {
      var body = l + " ".repeat(w - l.length);
      var L, R;
      if (thinking) { L = "("; R = ")"; }
      else if (lines.length === 1) { L = "<"; R = ">"; }
      else if (i === 0) { L = "/"; R = "\\"; }
      else if (i === lines.length - 1) { L = "\\"; R = "/"; }
      else { L = "|"; R = "|"; }
      out.push(pad + L + " " + body + " " + R);
    });
    out.push(pad + " " + "-".repeat(w + 2));
    var c = thinking ? "o" : "/";
    out.push("            ^__^   " + c);
    out.push("    _______/(oo)  " + c);
    out.push("/\\/(       /(__)");
    out.push("   | w----|| " + (bell || ""));
    out.push("   ||     ||");
    return out.join("\n");
  }

  // Longer messages earn longer moos. Questions get "?", excitement gets "!".
  function makeMoo(msg) {
    var len = msg.length;
    var os = Math.min(2 + Math.round(len / 6), 18);
    var bangs = Math.min(1 + Math.floor(len / 40) + (msg.match(/!/g) || []).length, 6);
    var moo = "m" + "o".repeat(os);
    var end = /\?\s*$/.test(msg) ? "?" + "!".repeat(bangs - 1) : "!".repeat(bangs);
    var letters = msg.replace(/[^a-zA-Z]/g, "");
    if (letters.length >= 3 && letters === letters.toUpperCase()) moo = moo.toUpperCase();
    return moo + end;
  }

  // Easter egg: speak cow, and the cow answers in human.
  var HUMAN = [
    "what's up?",
    "howdy!",
    "nice day for grazing, huh?",
    "wanna share some hay?"
  ];
  var lastHuman = -1;
  var spokeCow = false;   // the first moo always gets "you speak cow?!"

  // Counts as cow if, ignoring punctuation, emoji and spaces, it's only moos:
  // "moo", "MOOO!!", "moo moo", "mooo?! :)", "moo~ 🐄" all count.
  function isMoo(msg) {
    var letters = msg.replace(/[^a-z]/gi, "");
    return /^(m+o+)+$/i.test(letters);
  }

  function humanReply() {
    var i;
    do { i = Math.floor(Math.random() * HUMAN.length); } while (HUMAN.length > 1 && i === lastHuman);
    lastHuman = i;
    return HUMAN[i];
  }

  // "why cow?", "why you?", "why is there a cow here" -> the real answer.
  function asksWhy(msg) {
    var m = msg.toLowerCase();
    if (!/\bwhy\b/.test(m)) return false;
    if (/\b(cows?|moo+)\b/.test(m)) return true;                       // mentions the cow
    return /\b(you|u)\b/.test(m) && m.trim().split(/\s+/).length <= 4;  // short "why you?"
  }

  function reply(msg) {
    if (!msg) return "moo!";
    if (asksWhy(msg)) return "because kirti loves cows!";
    if (!isMoo(msg)) return makeMoo(msg);
    if (!spokeCow) { spokeCow = true; return "you speak cow?!"; }
    return humanReply();
  }

  // The cow thinks for a moment (longer for longer messages), then moos.
  function cowSays(msg) {
    var pre = document.createElement("pre");
    pre.className = "cc-ascii cc-thinking";
    pre.setAttribute("aria-label", "The cow is thinking");
    log.appendChild(pre);
    var dots = ["   ", ".  ", ".. ", "..."], i = 0;
    var bell = turns > BELL_AFTER ? "(@)" : null;
    pre.textContent = cowArt(dots[0], true, bell);
    var tick = setInterval(function () {
      i = (i + 1) % dots.length;
      pre.textContent = cowArt(dots[i], true, bell);
    }, 300);
    log.scrollTop = log.scrollHeight;

    var think = Math.min(700 + (msg || "").length * 25, 3200) + Math.random() * 400;
    setTimeout(function () {
      clearInterval(tick);
      var moo = reply(msg);
      pre.className = "cc-ascii";
      pre.setAttribute("aria-label", "The cow says " + moo);
      pre.textContent = cowArt(moo, false, bell);
      log.scrollTop = log.scrollHeight;
      if (bell && !bellRung) { bellRung = true; ring(pre, moo); }
    }, think);
  }

  // The first time the bell appears, it swings and dings.
  function ring(pre, moo) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var note = document.createElement("div");
    note.className = "cc-bellnote";
    note.textContent = "\uD83D\uDD14 You talked long enough to earn the cow a bell!";
    if (reduce) { log.appendChild(note); log.scrollTop = log.scrollHeight; return; }
    var frames = ["(@)", "/@/", "(@)", "\\@\\"], f = 0, n = 0;
    var swing = setInterval(function () {
      f = (f + 1) % frames.length;
      pre.textContent = cowArt(moo, false, frames[f]);
      if (++n >= 12) {
        clearInterval(swing);
        pre.textContent = cowArt(moo, false, "(@)");
        log.appendChild(note);
        log.scrollTop = log.scrollHeight;
      }
    }, 140);
  }

  function setOpen(open) {
    root.classList.toggle("cc-open", open);
    toggle.setAttribute("aria-expanded", open);
    if (open) {
      if (!greeted) { greeted = true; cowSays(""); }
      input.focus();
    } else {
      toggle.focus();
    }
  }

  toggle.addEventListener("click", function () { setOpen(!root.classList.contains("cc-open")); });
  closeBtn.addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && root.classList.contains("cc-open")) setOpen(false);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim().slice(0, MAX_LEN);
    if (!text) return;
    turns++;
    add(text, "me");
    input.value = "";
    cowSays(text);
  });
})();