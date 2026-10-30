// Shared tracking-param list and URL cleaner.
// Loaded by the background worker, the content script, and the page-world script.
(function (root) {
  // Stripped from every site.
  const GLOBAL_PARAMS = [
    // Google Analytics / campaign tags
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "utm_id", "utm_name", "utm_cid", "utm_reader", "utm_referrer",
    "utm_social", "utm_social-type", "utm_brand", "utm_viz_id", "utm_pubreferrer",
    // Ad click IDs
    "fbclid", "gclid", "gclsrc", "dclid", "gbraid", "wbraid", "msclkid",
    "yclid", "ysclid", "twclid", "ttclid", "li_fat_id", "srsltid", "rb_clickid",
    // Email / marketing platforms
    "mc_cid", "mc_eid", "_hsenc", "_hsmi", "__hssc", "__hstc", "__hsfp",
    "hsCtaTracking", "mkt_tok", "vero_id", "vero_conv", "oly_anon_id",
    "oly_enc_id", "wickedid", "_openstat", "s_cid",
    // Instagram share IDs
    "igshid", "igsh",
  ];

  // Stripped only on these domains (and their subdomains), because the
  // names are too generic to remove everywhere.
  const SITE_PARAMS = [
    { domains: ["youtube.com", "youtu.be"], params: ["si", "feature", "pp"] },
    { domains: ["spotify.com"], params: ["si", "context", "nd"] },
    { domains: ["x.com", "twitter.com"], params: ["s", "t", "ref_src", "ref_url"] },
    { domains: ["reddit.com"], params: ["share_id", "rdt", "ref", "ref_source"] },
    { domains: ["tiktok.com"], params: ["_r", "_t", "is_from_webapp", "sender_device",
        "sender_web_id", "share_app_id", "share_link_id", "share_item_id", "u_code",
        "preview_pb", "social_share_type", "timestamp", "user_id", "tt_from"] },
    { domains: ["facebook.com"], params: ["mibextid", "__cft__", "__tn__", "rdid", "sfnsn"] },
    { domains: ["instagram.com"], params: ["utm_source", "img_index"] },
    { domains: ["linkedin.com"], params: ["trk", "trkInfo", "trackingId", "lipi", "rcm", "originalSubdomain"] },
    { domains: ["threads.net", "threads.com"], params: ["xmt", "slof"] },
    { domains: ["amazon.com", "amazon.co.uk", "amazon.in", "amazon.de", "amazon.ca",
        "amazon.fr", "amazon.es", "amazon.it", "amazon.co.jp", "amazon.com.au"],
      params: ["ref_", "pd_rd_r", "pd_rd_w", "pd_rd_wg", "pd_rd_i", "pf_rd_p",
        "pf_rd_r", "pf_rd_s", "pf_rd_t", "pf_rd_i", "pf_rd_m", "content-id",
        "crid", "sprefix", "dib", "dib_tag", "qid", "sr", "_encoding", "psc"] },
  ];

  const GLOBAL_SET = new Set(GLOBAL_PARAMS);

  function hostMatches(host, domain) {
    return host === domain || host.endsWith("." + domain);
  }

  function paramsForHost(host) {
    const set = new Set(GLOBAL_SET);
    for (const site of SITE_PARAMS) {
      if (site.domains.some((d) => hostMatches(host, d))) {
        site.params.forEach((p) => set.add(p));
      }
    }
    return set;
  }

  // Returns the cleaned URL string, or the input unchanged if nothing to strip
  // (or it isn't a parseable http(s) URL).
  function cleanUrl(input, base) {
    if (typeof input !== "string" || !input.includes("=")) return input;
    let url;
    try {
      url = new URL(input, base);
    } catch {
      return input;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return input;
    if (!url.search) return input;

    const strip = paramsForHost(url.hostname.toLowerCase());
    const keys = [...new Set(url.searchParams.keys())];
    const removed = keys.filter((k) => strip.has(k));
    if (removed.length === 0) return input;

    removed.forEach((k) => url.searchParams.delete(k));
    // Drop a dangling "?" when nothing is left.
    let out = url.toString();
    if (!url.searchParams.toString()) out = out.replace("?", "");
    return out;
  }

  // Cleans every URL found inside a chunk of text (for copied text).
  const URL_IN_TEXT = /https?:\/\/[^\s<>"'`]+/g;
  function cleanText(text) {
    if (typeof text !== "string" || !text.includes("http")) return text;
    return text.replace(URL_IN_TEXT, (u) => {
      // Keep sentence punctuation after a link out of the URL ("...?si=abc).")
      const tail = u.match(/[.,!?;:)\]}]+$/)?.[0] || "";
      return cleanUrl(u.slice(0, u.length - tail.length)) + tail;
    });
  }

  // Cleans links inside an HTML snippet (rich-text clipboard data).
  // Needs a DOM, so it only works in pages, not the background worker.
  function cleanNode(root) {
    let changed = false;
    root.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      const clean = cleanUrl(href);
      if (clean !== href) { a.setAttribute("href", clean); changed = true; }
    });
    const walker = root.ownerDocument.createTreeWalker(root, 4 /* text */);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const clean = cleanText(n.nodeValue);
      if (clean !== n.nodeValue) { n.nodeValue = clean; changed = true; }
    }
    return changed;
  }

  function cleanHtml(html) {
    if (typeof html !== "string" || !html.includes("=") || typeof DOMParser === "undefined") return html;
    const doc = new DOMParser().parseFromString(html, "text/html");
    return cleanNode(doc.body) ? doc.body.innerHTML : html;
  }

  // declarativeNetRequest rules: rewrite navigations before they load.
  function buildRules() {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regexFor = (params) => "[?&](" + params.map(esc).join("|") + ")=";
    const base = {
      priority: 1,
      action: { type: "redirect", redirect: { transform: { queryTransform: {} } } },
    };
    const rule = (id, params, requestDomains) => {
      const r = structuredClone(base);
      r.id = id;
      r.action.redirect.transform.queryTransform.removeParams = params;
      r.condition = { regexFilter: regexFor(params), resourceTypes: ["main_frame", "sub_frame"] };
      if (requestDomains) r.condition.requestDomains = requestDomains;
      return r;
    };
    const rules = [rule(1, GLOBAL_PARAMS)];
    SITE_PARAMS.forEach((s, i) => rules.push(rule(i + 2, s.params, s.domains)));
    return rules;
  }

  const api = { GLOBAL_PARAMS, SITE_PARAMS, cleanUrl, cleanText, cleanNode, cleanHtml, buildRules };
  root.Untrack = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
