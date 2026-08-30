# A&C Creative Ventures

Official website for **A&C Creative Ventures** — practical productivity, outcome engineering, and daily motivation content, built as a static site.

Live site: deployed via Netlify (see `ads.txt` / AdSense integration below)
Follow us: [Instagram](https://www.instagram.com/aandccreativecompany/) · [YouTube](https://www.youtube.com/@aandccreativecompany) · [Pinterest](https://in.pinterest.com/aandc_creativecompany/)

## About

A&C Creative Ventures translates mindset theory and outcome engineering principles into daily habits people can actually act on. The site is organized around three content pillars — Productivity, Outcome Engineering, and Motivation — plus Prakriyā (the daily practice app/page), Personal Care, and an About page.

## Tech Stack

- **HTML5** — static, multi-page site (no build step / framework)
- **CSS3** — custom styling in `assets/style.css`
- **JavaScript** — interactivity (nav toggle, affirmations, social embeds) in `assets/script.js`, Prakriyā web app logic in `assets/app.js`
- **Netlify** — hosting and deployment (`_redirects` handles the old `/manifestation` URL)
- **Google AdSense** — ad monetization (site verified via `ads.txt`)

## Project Structure

```
.
├── index.html                 # Home page
├── about.html                 # About page
├── productivity.html          # Productivity pillar
├── outcome-engineering.html   # Outcome Engineering pillar (formerly "Manifestation")
├── motivation.html            # Motivation pillar
├── prakriya.html              # Prakriyā web app + Android APK download
├── personal-care.html         # Personal Care → Skin Care intake form
├── ads.txt                    # Google AdSense authorization file
├── _redirects                 # Netlify redirect: /manifestation → /outcome-engineering
└── assets/
    ├── style.css               # Site-wide styles
    ├── script.js                # Site-wide scripts (nav, affirmations, social embeds)
    └── app.js                   # Prakriyā web app (Supabase-backed)
```

## Pages

| Page | Description |
|---|---|
| `index.html` | Home page with hero section, social links, pillar overview, and a "From the feed" section |
| `productivity.html` | Productivity systems, habits, and focus strategies |
| `outcome-engineering.html` | Outcome engineering (manifestation) principles grounded in psychology |
| `motivation.html` | Daily motivation content |
| `prakriya.html` | Prakriyā web app (sign-up gated) plus the Android APK download for beta testers |
| `personal-care.html` | Personal Care hub — currently just the Skin Care intake form |
| `about.html` | About the company |

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

## License

© A&C Creative Ventures. All rights reserved.
