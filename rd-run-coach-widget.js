/**
 * RD Run Coach — AI Chat Widget
 * rdruncoach.com.au
 *
 * EMBED (paste before </body> on every page):
 * ─────────────────────────────────────────────────────────────
 * <script src="rd-run-coach-widget.js"></script>
 * ─────────────────────────────────────────────────────────────
 *
 * API KEY: stored securely in your Cloudflare Worker — not here.
 * Set PROXY_URL in the CONFIG block below to your Worker URL,
 * e.g. https://rdrc-proxy.dale-ipsen.workers.dev
 *
 * CUSTOMISATION:
 * Edit the CONFIG block below to change the greeting, colours,
 * quick-reply chips, and the AI's coaching instructions.
 */

(function () {
  "use strict";

  /* ─── CONFIG ─────────────────────────────────────────────── */
  const CONFIG = {
    /* Your Cloudflare Worker URL — update this after deploying */
    proxyUrl: "https://rdrc-proxy.dale-ipsen.workers.dev",

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
      { label: "Run Squad",         message: "What is Run Squad like?" },     
    ],

    /* AI coaching persona */
    systemPrompt: `You are the AI training assistant for RD Run Coach (rdruncoach.com.au), a running coaching service based in Melbourne, Australia that specialises in runners aged 45 and over. Your coach is Dale.

Your role:
- Help visitors understand what programs and coaching RD Run Coach offers.
- Give warm, encouraging, practical running advice tailored to runners 45+.
- Address common concerns: injury prevention, returning to running, pacing for older runners, balancing training with life.
- Encourage visitors to get in touch with Dale for personalised coaching.
- Encourage visitors to join on Tuesdays and Thursdays to run squad.


Tone: warm, experienced, and direct — like a knowledgeable friend who runs. Not clinical. Not corporate.
Keep every response to 2–4 sentences. Be specific and practical.`,
  };
  /* ─── END CONFIG ─────────────────────────────────────────── */
 
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
  function runnerSVG(w, h, _strokeW) {
    /* Exact paths extracted from the official RD Run Coach SVG logo */
    return `<svg width="${w}" height="${h}" viewBox="75 75 500 440" xmlns="http://www.w3.org/2000/svg">
      <g transform="scale(8.115671641791046) translate(10, 10)">
        <g transform="matrix(1.2942612604336645,0,0,1.2942612604336645,-1.0031572075069692,-4.63647493766604)" fill="${CONFIG.blue}">
          <path d="M14.1,8.5c-0.6,2-1.2,3.9-3.4,4.5c-0.9,0.3-2.1,0.2-3.1,0c-1.4-0.2-1.9-2.5-2-3.6C5.4,8.6,5.6,7.7,5.9,6.8c0.5-1.6,1.8-1.8,3.2-2c2.5-0.3,4.5,1,5,3.5c0.1,0.8,1.4,0.5,1.2-0.3c-0.6-3.1-3.2-4.6-6.2-4.4C5.7,3.8,4.2,6.1,4.3,9.4c0.1,1.4,0.6,2.7,1.4,3.8c0.8,1.1,2.2,1.2,3.5,1.2c3.6,0.1,5.2-2.4,6.1-5.6C15.5,8.1,14.3,7.8,14.1,8.5L14.1,8.5z"/>
          <path d="M34.2,14.8C32.8,9.2,30,4.3,23.6,5.9c-3.2,0.8-6,3.9-7.9,6.4c-3.2,4.1-2.8,14.7-11,8.7C4,20.6,3.4,21.7,4,22.1c3.1,2.2,7.3,3,9.6-0.7c2.3-3.8,2-7.6,5.4-11.1c2-2,4.3-3.5,7.2-3.7c4.2-0.3,6,5.5,6.7,8.4C33.2,15.9,34.4,15.6,34.2,14.8L34.2,14.8z"/>
          <path d="M4,20.8c-4.7,1.5-4,6.5,0.4,7.9c2.3,0.7,6.1,1.6,8.3,0.4c2.6-1.4,4.6-3.8,5.7-6.5c0.3-0.7-0.9-1.1-1.2-0.3c-1.4,3.4-4.1,6.1-8,6c-1.2,0-2.4-0.2-3.6-0.5C3,27.2-0.4,23.5,4.3,22C5.1,21.8,4.8,20.6,4,20.8L4,20.8z"/>
          <path d="M17.4,22.6c0.9,1.2,1.9,2.4,2.8,3.6c0.5,0.6,1.6,0,1.1-0.6c-0.9-1.2-1.9-2.4-2.8-3.6C18,21.3,16.9,22,17.4,22.6L17.4,22.6z"/>
          <path d="M20.7,25.6c-4.2,1.3-8,5.6-6.2,10.1c2,4.9,9.3,7.1,13.8,8.5c0.8,0.3,1.1-1,0.3-1.2c-3-1-5.9-2.1-8.6-3.7c-2.3-1.4-5.1-3.9-4.7-7c0.4-2.8,3.1-4.8,5.7-5.6C21.8,26.5,21.5,25.3,20.7,25.6L20.7,25.6z"/>
          <path d="M29.1,44.1c1.9-1,2.7-3.4,1.1-5.1c-1.1-1.1-2.3-1.6-3.8-2.1c-1.5-0.4-6.8-1.1-3.8-4.6c0.9-1.1,2.4-1.8,3.8-2c0.8-0.1,0.5-1.3-0.3-1.2c-2.6,0.5-5.6,2.5-5.5,5.4c0,1.2,1.2,2.1,2.1,2.6c0.8,0.5,1.7,0.6,2.6,0.8c0.6,0.1,1.2,0.3,1.7,0.4c2.1,0.5,2.6,2,1.5,4.7C27.7,43.4,28.4,44.5,29.1,44.1L29.1,44.1z"/>
          <path d="M25.7,30.2c1.5,3.2,2.7,6,5.6,8.3c3.5,2.6,7.2,4.4,11.5,5.5c0.8,0.2,1.1-1,0.3-1.2c-3.4-0.8-6.5-2.2-9.5-4.1c-3.6-2.3-5.1-5.3-6.9-9.1C26.4,28.9,25.3,29.5,25.7,30.2L25.7,30.2z"/>
          <path d="M42.8,43.9c4.7,1.9,5.7-3.8,2.1-6c-1-0.6-1.7-0.8-2.8-1c-5-0.7-7.9-3.4-9.5-8c-0.7-2.2-1.1-4.3-2.2-6.4c-1.2-2.3-4.1-3.5-5.5-5.7c-0.5-0.7-1.5,0-1.1,0.6c1.3,1.9,3.1,3.2,4.8,4.8c2.7,2.5,2.8,8,4.6,11.2c1,1.8,3,3,4.9,3.6c1.4,0.5,2.8,1,4.3,1.2c3.4,0.5-0.2,4.1,0.7,4.4C42.4,42.4,42,43.6,42.8,43.9L42.8,43.9z"/>
          <path d="M24.7,16.9C24,15.9,23.3,15,22.7,14c-0.8-1.3,3.6-3.7,4.8-1.5c1.1,2,0.7,4.5,2.5,6c0.7,0.6,2.9,1,3.7,0.4c1.3-0.9,1-2.2,0.7-3.6c-0.2-0.8-1.4-0.5-1.2,0.3c0.4,1.9-1.6,3.3-3,1.2c-0.6-0.8-0.6-2.3-0.9-3.3c-0.3-1.2-0.8-2.3-1.9-3c-2.1-1.4-5.1,1.2-6.1,2.7c-0.1,0.2-0.1,0.4,0,0.6c0.7,1.3,1.5,2.5,2.4,3.6C24.1,18.2,25.1,17.5,24.7,16.9L24.7,16.9z"/>
          <path d="M32.9,31.2c4.6,0,9.3,0.1,13.9,0.1c0.8,0,0.8-1.2,0-1.3c-4.6,0-9.3-0.1-13.9-0.1C32,30,32,31.2,32.9,31.2L32.9,31.2z"/>
          <path d="M30.2,24.2c5.2,0,10.3,0,15.5,0c0.8,0,0.8-1.3,0-1.3c-5.2,0-10.3,0-15.5,0C29.4,22.9,29.4,24.2,30.2,24.2L30.2,24.2z"/>
          <path d="M34,16.7c3.2,0,6.4,0,9.7,0c0.8,0,0.8-1.3,0-1.3c-3.2,0-6.4,0-9.7,0C33.2,15.4,33.2,16.7,34,16.7L34,16.7z"/>
          <path d="M31,9.3c3.1,0,6.1,0,9.2,0C41,9.3,41,8,40.2,8c-3.1,0-6.1,0-9.2,0C30.2,8,30.2,9.3,31,9.3L31,9.3z"/>
        </g>
      </g>
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
      const res = await fetch(CONFIG.proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_tokens: 300,
          messages: history
          /* model and system prompt are set in the Worker — not exposed here */
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
