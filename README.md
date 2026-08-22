# A&C Creative Company

Official website for **A&C Creative Company** — practical productivity, manifestation, and daily motivation content, built as a static site.

Live site: deployed via Netlify (see `ads.txt` / AdSense integration below)
Follow us: [Instagram](https://www.instagram.com/aandccreativecompany/) · [YouTube](https://www.youtube.com/@aandccreativecompany) · [Pinterest](https://in.pinterest.com/aandc_creativecompany/)

## About

A&C Creative Company translates mindset theory and manifestation principles into daily habits people can actually act on. The site is organized around three content pillars — Productivity, Manifestation, and Motivation — plus a Planner page and an About page.

## Tech Stack

- **HTML5** — static, multi-page site (no build step / framework)
- - **CSS3** — custom styling in `assets/style.css`
  - - **JavaScript** — interactivity (e.g. nav toggle) in `assets/script.js`
    - - **Netlify** — hosting and deployment
      - - **Google AdSense** — ad monetization (site verified via `ads.txt`)
       
        - ## Project Structure
       
        - ```
          .
          ├── index.html            # Home page
          ├── about.html             # About page
          ├── productivity.html      # Productivity pillar
          ├── manifestation.html     # Manifestation pillar
          ├── motivation.html        # Motivation pillar
          ├── planner.html           # Planner page
          ├── ads.txt                # Google AdSense authorization file
          └── assets/
              ├── style.css           # Site-wide styles
              └── script.js           # Site-wide scripts
          ```

          ## Pages

          | Page | Description |
          |---|---|
          | `index.html` | Home page with hero section, social links, and pillar overview |
          | `productivity.html` | Productivity systems, habits, and focus strategies |
          | `manifestation.html` | Manifestation principles grounded in psychology |
          | `motivation.html` | Daily motivation content |
          | `planner.html` | Planner resource/product page |
          | `about.html` | About the company |

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

          © A&C Creative Company. All rights reserved.
