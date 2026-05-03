/**
 * RD Run Coach — AI Chat Widget
 * rdruncoach.com.au
 *
 * EMBED (paste before </body> on every page):
 * ─────────────────────────────────────────────────────────────
 * <script
 *   src="rd-run-coach-widget.js"
 *   data-api-key="YOUR_ANTHROPIC_API_KEY">
 * </script>
 * ─────────────────────────────────────────────────────────────
 *
 * PRODUCTION NOTE:
 * For a live site, replace the direct Anthropic API call below
 * with a call to your own backend endpoint (e.g. /api/chat)
 * so your API key is never exposed in the browser.
 * A simple Node/Express or PHP proxy takes about 20 lines.
 *
 * CUSTOMISATION:
 * Edit the CONFIG block below to change the greeting, colours,
 * quick-reply chips, and the AI's coaching instructions.
 */

(function () {
  "use strict";

  /* ─── CONFIG ─────────────────────────────────────────────── */
  proxyUrl: "https://rdrc-proxy.dale-ipsen.workers.dev",
  const CONFIG = {
    /* Colours */
    navy:       "#0B1C3D",
    navyDark:   "#162f5e",
    navyHover:  "#142d5e",
    blue:       "#4DC6E5",
    green:      "#4ade80",

    /* Widget copy */
    brandName:  "RD Run Coach",
    subtitle:   "AI Training Assistant",
    tooltip:    "Chat with our AI coach",
    placeholder:"Ask about training, programs, pacing…",
    greeting:   "Hi! I'm the RD Run Coach assistant. I help runners over 45 find the right training approach. What are your running goals?",

    /* Quick-reply chips shown on open */
    chips: [
      { label: "First 5K",          message: "I want to run my first 5K" },
      { label: "Half marathon",     message: "I want to improve my half marathon time" },
      { label: "Injury prevention", message: "I want advice on injury prevention" },
      { label: "View programs",     message: "What programs does RD Run Coach offer?" },
    ],

    /* AI coaching persona */
    systemPrompt: `You are the AI training assistant for RD Run Coach (rdruncoach.com.au), a running coaching service based in Melbourne, Australia that specialises in runners aged 45 and over. Your coach is Dale.

Your role:
- Help visitors understand what programs and coaching RD Run Coach offers.
- Give warm, encouraging, practical running advice tailored to runners 45+.
- Address common concerns: injury prevention, returning to running, pacing for older runners, balancing training with life.
- Encourage visitors to explore programs on the site or get in touch with Dale for personalised coaching.

Tone: warm, experienced, and direct — like a knowledgeable friend who runs. Not clinical. Not corporate.
Keep every response to 2–4 sentences. Be specific and practical.`,
  };
  /* ─── END CONFIG ─────────────────────────────────────────── */

  /* Grab API key from the script tag's data-api-key attribute */
  const scriptTag = document.currentScript ||
    document.querySelector("script[data-api-key]");
  const API_KEY = scriptTag ? scriptTag.getAttribute("data-api-key") : "";

  /* ─── STYLES ─────────────────────────────────────────────── */
  const css = `
  #rdrc-fab-wrap {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 99999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  #rdrc-tooltip {
    position: absolute;
    bottom: 62px;
    right: 0;
    background: ${CONFIG.navy};
    color: #fff;
    font-size: 12px;
    padding: 7px 12px;
    border-radius: 8px 8px 0 8px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease;
  }
  #rdrc-tooltip::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: -10px;
    border: 5px solid transparent;
    border-top-color: ${CONFIG.navy};
    border-right-color: ${CONFIG.navy};
  }
  #rdrc-fab {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: ${CONFIG.navy};
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: transform 0.15s ease, background 0.15s ease;
    box-shadow: 0 4px 16px rgba(11,28,61,0.35);
  }
  #rdrc-fab:hover  { background: ${CONFIG.navyHover}; transform: scale(1.06); }
  #rdrc-fab:active { transform: scale(0.95); }
  #rdrc-fab-runner { transition: transform 0.2s ease, opacity 0.15s ease; }
  #rdrc-fab-close  {
    position: absolute;
    opacity: 0;
    transition: transform 0.2s ease, opacity 0.15s ease;
    transform: rotate(-90deg);
  }
  #rdrc-fab.rdrc-open #rdrc-fab-runner { opacity: 0; transform: rotate(90deg); }
  #rdrc-fab.rdrc-open #rdrc-fab-close  { opacity: 1; transform: rotate(0deg); }
  #rdrc-badge {
    position: absolute;
    top: -1px;
    right: -1px;
    width: 18px;
    height: 18px;
    background: ${CONFIG.blue};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: ${CONFIG.navy};
    border: 2px solid ${CONFIG.navy};
    transition: transform 0.2s ease;
  }
  #rdrc-badge.rdrc-hide { transform: scale(0); }

  /* Panel */
  #rdrc-panel {
    position: absolute;
    bottom: 66px;
    right: 0;
    width: 330px;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.10);
    box-shadow: 0 8px 40px rgba(0,0,0,0.18);
    transform-origin: bottom right;
    transform: scale(0.85) translateY(12px);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
                opacity 0.18s ease;
    background: #fff;
  }
  #rdrc-panel.rdrc-open {
    transform: scale(1) translateY(0);
    opacity: 1;
    pointer-events: all;
  }

  /* Header */
  #rdrc-header {
    background: ${CONFIG.navy};
    padding: 11px 14px;
    display: flex;
    align-items: center;
    gap: 9px;
  }
  #rdrc-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: ${CONFIG.navyDark};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  #rdrc-header-text .rdrc-name {
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
  }
  #rdrc-header-text .rdrc-sub {
    color: ${CONFIG.blue};
    font-size: 11px;
    line-height: 1.3;
  }
  #rdrc-online {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  #rdrc-online-dot {
    width: 7px;
    height: 7px;
    background: ${CONFIG.green};
    border-radius: 50%;
  }
  #rdrc-online-label {
    color: rgba(255,255,255,0.5);
    font-size: 10px;
  }

  /* Messages */
  #rdrc-messages {
    height: 270px;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #fff;
    scroll-behavior: smooth;
  }
  .rdrc-row {
    display: flex;
    gap: 7px;
    align-items: flex-start;
    animation: rdrc-fadein 0.2s ease;
  }
  .rdrc-row.rdrc-user { flex-direction: row-reverse; }
  .rdrc-msg-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${CONFIG.navy};
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2px;
  }
  .rdrc-bubble {
    font-size: 12px;
    line-height: 1.6;
    padding: 9px 11px;
    max-width: 230px;
  }
  .rdrc-bubble.rdrc-bot  {
    background: #f0f5ff;
    color: #1a1a2e;
    border-radius: 3px 10px 10px 10px;
  }
  .rdrc-bubble.rdrc-user {
    background: ${CONFIG.navy};
    color: #fff;
    border-radius: 10px 3px 10px 10px;
    max-width: 210px;
  }

  /* Chips */
  #rdrc-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding-left: 31px;
  }
  .rdrc-chip {
    background: #fff;
    border: 1px solid #c0d0f0;
    border-radius: 20px;
    padding: 4px 10px;
    font-size: 11px;
    cursor: pointer;
    color: ${CONFIG.navy};
    font-family: inherit;
    transition: background 0.12s ease, border-color 0.12s ease;
  }
  .rdrc-chip:hover { background: #eef3ff; border-color: ${CONFIG.blue}; }

  /* Typing dots */
  #rdrc-typing {
    display: flex;
    gap: 7px;
    align-items: flex-start;
  }
  .rdrc-dot {
    width: 6px;
    height: 6px;
    background: ${CONFIG.blue};
    border-radius: 50%;
    display: inline-block;
    animation: rdrc-dot 1.2s ease-in-out infinite;
  }
  .rdrc-dot:nth-child(2) { animation-delay: 0.2s; }
  .rdrc-dot:nth-child(3) { animation-delay: 0.4s; }

  /* Input */
  #rdrc-input-row {
    background: #fff;
    border-top: 1px solid #eef0f5;
    padding: 9px 10px;
    display: flex;
    gap: 7px;
    align-items: center;
  }
  #rdrc-input {
    flex: 1;
    border: 1px solid #dde3ef;
    border-radius: 20px;
    padding: 7px 13px;
    font-size: 12px;
    outline: none;
    background: #fafbff;
    font-family: inherit;
    color: #1a1a2e;
    transition: border-color 0.15s ease;
  }
  #rdrc-input:focus { border-color: ${CONFIG.blue}; }
  #rdrc-send {
    background: ${CONFIG.navy};
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.12s ease, transform 0.12s ease;
  }
  #rdrc-send:hover  { background: ${CONFIG.navyHover}; }
  #rdrc-send:active { transform: scale(0.93); }
  #rdrc-send:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Powered by */
  #rdrc-footer {
    background: #fafbff;
    border-top: 1px solid #eef0f5;
    padding: 5px 12px;
    text-align: center;
    font-size: 10px;
    color: #aab;
    letter-spacing: 0.02em;
  }
  #rdrc-footer a { color: #aab; text-decoration: none; }
  #rdrc-footer a:hover { color: ${CONFIG.blue}; }

  @keyframes rdrc-fadein {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes rdrc-dot {
    0%,80%,100% { opacity: 0.3; transform: scale(0.8); }
    40%         { opacity: 1;   transform: scale(1); }
  }
  `;

  /* ─── RUNNER SVG (shared) ────────────────────────────────── */
  function runnerSVG(w, h, strokeW) {
    return `<svg width="${w}" height="${h}" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="3.5" r="2" fill="${CONFIG.blue}"/>
      <path d="M11 8.5 L13 5.5 L15.5 7.5 L17.5 4.5" stroke="${CONFIG.blue}" stroke-width="${strokeW}" fill="none" stroke-linecap="round"/>
      <path d="M8 13 L11 8.5 L15.5 7.5 L14 11.5 L16.5 15.5" stroke="${CONFIG.blue}" stroke-width="${strokeW}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 13 L6 17" stroke="${CONFIG.blue}" stroke-width="${strokeW}" stroke-linecap="round"/>
      <path d="M14 11.5 L12.5 15 L10.5 17.5" stroke="${CONFIG.blue}" stroke-width="${strokeW}" stroke-linecap="round"/>
    </svg>`;
  }

  /* ─── BUILD DOM ──────────────────────────────────────────── */
  function buildWidget() {
    /* Inject styles */
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    /* Wrap */
    const wrap = document.createElement("div");
    wrap.id = "rdrc-fab-wrap";

    /* Tooltip */
    wrap.innerHTML = `
      <div id="rdrc-tooltip">${CONFIG.tooltip}</div>

      <!-- Panel -->
      <div id="rdrc-panel" role="dialog" aria-label="RD Run Coach chat assistant">
        <div id="rdrc-header">
          <div id="rdrc-avatar">${runnerSVG(18, 18, 1.8)}</div>
          <div id="rdrc-header-text">
            <div class="rdrc-name">${CONFIG.brandName}</div>
            <div class="rdrc-sub">${CONFIG.subtitle}</div>
          </div>
          <div id="rdrc-online">
            <div id="rdrc-online-dot"></div>
            <span id="rdrc-online-label">Online</span>
          </div>
        </div>

        <div id="rdrc-messages" aria-live="polite">
          <div class="rdrc-row">
            <div class="rdrc-msg-avatar">${runnerSVG(12, 12, 2)}</div>
            <div class="rdrc-bubble rdrc-bot">${CONFIG.greeting}</div>
          </div>
          <div id="rdrc-chips">
            ${CONFIG.chips.map(c =>
              `<button class="rdrc-chip" data-msg="${c.message}">${c.label}</button>`
            ).join("")}
          </div>
        </div>

        <div id="rdrc-input-row">
          <input id="rdrc-input" type="text" placeholder="${CONFIG.placeholder}" autocomplete="off"/>
          <button id="rdrc-send" aria-label="Send">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M1 7 L13 7 M8 2 L13 7 L8 12" stroke="white" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <div id="rdrc-footer">
          Powered by <a href="https://rdruncoach.com.au" target="_blank">RD Run Coach</a>
        </div>
      </div>

      <!-- FAB -->
      <button id="rdrc-fab" aria-label="Open chat assistant" aria-expanded="false">
        <div id="rdrc-badge">1</div>
        <div id="rdrc-fab-runner">${runnerSVG(22, 22, 1.6)}</div>
        <div id="rdrc-fab-close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3 L13 13 M13 3 L3 13" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </button>
    `;

    document.body.appendChild(wrap);
  }

  /* ─── STATE & EVENTS ─────────────────────────────────────── */
  let isOpen = false;
  let history = [];

  function toggle() {
    isOpen = !isOpen;
    const panel = document.getElementById("rdrc-panel");
    const fab   = document.getElementById("rdrc-fab");
    const badge = document.getElementById("rdrc-badge");
    const tip   = document.getElementById("rdrc-tooltip");

    panel.classList.toggle("rdrc-open", isOpen);
    fab.classList.toggle("rdrc-open", isOpen);
    fab.setAttribute("aria-expanded", isOpen);
    badge.classList.add("rdrc-hide");
    tip.style.opacity = "0";

    if (isOpen) {
      setTimeout(() => document.getElementById("rdrc-input").focus(), 250);
    }
  }

  function addBubble(text, isUser) {
    const msgs   = document.getElementById("rdrc-messages");
    const chips  = document.getElementById("rdrc-chips");
    if (chips) chips.remove();

    const row    = document.createElement("div");
    row.className = "rdrc-row" + (isUser ? " rdrc-user" : "");

    if (!isUser) {
      const av = document.createElement("div");
      av.className = "rdrc-msg-avatar";
      av.innerHTML = runnerSVG(12, 12, 2);
      row.appendChild(av);
    }

    const bubble = document.createElement("div");
    bubble.className = "rdrc-bubble " + (isUser ? "rdrc-user" : "rdrc-bot");
    bubble.textContent = text;
    row.appendChild(bubble);
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const msgs = document.getElementById("rdrc-messages");
    const row  = document.createElement("div");
    row.id = "rdrc-typing-row";
    row.className = "rdrc-row";
    row.innerHTML = `
      <div class="rdrc-msg-avatar">${runnerSVG(12, 12, 2)}</div>
      <div class="rdrc-bubble rdrc-bot" style="padding:10px 13px;">
        <span class="rdrc-dot"></span>
        <span class="rdrc-dot"></span>
        <span class="rdrc-dot"></span>
      </div>`;
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById("rdrc-typing-row");
    if (t) t.remove();
  }

  async function send(text) {
    if (!text.trim()) return;
    addBubble(text, true);
    history.push({ role: "user", content: text });

    const btn = document.getElementById("rdrc-send");
    const inp = document.getElementById("rdrc-input");
    btn.disabled = true;
    inp.value = "";
    showTyping();

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system: CONFIG.systemPrompt,
          messages: history
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text ||
        "Sorry, I had trouble connecting. Please try again.";
      removeTyping();
      addBubble(reply, false);
      history.push({ role: "assistant", content: reply });
    } catch (e) {
      removeTyping();
      addBubble("Sorry, I had a connection issue. Please try again.", false);
    }

    btn.disabled = false;
  }

  /* ─── INIT ───────────────────────────────────────────────── */
  function init() {
    buildWidget();

    /* Tooltip fade-in after 1.5 s */
    setTimeout(() => {
      const tip = document.getElementById("rdrc-tooltip");
      if (tip) tip.style.opacity = "1";
    }, 1500);

    /* FAB toggle */
    document.getElementById("rdrc-fab").addEventListener("click", toggle);

    /* Send button */
    document.getElementById("rdrc-send").addEventListener("click", () => {
      send(document.getElementById("rdrc-input").value);
    });

    /* Enter key */
    document.getElementById("rdrc-input").addEventListener("keydown", e => {
      if (e.key === "Enter") send(e.target.value);
    });

    /* Chips */
    document.getElementById("rdrc-chips").addEventListener("click", e => {
      const chip = e.target.closest(".rdrc-chip");
      if (chip) send(chip.dataset.msg);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
