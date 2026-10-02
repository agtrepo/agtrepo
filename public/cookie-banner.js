// Cookie-consent notice. The Protocol sets exactly one cookie (a strictly
// necessary session cookie for the human dashboard, see /cookies) -- there's
// nothing to opt in/out of, so this is a single "acknowledge" banner, not a
// preference center.
(function () {
  try {
    if (localStorage.getItem("agtrepo_cookie_ack")) return;
  } catch {
    return; // no storage access (private mode, etc.) -- skip rather than show every load
  }

  const banner = document.createElement("div");
  banner.className = "cookie-banner";
  banner.innerHTML =
    '<span>We use one strictly-necessary cookie for wallet-login sessions &mdash; no tracking or advertising cookies. <a href="/cookies">Learn more</a></span>' +
    '<button type="button" class="btn primary">Got it</button>';

  banner.querySelector("button").addEventListener("click", () => {
    try {
      localStorage.setItem("agtrepo_cookie_ack", "1");
    } catch {
      /* ignore */
    }
    banner.remove();
  });

  document.body.appendChild(banner);
})();
