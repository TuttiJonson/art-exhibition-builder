# ATELIER — Visual Design Specification

**Version:** 1.2 · Matches `PRD.md` v2.2 · Required root-level design file for the beginner JavaScript assignment.

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
| `--color-muted` | `#6B6762` | Secondary text (5.19:1 on `--color-bg`, 5.61:1 on `--color-surface`; do not place it on the Warm Gallery wall, where it measures 4.15:1) |
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
- Discover includes a labeled search field/button, horizontal/wrapping featured category chips, status/message line, then an artwork card grid. Cards show real artwork image contained within its box, title, artist, an `Explore` button, and an `Add to Exhibition` button that becomes the label `In your exhibition` once added. Avoid cropping paintings.
- Gallery + Editor includes a visually prominent CSS gallery preview, wall buttons `Front Wall`, `Left Wall`, `Right Wall`, three atmosphere swatches with readable names, exhibition title/theme controls, a selected-works list with move/remove actions, **Curatorial Insights**, an optional `View Gallery` (which never replaces the Finish Curating reveal), and primary `Finish Curating` button.
- Required controls are always visible; never reveal them only on hover.

### Gallery — expanded presentation

- Reuse the exact same DOM gallery stage as in Studio; enlarge its container with a CSS class instead of creating a new gallery or fetching art again.
- Light-touch overlay: title/theme at upper left; `My Collection` and `Edit Exhibition` at upper right; three wall-view buttons at bottom.
- Paintings are native HTML buttons containing an `<img>`. Clicking one opens the same `Explore the Artwork` detail component accessible from the collection drawer.
- Below 600px, the 2D wall layout replaces the perspective room (see Section 6).

### Opening overlay — after Finish Curating

- Calm editorial reveal: eyebrow `ATELIER PRESENTS`, title or `Untitled Exhibition`, optional theme, count of selected artworks, compact Curatorial Insights summary, primary `Enter My Gallery`, secondary `Keep Editing`.
- No autoplay video, no timed blockers, and no mandatory scroll. Follows the modal rules in Section 8.

### My Collection drawer / Artwork Details

- Drawer opens from right on desktop and as a near-full-screen panel on narrow mobile. Selected paintings shown as a stacked list with thumbnails, artists, and `Explore` actions (accessible name: `Explore the Artwork`, e.g. `Explore Water Lilies by Claude Monet`). The empty state is in Section 7; opening Explore from the drawer uses the details dialog's own loading and error states.
- Artwork Details is an accessible dialog/panel with image, title, artist, date, description heading, clearly separated **Held by / Collection**, **Currently on view** (always shown; reads `Current display status unavailable` when the museum gives no data), **Place of origin** (only if provided), and **View on Museum Website** link.
- Always retain a visible Close control and keyboard focus.

## 5. CSS-perspective gallery atmospheres

All three styles use the **same wall geometry and six positions** (two paintings per wall). Only room colors, CSS lighting effects, and floor styling change. The app shell stays neutral when an atmosphere changes.

Define three room tokens on the room element (defaults are the White Cube values) and override them per atmosphere with a `data-atmosphere` attribute, for example `.room[data-atmosphere="dark"]`. Room CSS uses only these tokens, never the raw hex values.

| Preset (`data-atmosphere`) | `--room-wall` | `--room-floor` | `--room-glow` |
|---|---|---|---|
| White Cube (`white-cube`, default) | `#F7F6F2` (same value as `--color-bg`, by design) | `#D9D5CF` | `rgba(255,255,255,0.35)` soft neutral |
| Warm Gallery (`warm`) | `#E8DCC9` | `#BFA88C` | `rgba(255,214,150,0.30)` warm diffuse |
| Dark Gallery (`dark`) | `#262626` | `#4A4541` | `rgba(255,244,220,0.18)` gentle focused glow; art remains legible |

The room's container has a defined edge in every atmosphere, so the White Cube wall (the same color as the page) does not disappear into the shell: 1px `--color-border` border, `--radius-md` corners, and a soft shadow such as `0 8px 24px rgba(0,0,0,0.08)`.

Each selected painting must retain natural proportions (`object-fit: contain`). A missing or broken image should show a neutral frame/placeholder, not an unrelated image.

## 6. Responsive behavior

- **Desktop >= 1000px:** Two columns, Discover 45% and Gallery + Editor 55%, separated by a clear 24px gap; artwork cards two columns.
- **One-column order (below 1000px):** Discover comes first, then Your Exhibition. A visible link in each section jumps to the other (`Skip to your exhibition` / `Back to Discover`), and the `My Collection (N/6)` button stays in the header.
- **Tablet 600–999px:** One-column Studio; gallery preview prominent above its controls. Consider two-column artwork cards where space permits.
- **Mobile <= 599px:** Single-column layout; the perspective room is replaced by the accessible 2D wall layout (six slots grouped under Front, Left and Right headings, same Explore buttons); buttons have approximately 44px minimum touch targets; drawer/overlay nearly full-width; no sideways scrolling at 375px.
- Preserve accessible zoom behavior; do not disable browser zoom. Avoid position-fixed controls that hide content behind an on-screen keyboard.

## 7. Five required data/UI states — exact visual placement

The five states are Empty, Loading, Error, Invalid input, and In use. Empty covers two cases (initial collection and zero search results); Loading and Error each cover two places (Discover results and the details dialog). These states must match PRD Section 9. Error messages are inline, not JavaScript `alert()` dialogs. Input guards (full gallery, duplicate artwork, Finish with zero artworks) and their copy are defined in the PRD.

| State | Where | Visual appearance | Required copy/action |
|---|---|---|---|
| **Empty / initial** | Studio gallery and collection drawer | Empty architectural gallery, quiet placeholder and `0/6` indicator | `Your gallery is waiting for its first masterpiece.` / `Choose a painting to bring your gallery to life.` Collection: `Your collection is empty. Add a painting to start exploring.` + `Browse Artworks` |
| **Empty / zero search results** | Discover results area under search | Spacious neutral message replacing card grid | `No paintings found. Try a different artist or keyword.` + `Clear Search` |
| **Loading** | Discover results area; story/location region of details dialog | Quiet skeleton cards or `role="status"` text; no whole-page blocking overlay | `Finding artworks…` or `Loading artwork details…`; preserve gallery/collection |
| **Error** | Discover results area, or directly in story/location region of details dialog | Muted red left border/text; high-contrast Retry button; other UI remains operable | `We couldn't load artworks right now. Your exhibition is safe.` + `Retry` / `Artwork details are temporarily unavailable.` + `Retry Details` |
| **Invalid input** | Immediately under search field | Legible red help text with `aria-describedby`, `aria-invalid` | `Enter an artist, artwork, or subject to search.` or `Keep your search under 120 characters.`; no request sent |
| **In use** | Results grid, gallery wall, selected works, My Collection, Details, Curatorial Insights | Real images, functional buttons, dynamically updated values | Show actual result metadata. Curatorial Insights shows the computed distinct artist count and creation-year span from selected records (not raw metadata); clear view/selection state |

Never use red for expected empty results.

### Guarded interactions — placement

Expected limits use muted text; only real failures use the error red. Copy is defined in PRD Section 9.

| Message | Where | Look |
|---|---|---|
| `Gallery full — remove a painting to add another.` | Under the Discover status line, and as `aria-describedby` text on each disabled Add button | Muted text |
| `Add at least one painting to finish.` | Directly under the disabled `Finish Curating` button | Muted text |
| `Changes cannot be saved in this browser.` | Slim notice at the top of Your Exhibition, visible for as long as saving fails | Neutral bordered strip, `role="status"` |
| Corrupted-storage recovery notice | Same strip, dismissible | Neutral bordered strip, `role="status"` |
| `Start a new exhibition? Your current selection will be replaced.` | Centered `<dialog>` with `Start New` and `Cancel` | Standard modal rules from Section 8 |

## 8. Accessibility and interaction details

- Semantic `header`, `main`, `section`, `nav` (where applicable), `form`, `label`, `button`, and `dialog`/modal semantics. No click-only `<div>` masquerading as a button.
- All important actions keyboard accessible; visible `:focus-visible` outlines with `--color-focus` (at least 2px). Keep text legible at WCAG AA contrast where practicable. Inside the gallery room (all three atmospheres), painting buttons use a two-layer focus ring, a 2px `#FFFFFF` inner ring plus a 2px `--color-focus` outer ring (for example `box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px var(--color-focus)`), because `--color-focus` alone measures only 2.15:1 against the Dark Gallery wall.
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
- [ ] All five states in §7 have visibly distinct designed treatments.
- [ ] Artwork details clearly distinguish holding museum from current display location and offer a real museum page link (§4).
- [ ] No horizontal overflow at 375px; controls are comfortably touchable (§6).
- [ ] End-to-end gallery and details work with keyboard only (§8).
