# Hoback Club — Official Public Website

This is the production website for **hobackclub.com**, a luxury private club in Jackson Hole, Wyoming. The site is built with Astro, hosted on GitHub Pages, and uses Firebase Cloud Functions for form handling. An AI agent (Claude, via Anthropic's Claude Desktop / Cowork) actively develops and maintains this codebase alongside the owner (Hutch).

## Owner & Contact

- **Owner:** Hutch (qtyree1328@gmail.com)
- **Club address:** P.O. Box 158, Teton Village, WY 83025
- **Club phone:** (307) 249-1000
- **Notification email:** info@hobackclub.com

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Static site generator** | Astro 6.x | Compiles `.astro` → static HTML at build time. No runtime server. |
| **Hosting** | GitHub Pages | Auto-deploys via GitHub Actions on push to `main` |
| **Forms / Email** | Firebase Cloud Functions (v2) | Project: `hobackclub-website` (ID: 248630019765) |
| **Form storage** | Cloud Firestore | All submissions stored in `submissions` collection |
| **Email delivery** | Nodemailer via Gmail | Secrets: `EMAIL_USER`, `EMAIL_PASS` (configured via `firebase functions:secrets:set`) |
| **Member portal** | Club Essential | Private member pages at members.hobackclub.com (not this repo) |
| **DNS/Domain** | hobackclub.com | GitHub Pages custom domain |

### Why Astro?

The original site was hand-coded HTML with severe CSS/JS duplication across 12+ pages (nav, footer, header styles all inlined per-page with inconsistencies). Astro was chosen because it provides shared components (Nav, Footer, BaseLayout) while outputting the exact same static HTML — no JavaScript runtime, no framework overhead. Think of it as a compiler: `.astro` files in, plain `.html` files out.

### Why Not Formspree?

Firebase was chosen over Formspree because the project already has a Firebase account (hobackclub-website), and Firebase provides both email delivery AND Firestore storage in one place. No third-party form service needed.

## Repository Structure

```
├── CLAUDE.md                          ← This file
├── astro.config.mjs                   ← Site config (site URL, sitemap integration)
├── package.json                       ← Astro + sitemap dependencies
├── tsconfig.json                      ← TypeScript config (extends astro/strict)
├── .github/workflows/deploy.yml       ← GitHub Actions: build Astro → deploy to Pages
├── firebase.json                      ← Firebase project config (functions + firestore)
├── .firebaserc                        ← Firebase project alias (hobackclub-website)
├── firestore.rules                    ← Firestore security rules (no client access)
│
├── src/
│   ├── styles/global.css              ← CSS variables, reset, typography, buttons, animations
│   ├── layouts/BaseLayout.astro       ← Master layout (wraps Nav + Footer, loads fonts)
│   ├── components/
│   │   ├── Nav.astro                  ← Fixed header, scroll-triggered style, hamburger menu
│   │   ├── Footer.astro               ← Dark navy footer, contact info, back-to-top
│   │   └── HeroStandard.astro         ← Reusable hero (title, subtitle, image, overlay)
│   └── pages/
│       ├── index.astro                ← Homepage (video hero, weather, gallery, cards)
│       ├── discover.astro             ← Discover Us
│       ├── stay.astro                 ← Come & Stay (reservation form)
│       ├── amenities.astro            ← Amenities
│       ├── mountain.astro             ← Mountain conditions
│       ├── lifestyle.astro            ← Lifestyle / things to do
│       ├── membership.astro           ← Membership (inquiry form)
│       ├── contact.astro              ← Contact Us (contact form)
│       └── login.astro                ← Redirect to members.hobackclub.com
│
├── functions/
│   ├── package.json                   ← Firebase Functions dependencies
│   └── index.js                       ← Three Cloud Functions: submitContact, submitReservation, submitMembership
│
└── public/                            ← Static assets (copied as-is to dist/)
    ├── images/                        ← Logos, drawings, card images, hero photos
    ├── videos/                        ← Hero video, flyover video
    └── data/                          ← GeoJSON files (buildings, lifts, runs)
```

## How to Develop

### Prerequisites

- **Node.js >=22.12.0** (Astro 6.x requirement)
- npm (comes with Node)

### Local Development

```bash
npm install              # Install dependencies (first time only)
npx astro dev            # Start dev server at http://localhost:4321
```

The dev server hot-reloads on every file change. This is for local preview only — there is no Astro server in production.

### Build & Preview Production Output

```bash
npx astro build          # Compile to static HTML in dist/
npx astro preview        # Serve dist/ locally to verify the production build
```

### Deploy

Push to `main` — GitHub Actions handles the rest automatically:
1. Checks out code
2. Installs dependencies (`npm ci`)
3. Runs `npx astro build`
4. Deploys `dist/` to GitHub Pages

### Firebase Functions

```bash
cd functions && npm install     # Install function dependencies
firebase deploy --only functions  # Deploy Cloud Functions
firebase deploy --only firestore:rules  # Deploy Firestore rules
```

Before first deploy, set email secrets:
```bash
firebase functions:secrets:set EMAIL_USER   # Gmail address to send from
firebase functions:secrets:set EMAIL_PASS   # Gmail app password
```

## Brand Identity

The design mirrors the Hoback Club aesthetic: refined, understated, alpine luxury. Think high-end resort, not promotional blast.

### Colors

| Name | Hex | Usage |
|------|-----|-------|
| Dark Blue | `#1e2d3a` | Header, footer, date badges, primary buttons, headings |
| Warm Tan | `#ede9e1` | Section backgrounds, secondary buttons |
| Light BG | `#f7f5f2` | Outer wrapper, spacers |
| White | `#ffffff` | Card backgrounds |
| Body Text | `#272f36` | Primary text (sparingly — prefer #666) |
| Secondary Text | `#666666` | Body paragraphs, descriptions |
| Muted | `#999999` | Captions, legal text |
| Accent Gray | `#7a8d98` | Subheadings, time text |
| Divider | `#e8e4df` | Horizontal rules, borders |

### Typography

- **Headlines:** Cormorant Garamond, weight 300 (light). Never bold headlines. Sizes: 32px hero, 28px section, 26px subsection. Fallback: `Georgia, 'Times New Roman', serif`
- **Body/UI:** Lato, weights 300/400/700. Body: 14px/300/#666/1.7 line-height. Buttons: 11px/700/uppercase/3px letter-spacing. Fallback: `Helvetica, Arial, sans-serif`

Google Fonts are loaded in BaseLayout.astro head:
```html
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Cormorant+Garamond:wght@300;400&display=swap" rel="stylesheet">
```

### Buttons

Five variants, all using bulletproof table pattern in emails (CSS in website):

| Variant | Background | Text | Use Case |
|---------|-----------|------|----------|
| Primary | `#1e2d3a` | white | Main CTAs |
| Tan | `#ede9e1` | `#1e2d3a` | Secondary CTAs on white cards |
| Outline | transparent | `#1e2d3a` | Tertiary actions |
| White Outline | transparent | white | CTAs on dark backgrounds |
| White Solid | white | `#1e2d3a` | High-emphasis on dark backgrounds |

All buttons: Lato 11px/700, uppercase, letter-spacing 3px, padding 12px 32px, no border-radius (square).

### Decorative Drawings

- **Teton Mountains** (`tetons_drawing4.png`): Intro/hero sections at **15% opacity**
- **Hoback Clubhouse** (`hoback_drawing1.png`): Closing sections at **25% opacity**
- **Jackson Tram** (`Jackson_tram.png`, `Jackson_tram_long.png`): Mountain/lifestyle sections

These are subtle watermarks — background texture, not focal content. Never increase opacity above 25%.

## Image Sources

Images come from three places:

1. **Local assets** (`public/images/`): Logos, drawings, card thumbnails, hero photos
2. **Club Essential CDN**: Dynamic member/property images at `https://hobackclub.com/images/dynamic/getImage.gif?ID={ID}` — these are referenced directly in templates
3. **Mailchimp CDN** (`mcusercontent.com`): Used in email templates only, not the website

### Key CE Image IDs Used

These IDs appear across pages for property/venue photos. The CE image server is managed by Club Essential — we reference their URLs directly:
- Format: `https://hobackclub.com/images/dynamic/getImage.gif?ID=XXXXX`

### Video Assets

| File | Size | Usage |
|------|------|-------|
| `Hoback_website_video.mp4` | ~103MB | Homepage hero (curtain reveal) |
| `flyover-hq.mp4` | ~56MB | Mountain page flyover section |
| `hoback-video.mp4` | ~32MB | Legacy/backup hero video |

## Page-by-Page Guide

### Homepage (`index.astro`)
**Purpose:** First impression — show the beauty, create desire to visit.
**Sections:** Video hero with curtain reveal animation → weather bar → mountain drawing → auto-scrolling image gallery → "Life at Hoback" showcase panels → seasons section (winter/summer) → card carousel → reserve your stay CTA.
**Key interactions:** Curtain reveal on hero, IntersectionObserver scroll animations, auto-scrolling gallery, animated number counters.

### Discover Us (`discover.astro`)
**Purpose:** Answer: What is Hoback Club? Where is it? What's great about Jackson Hole? What makes Hoback unique?
**Sections:** Hero → intro two-column → unique features grid → Jackson Hole full-width section → image grid → upcoming events → CTA.
**Intent:** Sell the location and the concept. Someone who's never heard of Hoback should leave this page understanding the value proposition.

### Come & Stay (`stay.astro`)
**Purpose:** Drive rental reservations. Show the beauty of the residences, make it easy to book.
**Sections:** Hero → intro → residence gallery → amenity cards → services → dining menu (dinner/lunch toggle) → reservation inquiry form (dark section) → CTA with phone number.
**Key feature:** The reservation form should always be accessible — it's the conversion point. Dining menu with toggle between dinner and lunch menus.
**Form endpoint:** `submitReservation` → Fields: firstName, lastName, email, phone, checkIn, checkOut, guests, comments.

### Amenities (`amenities.astro`)
**Purpose:** Demonstrate all amenities with minimal interaction needed. Excite adults, show kid activities too.
**Sections:** Hero → intro → 6 zigzag amenity blocks (alternating image left/right with scroll-reveal) → 12 quick-reference cards → parallax divider → CTA.
**Intent:** The page should feel like a visual tour. Minimal clicking — just scroll and absorb.

### Mountain (`mountain.astro`)
**Purpose:** Mountain conditions, trail info, hype Jackson Hole skiing/riding.
**Sections:** Gradient hero → weather bar → mountain report dashboard (3-column with SVG progress rings for snow/trails/lifts) → webcams (YouTube + roundshot + static) → trail explorer → flyover video (IntersectionObserver auto-play) → valley explorer accordion → image grid.
**Key feature:** Flyover video plays automatically when scrolled into view. Weather and conditions should feel like a real-time dashboard.

### Lifestyle (`lifestyle.astro`)
**Purpose:** What to do in Jackson Hole beyond skiing. Separate winter and summer activities.
**Sections:** 4-panel season hero (panels expand on hover) → intro → winter/summer activity toggle → activity card grids with 3D tilt effect → parallax divider → contact CTA.
**Intent:** Make JH feel like a year-round destination, not just a ski town. Link to contact page for trip planning.

### Membership (`membership.astro`)
**Purpose:** Membership inquiry — attract qualified applicants.
**Sections:** Hero → description paragraph → benefits grid → inquiry form with references textarea and "how did you hear" dropdown.
**Form endpoint:** `submitMembership` → Fields: firstName, lastName, email, phone, city, state, referral, references, comments.
**Intent:** The form asks for references intentionally — this is an exclusive club. The tone should be inviting but selective.

### Contact Us (`contact.astro`)
**Purpose:** Easy way to reach the club. Phone, email, and form.
**Sections:** Hero → contact info cards (phone/email/address) → contact form with subject dropdown → map placeholder.
**Form endpoint:** `submitContact` → Fields: firstName, lastName, email, phone, subject, message.

### Member Login (`login.astro`)
**Purpose:** Simple redirect to members.hobackclub.com (managed by Club Essential).
**Implementation:** Branded page with logo, brief message, and button linking to the external member portal. Not a real login form — just a handoff.

## Responsive Design

### Breakpoints
- **768px:** Primary mobile breakpoint — grids stack to single column, hamburger nav activates
- **900px:** Tablet adjustments
- **1024px:** Some grid transitions

### Mobile Priorities (Owner's Top Priority)
- All touch targets ≥44px (WCAG AAA)
- Form inputs at 16px font (prevents iOS auto-zoom)
- Side padding reduces to 20px
- All multi-column layouts stack vertically
- Headlines scale down (e.g., 4rem → 2.2rem)
- Images use max-width: 100% + object-fit

### Nav Behavior
- Desktop: Fixed header, transparent initially, gains dark background + backdrop blur on scroll. Logo swaps from shield to text.
- Mobile (≤768px): Hamburger icon, full-screen overlay menu with centered links.

## Firebase Cloud Functions

Three endpoints in `functions/index.js`:

| Function | Endpoint | Form Page |
|----------|----------|-----------|
| `submitContact` | `https://us-central1-hobackclub-website.cloudfunctions.net/submitContact` | Contact |
| `submitReservation` | `https://us-central1-hobackclub-website.cloudfunctions.net/submitReservation` | Stay |
| `submitMembership` | `https://us-central1-hobackclub-website.cloudfunctions.net/submitMembership` | Membership |

Each function:
1. Validates required fields and email format
2. Sanitizes all input (HTML entity encoding)
3. Stores submission in Firestore (`submissions` collection) with server timestamp
4. Sends branded HTML notification email to info@hobackclub.com
5. Returns JSON success/error response

CORS is restricted to `hobackclub.com`, `www.hobackclub.com`, and `localhost:4321` (dev).

## Related Repositories & Resources

- **Hoback_MailChimp**: Email template repo with its own CLAUDE.md, Mailchimp template language docs, and brand email patterns
- **Brand Guidelines**: `~/Desktop/Desktop_Files/Work/Hoback/hoback-demo/brand-guidelines/BrandGuidelines.html` — the single source of truth for all brand content, assets, and modules (Version 3.0)
- **hoback-demo**: Original hand-coded HTML site (legacy reference — do not deploy)

## Design Decisions & Rationale

- **No dark footer on inner pages:** The closing CTA section (tan background, "Questions or Special Requests?") is the visual endpoint. A heavy footer made emails and pages feel too long.
- **Tan buttons for secondary CTAs:** On white cards, tan is softer than dark blue. Dark blue is reserved for primary CTAs.
- **Time shown in two places on events:** Under the event title (prominent, catches the eye while scanning) AND in the detail line (provides full info block). Redundancy is intentional.
- **Mountain drawings at 15% opacity:** Higher opacity competed with headline text overlays. 15% keeps them as subtle texture.
- **Building drawing at 25%:** Slightly more visible because it sits beside text, not behind it.
- **PNG logo over SVG for shield:** Outlook desktop doesn't render SVG. The shield logo uses PNG for universal compatibility.
- **Member login as redirect:** Club Essential manages all member functionality at members.hobackclub.com. Our login page is just a branded handoff — no auth logic in this repo.

## Agent Development Notes

This codebase is actively developed by an AI agent via Claude Desktop / Cowork. The agent:
- Has read/write access to all files in this repo
- Can make git commits (user.name: "Hutch", user.email: qtyree1328@gmail.com)
- Cannot push to GitHub (no `gh` CLI or SSH keys in sandbox) — pushes must be done from the local terminal
- Cannot run the Astro dev server in a way accessible to the user's browser — use `npx astro dev` locally
- Uses the Hoback_MailChimp/CLAUDE.md for email template work (separate concern from this website)

### Development Workflow
1. Agent edits `.astro` files directly in the repo
2. Changes appear in VS Code immediately (same filesystem)
3. If `npx astro dev` is running locally, browser hot-reloads automatically
4. Agent can run `npx astro build` to verify compilation
5. User pushes to GitHub when ready, triggering auto-deploy

### Common Commands
```bash
npx astro dev              # Local dev server (http://localhost:4321)
npx astro build            # Production build to dist/
npx astro preview          # Preview production build locally
firebase deploy --only functions  # Deploy Cloud Functions
firebase deploy --only firestore:rules  # Deploy security rules
```
