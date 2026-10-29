# 1312 Wrap Design — mini-site

Glassmorphism one-page site: livery design, branding, web and apps — prices, project examples and cases.
Static HTML/CSS/JS, no build step. Works on phones and desktops. Two languages: English (default) and Ukrainian.

## Publish on GitHub Pages

1. Create a repository and upload everything from this folder (`index.html`, `assets/`, `.nojekyll`).
2. Open **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
3. After a minute the site is live at `https://<your-username>.github.io/<repository>/`.
   The page is set up for `https://1312dev.github.io/` (repository `1312dev.github.io`).
   If you publish it at another address, change `og:url`, `og:image` and `canonical` in `index.html`,
   otherwise link previews in Telegram/Instagram will not show the picture.

## Edit content

- Texts in both languages: `assets/js/i18n.js` (`en` and `uk`, same keys).
  `index.html` also holds the English text (it is shown before the script runs) — keep it the same as `en`.
- Colors and layout: `assets/css/style.css` (colors are at the top in `:root`)
- Menu, language switch, before/after slider, docked titles, photo viewer: `assets/js/main.js`
- Photos: `assets/img/` (cases are in `assets/img/cases/`)

A link with `?lang=uk` opens the Ukrainian version directly. The chosen language is remembered in the browser.
