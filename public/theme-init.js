// Synchronous theme bootstrap. Loaded as an external script from <head> so the
// CSP can drop script-src 'unsafe-inline'. Must finish before <body> paints to
// avoid a light/dark flash on first render.
(function () {
  try {
    var t = localStorage.getItem('qa-hub-theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {
    /* localStorage may be blocked (private mode, sandbox); fall back to light. */
  }
})();
