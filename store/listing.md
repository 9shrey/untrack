# Chrome Web Store listing — copy/paste into each field

## Store listing tab

**Name:** Untrack – Clean Links

**Summary** (max 132 chars):

Removes tracking junk like ?si=, utm_, and fbclid from links you copy, share, paste, and open. Automatic, no setup.

**Category:** Tools  **Language:** English

**Description** (paste everything between the lines):

---
Tired of sending links like youtu.be/abc?si=NbjlBgit-qHN7MoH? Untrack strips the tracking junk so you share clean links, automatically.

WHAT IT CLEANS
• Anything you copy: Ctrl+C, right-click → Copy, "Copy link address", and sites' own Share → Copy link buttons
• Anything you paste into a web page, even links copied from other apps
• Links you click, before the page loads
• The address bar, so copying from it is clean too
• Links shown on pages

WHAT IT REMOVES
• YouTube and Spotify ?si= share IDs
• utm_source, utm_medium, utm_campaign and the other utm_ tags
• Ad click IDs: fbclid, gclid, msclkid, ttclid, twclid, and more
• Share IDs from X/Twitter, Reddit, TikTok, Instagram, Facebook, LinkedIn, Threads, Amazon
• Email-marketing tags (Mailchimp, HubSpot, Marketo)

It never breaks links. Generic names like "t" or "s" are only removed on the sites that use them for tracking, so YouTube timestamps (?t=90) keep working.

No setup, no popup, no account. Click the toolbar icon to pause it ("off" badge), and click again to turn it back on.

PRIVACY
Untrack collects nothing. Everything happens inside your browser. No data is sent anywhere, and there are no analytics.

─────────────────────
ON YOUR IPHONE (free, no app needed)
─────────────────────
Chrome extensions don't run on phones, but an iPhone Shortcut does the same job from the Share button in any app (YouTube, Spotify, Instagram, Safari...).

Set it up once (about 2 minutes):
1. Open the Shortcuts app and tap + to make a new shortcut. Name it "Clean Link".
2. Tap the ⓘ (or the name at the top) and turn on "Show in Share Sheet". Under share sheet types, keep URLs and Text.
3. Add the action "Replace Text".
   • Find: (?<=[?&])(si|utm_[a-z_]+|fbclid|gclid|igsh|igshid|feature|pp|mibextid|share_id|ref_src|ref_url|_r|_t|is_from_webapp|sender_device|srsltid)=[^&#]*&?
   • Replace with: leave empty
   • In: Shortcut Input
   • Tap "Show More" and turn on "Regular Expression".
4. Add a second "Replace Text" action.
   • Find: [?&]+(?=#|$)
   • Replace with: leave empty
   • In: Updated Text (from the step above)
   • Turn on "Regular Expression".
5. Add the action "Copy to Clipboard".
6. (Optional) Add "Show Notification" with the text "Clean link copied".

To use it: in any app, tap Share → Clean Link. The clean link is now on your clipboard. Paste it anywhere.

Tip: if "Clean Link" isn't in the share menu, scroll to the end of the app row, tap "More" and add it to Favorites.

ON ANDROID
Chrome for Android doesn't support extensions. Firefox for Android does, and Untrack works there too.
---

## Privacy practices tab

**Single purpose:**
Removes tracking parameters (such as si, utm_source, fbclid) from URLs the user opens, copies, or pastes.

**Permission justifications:**
- **declarativeNetRequest:** Rewrites a link's URL to remove tracking parameters before the page loads.
- **storage:** Remembers whether the user has paused the extension.
- **Host permissions (all sites):** Tracking links appear on every website. The content script cleans link addresses on the page and cleans URLs when the user copies or pastes, and the redirect rule must apply to any site the user opens.
- **Remote code:** No, the extension uses no remote code.

**Data usage:** tick nothing (it collects no user data). Tick all three certification boxes (no selling, no unrelated use, no creditworthiness use).

**Privacy policy URL:** not required, because no user data is collected. If the form insists, use the "Privacy" section of the README on GitHub.

## Graphics

- Store icon: `icons/icon-128.png`
- Screenshot (1280×800): `store/screenshot-1.png`, `store/screenshot-2.png`
- Small promo tile (440×280): `store/promo-small.png`
