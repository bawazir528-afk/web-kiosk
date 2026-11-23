(function () {
  "use strict";

  const qs = new URLSearchParams(location.search);
  const $ = (id) => document.getElementById(id);

  const frame = $("frame");
  const setup = $("setup");
  const toolbar = $("toolbar");
  const status = $("status");

  let url = qs.get("url") || localStorage.getItem("wr_url") || "";
  let interval = parseInt(qs.get("interval") || localStorage.getItem("wr_interval") || "60", 10);
  if (isNaN(interval) || interval < 3) interval = 60;
  let toolbarVisible = (qs.get("toolbar") !== "0") && (localStorage.getItem("wr_toolbar") !== "0");

  let timer = null;
  let lastRefresh = null;

  function showSetup() {
    setup.classList.remove("hidden");
    $("urlInput").value = url || "";
    $("intervalInput").value = interval;
    $("setupError").textContent = "";
  }
  function hideSetup() { setup.classList.add("hidden"); }

  function isValidUrl(u) {
    try { const x = new URL(u); return x.protocol === "http:" || x.protocol === "https:"; }
    catch (e) { return false; }
  }

  function saveConfig(u, iv) {
    url = u.trim();
    interval = iv;
    localStorage.setItem("wr_url", url);
    localStorage.setItem("wr_interval", String(interval));
    localStorage.setItem("wr_toolbar", toolbarVisible ? "1" : "0");
  }

  function updateStatus() {
    const t = lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : "—";
    status.textContent = "آخر تحديث: " + t + " • " + interval + "s";
  }

  function normalizeUrl(u) {
    // YouTube: convert watch / youtu.be URLs to embeddable form (allowed in iframes).
    try {
      const x = new URL(u);
      if (x.hostname.includes("youtube.com") && x.pathname === "/watch") {
        const v = x.searchParams.get("v");
        if (v) return "https://www.youtube.com/embed/" + v + "?autoplay=1&mute=1";
      }
      if (x.hostname === "youtu.be") {
        const v = x.pathname.replace("/", "");
        if (v) return "https://www.youtube.com/embed/" + v + "?autoplay=1&mute=1";
      }
    } catch (e) { /* ignore */ }
    return u;
  }

  function loadUrl() {
    if (!url) { showSetup(); return; }
    const target = normalizeUrl(url);
    // Note: many sites (CNN, etc.) block iframe embedding via X-Frame-Options.
    frame.src = target + (target.indexOf("?") >= 0 ? "&" : "?") + "_ts=" + Date.now();
    lastRefresh = Date.now();
    updateStatus();
  }

  frame.addEventListener("load", () => {
    // If the iframe loaded an error page (about:blank / blocked), hint the user.
    try {
      // Accessing contentDocument throws for cross-origin; that's expected and OK.
      void frame.contentDocument;
    } catch (e) {
      // cross-origin: cannot inspect; assume OK
    }
  });

  frame.addEventListener("error", () => {
    toolbarVisible = true;
    applyToolbar();
    status.textContent = "تعذّر تضمين الموقع (قد يمنع الإطارات). افتح في تبويب جديد.";
  });

  function refreshNow() {
    // Try partial refresh hook defined by the page (if same-origin). Fall back to reload.
    try {
      if (frame.contentWindow && typeof frame.contentWindow.onRefresh === "function") {
        frame.contentWindow.onRefresh();
        lastRefresh = Date.now();
        updateStatus();
        return;
      }
    } catch (e) { /* cross-origin: ignore */ }
    loadUrl();
  }

  function schedule() {
    if (timer) clearInterval(timer);
    timer = setInterval(refreshNow, interval * 1000);
  }

  function applyToolbar() {
    toolbar.style.display = toolbarVisible ? "flex" : "none";
  }

  function requestFullscreen() {
    const el = document.documentElement;
    const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (fn) { try { fn.call(el); } catch (e) {} }
  }

  async function keepAwake() {
    try {
      if ("wakeLock" in navigator) {
        const lock = await navigator.wakeLock.request("screen");
        document.addEventListener("visibilitychange", async () => {
          if (document.visibilityState === "visible" && lock.released) {
            try { await navigator.wakeLock.request("screen"); } catch (e) {}
          }
        });
      }
    } catch (e) { /* unsupported */ }
  }

  // Setup handlers
  $("saveBtn").addEventListener("click", () => {
    const u = $("urlInput").value.trim();
    const iv = parseInt($("intervalInput").value, 10);
    if (!u) { $("setupError").textContent = "أدخل رابطاً"; return; }
    if (!isValidUrl(u)) { $("setupError").textContent = "رابط غير صالح (http/https)"; return; }
    const ivv = (isNaN(iv) || iv < 3) ? 60 : iv;
    toolbarVisible = true;
    saveConfig(u, ivv);
    interval = ivv;
    hideSetup();
    applyToolbar();
    loadUrl();
    schedule();
    keepAwake();
  });

  $("refreshBtn").addEventListener("click", () => { refreshNow(); });
  $("openBtn").addEventListener("click", () => { if (url) window.open(url, "_blank"); });
  $("exitBtn").addEventListener("click", () => {
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    // Attempt to close the tab/window (works if opened by script).
    try { window.close(); } catch (e) {}
    // Fallback: navigate to blank.
    setTimeout(() => { try { window.location.href = "about:blank"; } catch (e) {} }, 200);
  });
  $("settingsBtn").addEventListener("click", () => { showSetup(); if (timer) { clearInterval(timer); timer = null; } });
  $("fullscreenBtn").addEventListener("click", requestFullscreen);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "F5" || (e.ctrlKey && e.key.toLowerCase() === "r")) { e.preventDefault(); refreshNow(); }
    if (e.key.toLowerCase() === "s") { showSetup(); }
    if (e.key.toLowerCase() === "h") { toolbarVisible = !toolbarVisible; applyToolbar(); localStorage.setItem("wr_toolbar", toolbarVisible ? "1" : "0"); }
  });

  // Init
  applyToolbar();
  if (!url) {
    showSetup();
  } else {
    hideSetup();
    loadUrl();
    schedule();
    keepAwake();
    // Auto fullscreen on first user gesture not possible; try anyway
    requestFullscreen();
  }
})();
