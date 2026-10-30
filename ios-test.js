// Checks the two iOS Shortcut find/replace patterns (ICU and JS agree on these).
const assert = require("assert");
const P1 = "(?<=[?&])(si|utm_[a-z_]+|fbclid|gclid|igsh|igshid|feature|pp|mibextid|share_id|ref_src|ref_url|_r|_t|is_from_webapp|sender_device|srsltid)=[^&#]*&?";
const P2 = "[?&]+(?=#|$)";
const clean = (s) => s.replace(new RegExp(P1, "g"), "").replace(new RegExp(P2, "g"), "");
const cases = [
  ["https://youtu.be/dQw4w9WgXcQ?si=NbjlBgit-qHN7MoH", "https://youtu.be/dQw4w9WgXcQ"],
  ["https://www.youtube.com/watch?v=abc&si=xyz&t=90", "https://www.youtube.com/watch?v=abc&t=90"],
  ["https://open.spotify.com/track/123?si=abcdef", "https://open.spotify.com/track/123"],
  ["https://example.com/a?utm_source=tw&id=5&fbclid=zz", "https://example.com/a?id=5"],
  ["https://example.com/a?si=1&utm_source=2", "https://example.com/a"],
  ["https://example.com/a?utm_medium=x#top", "https://example.com/a#top"],
  ["https://www.instagram.com/p/xyz/?igsh=MWQ1", "https://www.instagram.com/p/xyz/"],
  ["https://www.tiktok.com/@a/video/1?_r=1&_t=ZT-9", "https://www.tiktok.com/@a/video/1"],
  ["https://example.com/?x_si=1", "https://example.com/?x_si=1"],
];
for (const [i, w] of cases) assert.strictEqual(clean(i), w, i);
console.log("ios ok");
console.log(P1); console.log(P2);
