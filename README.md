# A&C Creative Ventures

Official website for **A&C Creative Ventures** — practical productivity, outcome engineering, and daily motivation content, built as a static site.

Live site: deployed via Netlify (see `ads.txt` / AdSense integration below)
Follow us: [Instagram](https://www.instagram.com/aandccreativeventures/) · [YouTube](https://www.youtube.com/@aandccreativeventures) · [Pinterest](https://in.pinterest.com/aandc_creativeventures/)

## About

A&C Creative Ventures translates mindset theory and outcome engineering principles into daily habits people can actually act on. The site is organized around three content pillars — Productivity, Outcome Engineering, and Motivation — plus Prakriyā (the daily practice app/page), inCArna (skincare brand, with the Skin Care intake form), and an About page.

## Tech Stack

- **HTML5** — static, multi-page site (no build step / framework)
- **CSS3** — custom styling in `assets/style.css`
- **JavaScript** — interactivity (nav toggle, affirmations, social embeds) in `assets/script.js`
- **Netlify** — hosting and deployment (`_redirects` handles the old `/manifestation` URL)
- **Google AdSense** — ad monetization (site verified via `ads.txt`)

## Project Structure

```
.
├── index.html        # Home — The Outcome Engineering Masterclass, registration, newsletter
├── about.html        # About + founders
├── products.html     # Our book, planners, free downloads, shop links
├── prakriya.html     # Prakriyā web app info + Android app
├── incarna.html      # inCArna skincare sub-brand
├── contact.html      # Contact form + email
├── privacy.html      # Privacy policy
├── 404.html          # Not-found page (served automatically by Netlify)
├── robots.txt        # Crawl rules + sitemap location
├── sitemap.xml       # Page list for search engines
├── ads.txt           # Google AdSense authorization file
├── _redirects        # Netlify redirects (old URLs → current pages)
├── netlify.toml      # Netlify build/functions config
├── downloads/        # Free PDF/EPUB downloads
├── netlify/functions # Coach-chat serverless function
└── assets/
    ├── style.css     # Site-wide styles
    ├── script.js     # Site-wide scripts (nav, theme, forms, embeds)
    ├── favicon.svg, og-image.png
    ├── products/     # Product images (book cover)
    ├── founders/, framework/, prakriya-screens/
```

## Forms

The masterclass registration, newsletter and contact forms use **Netlify Forms**
(`data-netlify="true"` plus a honeypot field). Netlify detects them on deploy;
submissions appear under **Forms** in the Netlify dashboard. To get an email for
each one: Site configuration → Forms → Form notifications → Add notification.

## Adding a product

Add a `featured-product` block (see the book at `#book` in `products.html`), put its
image in `assets/products/`, and add the page to `sitemap.xml` if it gets its own URL.

## Featuring Instagram / Threads posts

`index.html` has a "From the feed" section with two empty slots
(`#ig-embed-slot`, `#threads-embed-slot`). To show a real post: open it on
Instagram or Threads, use its **••• menu → Embed → Copy embed code**, and
paste the `<blockquote>` snippet straight into the matching slot's `<div>`.
`script.js` detects real content in either slot and loads that platform's
own `embed.js` automatically — no API key, token, or backend involved.
Leave a slot empty to keep it hidden.

## Getting Started

This is a static site with no dependencies or build process. To run it locally:

```bash
git clone https://github.com/aandccreativecompany-dev/aandccreativecompany.git
cd aandccreativecompany
```

Then open `index.html` directly in a browser, or serve the folder with any static file server, e.g.:

```bash
npx serve .
```

## Deployment

The site is deployed automatically via Netlify on pushes to the `main` branch.

## Prakriyā Web (`/app`)

A local-first web/desktop version of the Prakriyā app (plain JS, no build step), installable as a PWA.
Google sign-in is required. Data lives in `localStorage` in the **same JSON shape as the Android app's `AppState`** and
syncs live through the same Firestore document (`users/{uid}` → `state`, `updatedAt`), using a realtime listener, so edits
on the phone and the web show up on the other within seconds. Unknown keys are preserved on round trips.
Conflict rule: a device with no unsynced edits adopts newer cloud data; if both changed, the web app asks, Android keeps the later edit.

Config: `app/firebase-config.js` (Firebase web app of project `prakriya-82d0e`; Authentication → Authorized domains must include
`aandccreativeventures.com` and `www.aandccreativeventures.com`; Firestore rules allow `users/{uid}` for its owner only).
Setting it to `null` runs the app local-only.

Optional **Back up to my Drive** (Settings): writes one visible file, `Prakriya backup.json`, to the user's own Drive with the
narrow `drive.file` scope (`app/js/drivebackup.js`, `app/google-config.js`). One-time Google Cloud setup: enable the Google Drive API
and add the two site origins as Authorized JavaScript origins on the Web OAuth client.

## License

© A&C Creative Ventures. All rights reserved.
