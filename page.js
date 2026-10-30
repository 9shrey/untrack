// Page-world script: catches "Share → Copy link" buttons (which use the
// Clipboard API) and single-page-app URL changes.
(function () {
  const { cleanUrl, cleanText, cleanHtml } = globalThis.Untrack;
  delete globalThis.Untrack; // don't leave our helper lying around on the page
  const on = () => document.documentElement?.dataset.untrackOff !== "1";

  // Clipboard.writeText("https://youtu.be/...?si=...")
  const proto = self.Clipboard?.prototype;
  if (proto?.writeText) {
    const writeText = proto.writeText;
    proto.writeText = function (text) {
      return writeText.call(this, on() ? cleanText(text) : text);
    };
  }

  // Clipboard.write([new ClipboardItem({"text/plain": ...})])
  if (proto?.write && self.ClipboardItem) {
    const write = proto.write;
    proto.write = function (items) {
      if (!on() || !Array.isArray(items)) return write.call(this, items);
      const cleaned = items.map((item) => {
        const fix = { "text/plain": cleanText, "text/html": cleanHtml };
        if (!item.types.some((t) => t in fix)) return item;
        const parts = {};
        for (const type of item.types) {
          parts[type] = type in fix
            ? item.getType(type).then((b) => b.text())
                .then((t) => new Blob([fix[type](t)], { type }))
            : item.getType(type);
        }
        return new ClipboardItem(parts);
      });
      return write.call(this, cleaned);
    };
  }

  // Address bar: clean SPA navigations and anything left on load.
  for (const name of ["pushState", "replaceState"]) {
    const orig = history[name];
    history[name] = function (state, title, url) {
      if (on() && typeof url === "string") url = cleanUrl(url, location.href);
      else if (on() && url instanceof URL) url = cleanUrl(url.href);
      return orig.call(this, state, title, url);
    };
  }

  const tidyAddressBar = () => {
    if (!on()) return;
    const clean = cleanUrl(location.href);
    if (clean !== location.href) history.replaceState(history.state, "", clean);
  };
  tidyAddressBar();
  addEventListener("popstate", tidyAddressBar);
})();
