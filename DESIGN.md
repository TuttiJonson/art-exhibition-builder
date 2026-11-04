# ATELIER — Visual Design Specification

**Version:** 1.1 · Required root-level design file for the beginner JavaScript assignment.

The implementation in `css/styles.css` and `index.html` MUST follow this file. `PRD.md` contains functionality, API, state, security, and acceptance rules (including input guards, safe text rendering, and the New Exhibition confirmation). If implementation changes these visual design choices, update this file rather than allowing it to drift out of sync.

## 1. Visual idea

**Positioning:** A quiet, editorial digital art museum, with artwork—not decorative UI—supplying the strongest color. Contemporary museum, not a gaming dashboard.

**Brand:** `ATELIER.` with a compact subtitle, “Your museum. Your vision.” Default mode launches directly into the Studio. No blocking onboarding, sign-in, or welcome page.

## 2. Allowed technology and assets

- Only HTML, CSS, and vanilla JavaScript authored in this repository. No frameworks, libraries, package managers, icon packs, hosted CSS, external fonts, or scripts loaded from a CDN.
- Use local CSS and locally authored inline SVG or ordinary Unicode characters for icons. Prefer CSS borders/icons where possible.
- Images of real art come from the museum API's referenced IIIF image service. They are user data, not external UI decorations or library assets. No other externally hosted photographs.
- The spatial gallery uses local DOM elements + native CSS `perspective`, `rotateY`, `translate3d`, shadows, and backgrounds. Do not require WebGL or load a 3D engine.

## 3. Design tokens

Use a single set of CSS custom properties on `:root`, and reuse them across pages/components rather than repeating magic values.

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#F7F6F2` | App background |
| `--color-surface` | `#FFFFFF` | Cards, modal surfaces |
| `--color-ink` | `#242424` | Main text and filled primary buttons |
| `--color-muted` | `#77736E` | Secondary text |
| `--color-border` | `#DEDAD3` | Dividers, field borders |
| `--color-focus` | `#2656A8` | Clearly visible keyboard focus |
| `--color-error` | `#A33B32` | Error text and error boundary |
| `--color-success` | `#2A654B` | Confirmation status text |
| `--radius-sm` | `6px` | Inputs and buttons |
| `--radius-md` | `12px` | Cards and panels |
| `--space-1` | `4px` | Micro spacing |
| `--space-2` | `8px` | Control gap |
| `--space-3` | `12px` | Small spacing |
| `--space-4` | `16px` | Regular spacing |
| `--space-6` | `24px` | Section spacing |
| `--space-8` | `32px` | Large spacing |

**Typography:** Heading/wordmark: `Georgia, 'Times New Roman', serif`. Body, forms, labels: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`. Body 16px/1.5; mobile body 16px; page headline ~32–44px desktop / 28–34px mobile; section headings 20–24px. Text should be selectable, accessible, and not part of an image.

## 4. Screen layout

Breakpoints and column splits are defined once, in Section 6.

### Studio — default screen

- Header, left-aligned ATELIER wordmark and subtitle; right-aligned always-visible `My Collection (N/6)` and unobtrusive `New Exhibition`.
- Discover includes a labeled search field/button, horizontal/wrapping featured category chips, status/message line, then an artwork card grid. Cards show real artwork image contained within its box, title, artist, and Add/Added button. Avoid cropping paintings.
- Gallery + Editor includes a visually prominent CSS gallery preview, wall buttons `Front`, `Left`, `Right`, three atmosphere swatches with readable names, exhibition title/theme controls, a selected-works list with move/remove actions, **Curatorial Insights**, `Preview Gallery`, and primary `Finish Curating` button.
- Required controls are always visible; never reveal them only on hover.

### Gallery — expanded presentation

- Reuse the exact same DOM gallery stage as in Studio; enlarge its container with a CSS class instead of creating a new gallery or fetching art again.
- Light-touch overlay: title/theme at upper left; `My Collection` and `Edit Exhibition` at upper right; three wall-view buttons at bottom.
- Paintings are native HTML buttons containing an `<img>`. Clicking one opens the same `Explore the Artwork` detail component accessible from the collection drawer.
- For small screens, a 2D wall/cards layout is an acceptable alternative to unreadably small perspective artwork.

### Opening overlay — after Finish Curating

- Calm editorial reveal: eyebrow `ATELIER PRESENTS`, title or `Untitled Exhibition`, optional theme, count of selected artworks, compact Curatorial Insights summary, primary `Enter My Gallery`, secondary `Keep Editing`.
- No autoplay video, no timed blockers, and no mandatory scroll. Follows the modal rules in Section 8.

### My Collection drawer / Artwork Details

- Drawer opens from right on desktop and as a near-full-screen panel on narrow mobile. Selected paintings shown as a stacked list with thumbnails, artists, and `Explore` actions. Empty and error states are in Section 7.
- Artwork Details is an accessible dialog/panel with image, title, artist, date, description heading, clearly separated **Held by / Collection**, **Currently on view** (if known), **Place of origin** (only if provided), and **View on Museum Website** link.
- Always retain a visible Close control and keyboard focus.

## 5. CSS-perspective gallery atmospheres

All three styles use the **same wall geometry and six positions** (two paintings per wall). Only room colors, CSS lighting effects, and floor styling change. The app shell stays neutral when an atmosphere changes.

| Preset | Wall | Floor | Shadow/highlight |
|---|---|---|---|
| White Cube (default) | `#F7F6F2` (same value as `--color-bg`, by design) | `#D9D5CF` | Soft neutral |
| Warm Gallery | `#E8DCC9` | `#BFA88C` | Warm diffuse |
| Dark Gallery | `#262626` | `#4A4541` | Gentle focused glow; art remains legible |

Each selected painting must retain natural proportions (`object-fit: contain`). A missing or broken image should show a neutral frame/placeholder, not an unrelated image.

## 6. Responsive behavior

- **Desktop >= 1000px:** Two columns, Discover 45% and Gallery + Editor 55%, separated by a clear 24px gap; artwork cards two columns.
- **Tablet 600–999px:** One-column Studio; gallery preview prominent above its controls; Discover still easily reachable. Consider two-column artwork cards where space permits.
- **Mobile <= 599px:** Single-column layout; gallery stage is compact or replaced with accessible 2D cards; buttons have approximately 44px minimum touch targets; drawer/overlay nearly full-width; no sideways scrolling at 375px.
- Preserve accessible zoom behavior; do not disable browser zoom. Avoid position-fixed controls that hide content behind an on-screen keyboard.

## 7. Six required data/UI states — exact visual placement

These states must match PRD Section 9A. Error messages are inline, not JavaScript `alert()` dialogs. Input guards (full gallery, duplicate artwork, Finish with zero artworks) and their copy are defined in the PRD.

| State | Where | Visual appearance | Required copy/action |
|---|---|---|---|
| **Empty / initial** | Studio gallery and collection drawer | Empty architectural gallery, quiet placeholder and `0/6` indicator | `Your gallery is waiting for its first masterpiece.` / `Choose a painting to bring your gallery to life.` Collection: `Your collection is empty. Add a painting to start exploring.` + `Browse Artworks` |
| **Empty / zero search results** | Discover results area under search | Spacious neutral message replacing card grid | `No paintings found. Try a different artist or keyword.` + `Clear Search` |
| **Loading** | Discover results area; story/location region of details dialog | Quiet skeleton cards or `role="status"` text; no whole-page blocking overlay | `Finding artworks…` or `Loading artwork details…`; preserve gallery/collection |
| **Error** | Discover results area, or directly in story/location region of details dialog | Muted red left border/text; high-contrast Retry button; other UI remains operable | `We couldn't load artworks right now. Your exhibition is safe.` + `Retry` / `Artwork details are temporarily unavailable.` + `Retry Details` |
| **Invalid input** | Immediately under search field | Legible red help text with `aria-describedby`, `aria-invalid` | `Enter an artist, artwork, or subject to search.` or `Keep your search under 120 characters.`; no request sent |
| **In use** | Results grid, gallery wall, selected works, My Collection, Details, Curatorial Insights | Real images, functional buttons, dynamically updated values | Show actual result metadata. Curatorial Insights shows the computed distinct artist count and creation-year span from selected records (not raw metadata); clear view/selection state |

Never use red for expected empty results.

## 8. Accessibility and interaction details

- Semantic `header`, `main`, `section`, `nav` (where applicable), `form`, `label`, `button`, and `dialog`/modal semantics. No click-only `<div>` masquerading as a button.
- All important actions keyboard accessible; visible `:focus-visible` outlines with `--color-focus` (at least 2px). Keep text legible at WCAG AA contrast where practicable.
- Decorative room elements have `aria-hidden="true"`. Actual artwork controls expose meaningful accessible names (e.g. `Explore Water Lilies by Claude Monet`).
- `aria-live="polite"` for loading/status and summary updates; avoid incessant screen-reader announcements while typing.
- Every modal, overlay, and drawer: move focus in, Escape closes, return focus to trigger.
- Respect `@media (prefers-reduced-motion: reduce)`; transitions should become negligible. Do not make view transitions a prerequisite for any action.

## 9. Visual acceptance checklist

Requirements are defined in the sections above; this list is for final verification only.

- [ ] `DESIGN.md` exists at repo root and CSS implements its token choices (§3).
- [ ] No external styles/scripts/fonts/assets apart from museum API artwork data/images (§2).
- [ ] The Studio loads without sign-in or intro form; collection control is obvious (§1, §4).
- [ ] Users can tell which wall is selected and which atmosphere is active without relying on color alone (§4, §5).
- [ ] All six states in §7 have visibly distinct designed treatments.
- [ ] Artwork details clearly distinguish holding museum from current display location and offer a real museum page link (§4).
- [ ] No horizontal overflow at 375px; controls are comfortably touchable (§6).
- [ ] End-to-end gallery and details work with keyboard only (§8).
