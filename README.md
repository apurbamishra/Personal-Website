# Apurba Mishra — personal portfolio

The source for **[apurbamishra.com.np](https://apurbamishra.com.np)**: a single-page personal
site for Apurba Mishra, a Computing student in Kathmandu, Nepal.

It is a plain static website — no framework, no build step, no backend. Everything you need to
publish it is in this folder.

---

## 1. What's in it

- One-page layout: hero, about, experience, projects, skills, writing, education, interests, contact
- Light and dark themes (remembers your choice, follows the system until you pick one)
- Project filtering by language and discipline
- A contact form with full validation and UI states — **not yet connected to an email service** (see §8)
- Custom 404 page, favicon set, Open Graph image, sitemap, robots.txt, JSON-LD structured data
- Keyboard accessible throughout, honours `prefers-reduced-motion`, no horizontal overflow

## 2. Technologies

| Part | Used |
| --- | --- |
| Markup | HTML5, semantic sections, JSON-LD |
| Styling | CSS3 — custom properties, grid, flexbox, `clamp()` |
| Behaviour | Vanilla JavaScript (ES5-compatible syntax, no dependencies) |
| Fonts | Space Grotesk + Source Serif 4 from Google Fonts; system stack for monospace |
| Hosting | GitHub Pages (static) |

There is nothing to install and nothing to compile.

## 3. Folder structure

```
apurbamishra-portfolio/
├── index.html          the whole site
├── 404.html            custom not-found page
├── styles.css          design system + all component styles
├── script.js           theme, navigation, filters, form  ← contact form config lives at the top
├── robots.txt          search engine instructions
├── sitemap.xml         one entry: the homepage
├── CNAME               custom domain for GitHub Pages
├── .gitignore
├── README.md
└── assets/
    ├── favicon.svg             primary icon (AM monogram)
    ├── favicon-32.png          fallback for older browsers
    ├── favicon-16.png
    ├── apple-touch-icon.png    iOS home screen
    ├── og-image.png            link preview card (1200×630)
    └── images/                 put photos and screenshots here
```

## 4. Run it locally

**The quick way.** Double-click `index.html`. It opens in your browser and everything works.

**The better way.** Some browser features behave differently on `file://` URLs, so serve the
folder over HTTP. Python is already installed on most machines:

```bash
cd apurbamishra-portfolio
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Press `Ctrl+C` to stop it.

> On Windows, use `py -m http.server 8000`.

## 5. Deploy to GitHub Pages

1. Create a new repository on GitHub. Any name works — `apurbamishra-portfolio` is fine.
2. From inside this folder:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: portfolio site"
   git branch -M main
   git remote add origin https://github.com/apurbamishra/YOUR-REPO-NAME.git
   git push -u origin main
   ```

3. On GitHub, go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to *Deploy from a branch*, choose branch
   `main` and folder `/ (root)`, then **Save**.
5. Wait a minute or two. GitHub gives you a URL like
   `https://apurbamishra.github.io/YOUR-REPO-NAME/`.

To publish updates later:

```bash
git add .
git commit -m "Update projects"
git push
```

## 6. Point the custom domain at it

### What the CNAME file does

`CNAME` is a plain text file containing one line: `apurbamishra.com.np`. GitHub reads it and
serves the site at that domain. **Do not delete or rename it.** If you set the domain through
the GitHub interface, GitHub writes this same file for you — so if you later `git pull`, expect
it to still be there.

### On GitHub

1. **Settings → Pages → Custom domain.**
2. Enter `apurbamishra.com.np` and press **Save**.
3. Leave **Enforce HTTPS** unchecked for now — you can only tick it after DNS resolves and
   GitHub has issued a certificate.

### On Cloudflare (DNS)

DNS is configured in your Cloudflare dashboard, not in this code. Conceptually you need the
apex domain `apurbamishra.com.np` to resolve to GitHub Pages' servers:

1. Open Cloudflare → your domain → **DNS → Records**.
2. Add four **A** records for the apex (`@` or `apurbamishra.com.np`), one per GitHub Pages
   IP address:

   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   > Always confirm these against GitHub's current documentation —
   > *"Managing a custom domain for your GitHub Pages site"* — before relying on them.
   > GitHub publishes IPv6 (`AAAA`) addresses there too if you want both.

3. If you also want `www.apurbamishra.com.np` to work, add a **CNAME** record for `www`
   pointing to `apurbamishra.github.io`.
4. **Set the proxy status to “DNS only” (grey cloud)** while GitHub issues the TLS
   certificate. The orange proxied cloud hides the origin and can stop GitHub from validating
   the domain. You can turn proxying back on afterwards if you want Cloudflare's CDN.
5. If you do proxy through Cloudflare, set **SSL/TLS → Overview → Full** (not *Flexible*).
   *Flexible* causes redirect loops with GitHub Pages.

### Then

- DNS changes can take anywhere from a few minutes to 24–48 hours to propagate.
- Once `apurbamishra.com.np` loads your site, return to **Settings → Pages** and tick
  **Enforce HTTPS**. GitHub provisions a free certificate automatically.
- Check with `dig apurbamishra.com.np +short` (macOS/Linux) or
  `nslookup apurbamishra.com.np` (Windows) if you want to see what has propagated.

---

## 7. Configure contact form

**Status: the form is built but not connected.** Validation, error messages, the loading
state, the success state and the failure state are all implemented — but nothing is sent
anywhere yet. If someone submits it today they see a clear message telling them to email you
directly, and their text stays in the box. No fake endpoint is used anywhere in this project.

Everything you need to change is in **one place**: the top of `script.js`.

```js
var CONTACT_FORM = {
  endpoint: '',
  accessKey: ''
};
```

### Option A — Web3Forms (no account needed to start)

1. Go to <https://web3forms.com>, enter `apurba.mishra01@gmail.com`, and they email you an
   **access key**.
2. Fill in:

   ```js
   var CONTACT_FORM = {
     endpoint: 'https://api.web3forms.com/submit',
     accessKey: 'paste-your-access-key-here'
   };
   ```

### Option B — Formspree

1. Create a free account at <https://formspree.io>, add a new form, and set the destination to
   `apurba.mishra01@gmail.com`. You get a form ID like `xayzbwqr`.
2. Fill in:

   ```js
   var CONTACT_FORM = {
     endpoint: 'https://formspree.io/f/xayzbwqr',
     accessKey: ''
   };
   ```

Then commit and push. Submit a test message to yourself and check the inbox (and the spam
folder the first time).

**Security note.** Both values above are *public* keys — they are designed to be visible in
browser code. Never paste a private API secret, SMTP password or anything labelled "secret"
into `script.js`; it would be readable by anyone visiting the site.

**What the form sends.** Name, email, subject, an optional reason, and the message. Nothing
else is collected, and there is no tracking anywhere on the site. A hidden honeypot field and
a minimum time-to-submit check reduce basic bot spam.

---

## 8. Add a profile photo later

The hero currently shows a code panel instead of a photograph, on purpose. To swap it:

1. Put your image in `assets/images/` — for example `assets/images/apurba.jpg`.
2. In `index.html`, find the comment `HERO VISUAL — no photograph by design`.
3. Replace everything inside `<figure class="idcard"> … </figure>` with:

   ```html
   <img src="assets/images/apurba.jpg" alt="Apurba Mishra" width="720" height="900" loading="eager">
   ```

4. Add this to `styles.css`:

   ```css
   .idcard img { width: 100%; height: auto; display: block; }
   ```

Nothing else needs to change — the surrounding layout already handles the space.

## 9. Add your CV

1. Save the PDF as `assets/Apurba-Mishra-CV.pdf`.
2. In `index.html`, find the commented-out block marked `OPTIONAL CV BUTTON` inside the hero
   and uncomment the `<a …>Download CV</a>` line.

The button is deliberately disabled until the file exists, so the site never links to a
missing download.

## 10. Update the content

**Projects.** Each one is an `<article class="project">` inside `<div class="projects">` in
`index.html`. Copy an existing block and edit it. The `data-cat` attribute drives the filter
buttons — use one or more of `web`, `javascript`, `python`, `java`, `cpp`, `uiux`, `content`,
separated by spaces. If you add a new category, add a matching
`<button class="filter" data-filter="yourcategory">` to the filter row.

When a project gets a public repository, add a link inside the card, for example:

```html
<p class="project__links">
  <a href="https://github.com/apurbamishra/repo-name" target="_blank" rel="noopener noreferrer">View the code</a>
</p>
```

Only add the link when the repository actually exists — an empty button is worse than none.

**Social links.** They appear in three places: the hero (`hero__links`), the contact section
(`contact__direct`), and the footer (`footer__social`). Search `index.html` for
`github.com/apurbamishra` to find them all. The same URLs also appear in the `sameAs` array of
the JSON-LD block in `<head>`.

**Experience, education, skills.** Plain HTML lists in their sections — edit the text directly.

## 11. Change the design

Every colour, size and spacing value is a CSS custom property at the top of `styles.css`.
Change them there and the whole site follows:

```css
:root {
  --max-width: 1160px;    /* content width */
  --section-y: …;         /* vertical rhythm between sections */
  --r-sm / --r-md / --r-lg;  /* corner radii */
}

[data-theme="light"] {
  --bg;        /* page background */
  --surface;   /* cards, form, panels */
  --text;      /* body text */
  --accent;    /* cobalt — the "systems" colour, used for links and active states */
  --amber;     /* the "writing" colour, used for highlights and content projects */
}
```

`[data-theme="dark"]` holds the same names with dark values. If you change `--accent`, check
the contrast against `--bg` stays at or above 4.5:1 for text.

## 12. Notes on static hosting

- There is no server, so there is no server-side code, database, or environment variable.
- Anything the site needs at runtime must be public — that is why the contact form uses a
  third-party service with a public key.
- All internal paths in `index.html` are relative, so the site works both on a GitHub Pages
  project URL and on the custom domain.
- `404.html` uses root-absolute paths (`/styles.css`) because GitHub serves it for URLs at any
  depth. If you ever host this at `username.github.io/repo-name/` **without** a custom domain,
  change those four paths in `404.html` to relative ones or the page loads unstyled.

## 13. Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Site shows the README instead of the page | Pages is serving from the wrong branch or folder — check Settings → Pages |
| Custom domain shows "improperly configured" | DNS hasn't propagated yet, or the A records are wrong. Wait, then re-check |
| "Enforce HTTPS" is greyed out | GitHub is still issuing the certificate. Try again in a few hours |
| Redirect loop on the custom domain | Cloudflare SSL mode is *Flexible* — change it to *Full* |
| Fonts look wrong offline | Google Fonts can't load; the fallback stack takes over. This is expected |
| Contact form says it isn't connected | Correct — see §7. Fill in `CONTACT_FORM.endpoint` |
| Changes don't appear after pushing | Hard refresh (`Ctrl+Shift+R`), or wait for the Pages build to finish |

---

Built with HTML, CSS and JavaScript by Apurba Mishra.
