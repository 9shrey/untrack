// Chrome loads cleaner.js here; Firefox lists it in the manifest instead.
if (typeof importScripts === "function") importScripts("cleaner.js");

async function syncRules() {
  const { enabled = true } = await chrome.storage.local.get("enabled");
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: enabled ? Untrack.buildRules() : [],
  });
  // Firefox for Android has no toolbar badge, so these can be missing.
  chrome.action.setBadgeText?.({ text: enabled ? "" : "off" });
  chrome.action.setTitle?.({ title: enabled ? "Untrack: on (click to pause)" : "Untrack: paused (click to resume)" });
}

// Clicking the toolbar icon pauses / resumes.
chrome.action.onClicked.addListener(async () => {
  const { enabled = true } = await chrome.storage.local.get("enabled");
  chrome.storage.local.set({ enabled: !enabled });
});

chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);
chrome.storage.onChanged.addListener((changes) => {
  if ("enabled" in changes) syncRules();
});
