const assert = require("assert");
const { cleanUrl, cleanText, buildRules } = require("./cleaner.js");

const cases = [
  ["https://youtu.be/dQw4w9WgXcQ?si=NbjlBgit-qHN7MoH", "https://youtu.be/dQw4w9WgXcQ"],
  ["https://www.youtube.com/watch?v=abc&si=xyz&t=90", "https://www.youtube.com/watch?v=abc&t=90"],
  ["https://open.spotify.com/track/123?si=abcdef", "https://open.spotify.com/track/123"],
  ["https://x.com/user/status/1?s=20&t=AbC", "https://x.com/user/status/1"],
  ["https://example.com/a?utm_source=tw&id=5&fbclid=zz", "https://example.com/a?id=5"],
  ["https://example.com/search?s=shoes&si=keep", "https://example.com/search?s=shoes&si=keep"],
  ["https://example.com/page#frag", "https://example.com/page#frag"],
  ["https://example.com/a?utm_medium=x#top", "https://example.com/a#top"],
  ["https://www.instagram.com/p/xyz/?igsh=MWQ1", "https://www.instagram.com/p/xyz/"],
  ["not a url", "not a url"],
  ["javascript:void(0)", "javascript:void(0)"],
];
for (const [input, want] of cases) assert.strictEqual(cleanUrl(input), want, input);

assert.strictEqual(cleanUrl("/watch?v=a&si=b", "https://www.youtube.com/"), "https://www.youtube.com/watch?v=a");
assert.strictEqual(
  cleanText("check this https://youtu.be/x?si=abc and https://a.com/?utm_source=q"),
  "check this https://youtu.be/x and https://a.com/"
);

assert.strictEqual(cleanText("watch (https://youtu.be/x?si=abc)."), "watch (https://youtu.be/x).");
assert.strictEqual(cleanText("no links here"), "no links here");

const rules = buildRules();
const ids = new Set(rules.map((r) => r.id));
assert.strictEqual(ids.size, rules.length, "rule ids unique");
for (const r of rules) new RegExp(r.condition.regexFilter); // compiles
console.log(`ok — ${cases.length + 2} url cases, ${rules.length} rules`);
