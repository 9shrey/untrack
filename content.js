// Isolated-world content script: cleans links on the page and copied URLs.
(function () {
  const { cleanUrl, cleanText, cleanNode, cleanHtml } = globalThis.Untrack;
  let enabled = true;

  chrome.storage.local.get("enabled").then(({ enabled: e = true }) => setEnabled(e));
  chrome.storage.onChanged.addListener((c) => {
    if ("enabled" in c) setEnabled(c.enabled.newValue !== false);
  });

  function setEnabled(on) {
    enabled = on;
    // page.js runs in the page's world and can't read chrome.storage, so it reads this.
    if (on) delete document.documentElement.dataset.untrackOff;
    else document.documentElement.dataset.untrackOff = "1";
    if (on && document.body) cleanTree(document.body);
  }

  // --- Links on the page -------------------------------------------------
  function cleanAnchor(a) {
    const href = a.getAttribute("href");
    if (!href || !href.includes("=")) return;
    const clean = cleanUrl(href, location.href);
    if (clean !== href) a.setAttribute("href", clean);
  }

  function cleanTree(node) {
    if (node.nodeType !== 1) return;
    if (node.tagName === "A") cleanAnchor(node);
    node.querySelectorAll?.("a[href*='=']").forEach(cleanAnchor);
  }

  const pending = new Set();
  let scheduled = false;
  function flush() {
    scheduled = false;
    if (!enabled) return pending.clear();
    pending.forEach(cleanTree);
    pending.clear();
  }
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "attributes") pending.add(r.target);
      else r.addedNodes.forEach((n) => pending.add(n));
    }
    if (!scheduled) {
      scheduled = true;
      (self.requestIdleCallback || setTimeout)(flush, { timeout: 300 });
    }
  });
  observer.observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["href"],
  });
  document.addEventListener("DOMContentLoaded", () => enabled && cleanTree(document.body));

  // --- Copying ---------------------------------------------------------
  // Every copy (Ctrl+C, right-click > Copy, a site's own copy button) fires this.
  // It runs last (window, bubble phase), so it also sees data the page put there.
  function inTextField() {
    const el = document.activeElement;
    return el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT") &&
      typeof el.selectionStart === "number" ? el : null;
  }

  window.addEventListener("copy", (e) => {
    if (!enabled || !e.clipboardData) return;
    const cd = e.clipboardData;

    // The page already filled the clipboard itself: clean what it set.
    if (e.defaultPrevented) {
      const text = cd.getData("text/plain");
      const html = cd.getData("text/html");
      if (text) cd.setData("text/plain", cleanText(text));
      if (html) cd.setData("text/html", cleanHtml(html));
      return;
    }

    // Copy from a text box: plain text only.
    const field = inTextField();
    if (field) {
      const text = field.value.slice(field.selectionStart, field.selectionEnd);
      const clean = cleanText(text);
      if (clean === text) return;
      cd.setData("text/plain", clean);
      return e.preventDefault();
    }

    // Normal page selection: clean both the plain text and the rich-text copy.
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString();
    const box = document.createElement("div");
    for (let i = 0; i < sel.rangeCount; i++) box.append(sel.getRangeAt(i).cloneContents());
    const htmlChanged = cleanNode(box);
    const clean = cleanText(text);
    if (!htmlChanged && clean === text) return; // nothing to fix, keep the browser's own copy
    cd.setData("text/plain", clean);
    cd.setData("text/html", box.innerHTML);
    e.preventDefault();
  });

  // --- Pasting -----------------------------------------------------------
  // Catches links copied somewhere else (another app, your phone's synced
  // clipboard) when you paste them into a page.
  window.addEventListener("paste", (e) => {
    if (!enabled || !e.clipboardData) return;
    const text = e.clipboardData.getData("text/plain");
    const clean = cleanText(text);
    if (!text || clean === text) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    // insertText behaves like typing, so undo works and rich editors pick it up.
    document.execCommand("insertText", false, clean);
  }, true);
})();
