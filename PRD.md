# ATELIER — Product Requirements Document

**Version:** 2.2 — audience-led, classroom-compliant rewrite (reviewed and amended) · Design rules: `DESIGN.md` v1.2
**Project/repository name:** `art-exhibition-builder`
**Primary audience:** An art-loving mother who enjoys discovering paintings, learning their stories, and visiting museums
**Build target:** Public, responsive static website deployed on GitHub Pages
**Implementer:** Claude Code, following this document and the root-level `DESIGN.md`

> **One-sentence product definition:** ATELIER is a personal art-curation website where someone who loves art can discover real paintings, choose up to six favorites, display them in a virtual exhibition, learn their stories, and find out which museum holds them and whether they are currently on view when the museum provides that information.

## 1. The person we're building for

**Primary persona: My mother, an art enthusiast.** She enjoys looking at paintings and learning about artists. She is curious about the meaning and history of pieces that catch her attention. When she finds an artwork she loves, she wants an easy way to remember it, see it next to other favorites, and answer a practical question: *“Where could I go to see this in real life?”*

**Problem:** Many museum websites are designed for browsing one artwork at a time. It's easy to admire something, move on, and forget its name, story, or location. Creating a personal collection or imagining a curated exhibition can be harder than it needs to be. She has also said she wishes she could be a creator herself but couldn't figure out the visual side; ATELIER lets her become a curator without design skills.

**ATELIER's promise:** Make art discovery feel personal and welcoming. Users do not need prior art-history knowledge, accounts, or curatorial expertise. They can follow their curiosity and build a small exhibition that tells them more about their tastes.

**Product value:** ATELIER is not a general art-search engine, a virtual tour of the Art Institute, or a database of every museum. It is a **personal discovery and curation experience** built on real museum collection information.

**Primary success scenario:** My mom opens the site, selects three paintings she likes, sees them appear on gallery walls, opens one to read its story and see its museum/display information, and enjoys the exhibition she created—all without help.

## 2. Assignment requirements — non-negotiable

The completed project MUST meet every requirement below:

1. Plain **HTML, CSS, and vanilla JavaScript only**. **No** React, Tailwind, A-Frame, Three.js, Bootstrap, jQuery, other frameworks/libraries, package managers, or build step. **No scripts, styles, fonts, icon kits, or other app assets loaded from a CDN.** CSS perspective/transforms create the spatial gallery illusion; do not implement a WebGL engine. Artwork imagery itself comes from the museum's image service as part of fetched artwork data (these are `<img>` URLs returned by the API, not app assets; the README must say so).
2. Fetch **real data from at least one API using browser-side `fetch()` and `await`**. Use the Art Institute of Chicago's public API, without an API key.
3. Every `fetch()` occurs in a `try/catch`; check `response.ok` **before** reading the JSON. Detect unexpected/error response bodies; a 404 does not throw by itself. Handle request rejection, malformed JSON, and HTTP/API errors.
4. Give users choices that change what the app requests or displays: search, browse themes/categories, select/reorder artworks, choose a gallery atmosphere.
5. **Calculate output from the returned data** rather than merely listing the API response: Curatorial Insights must compute unique-artist count and the time span between the earliest and latest known creation years in the selected works.
6. Implement and visually design **Empty, Loading, Error, Invalid Input, and In Use** states exactly as Section 9 describes. Include both the initial empty collection and zero-results search.
7. Put **`PRD.md` and `DESIGN.md` in the root of the repository**. Follow the design tokens, typography, layouts, and responsive rules in `DESIGN.md`.
8. Use semantic, accessible HTML and a layout that works on a phone, including narrow widths around 375px; no horizontal overflow, unlabeled controls, or hover-only functionality.
9. **No API key, token, or secret anywhere in the repository.** No backend required.
10. Publish from the public GitHub repository `TuttiJonson/art-exhibition-builder` using **GitHub Pages**. The live URL is `https://tuttijonson.github.io/art-exhibition-builder/` and must actually work.

**Implementation policy:** Build a reliable version of the core experience first. If CSS perspective is difficult on a device, the 2D gallery fallback must still deliver the full art-learning experience. Do not add other features in place of a required state or calculation.

### 2.1 Build priority tiers

When time runs short, cut from the bottom. Never cut a higher tier to finish a lower one.

| Tier | Contents |
|---|---|
| **1 — Graded, must exist** | `fetch` + `await` + `try/catch` + `response.ok` on every request; Discover (Featured, categories, search); all five UI states; Curatorial Insights calculations; semantic responsive HTML; `PRD.md` + `DESIGN.md` + `README.md`; GitHub Pages live; no keys/CDN/frameworks |
| **2 — Core experience** | Add/remove/reorder up to six; localStorage; live gallery (2D grid is acceptable here); Explore the Artwork dialog with on-demand details; My Collection drawer |
| **3 — Polish** | CSS perspective room and three wall views; Warm/Dark atmospheres; themes; Finish Curating opening overlay; Escape/focus refinements beyond the basics |

## 3. Product boundaries and confirmed decisions

| Decision | Requirement |
|---|---|
| First visit | Open directly into the **Studio**; no mandatory introduction or setup form. |
| Artwork source | **Art Institute of Chicago** API only for Version 1. Clearly identify the source and its scope. |
| Artwork type | Display eligible **public-domain paintings** with usable images; do not represent sculpture or prints as paintings. |
| Exhibition size | **Maximum six paintings**, in one fixed-size gallery. |
| Layout | Three walls, **two slots per wall**. Placement is automatic. |
| Reordering | Simple **Move Earlier / Move Later** buttons; no drag-and-drop. |
| Navigation | **Three fixed wall viewpoints**: Front, Left, Right. No first-person walking for MVP. |
| Gallery style | **White Cube**, **Warm Gallery**, **Dark Gallery** presets. |
| Curation identity | Editable title and **optional** theme, with preset suggestions and a custom text option. |
| Art discovery | Both a search field and preselected Featured/category buttons. |
| Art education | Every saved painting can open **Explore the Artwork**, including museum description and holding/display information when available. |
| Gallery interaction | Clicking/tapping a painting in the gallery opens the **same** Explore the Artwork view. |
| Saved list | Persistent **My Collection (N/6)** button in upper-right corner, accessible from Studio and Gallery. |
| Completion | **Finish Curating** reveals an exhibition-opening moment, but **does not lock editing**. |
| Persistence | **One exhibition** saved automatically in `localStorage` on this browser; no account, backend or public sharing. |

**Clarifications:** An optional theme is an expression of the user's taste, not an algorithm that judges their choices. The on-view status of a painting is an external fact that can change; it should be fetched on demand and never described as guaranteed.

## 4. The journey, step by step

1. **Arrive and explore.** Opening ATELIER takes the visitor straight to the Studio. They see a beautiful empty gallery and a Discover section with artwork suggestions ready to browse. No sign-in required.
2. **Search or browse.** They search for “Monet,” or choose Featured, Nature, Portraits, City Life, or Abstract & Contemporary. The page fetches real artwork metadata and displays image cards.
3. **Choose a favorite.** Clicking **Add to Exhibition** adds the selected work to the collection. The counter updates from `0/6` to `1/6`, and the painting visibly appears on its assigned wall without a page refresh.
4. **Learn about the art.** Clicking **My Collection (1/6)** at the top right opens their saved list. Choosing **Explore the Artwork** reveals the painting's image, artist, date, story, and reliable museum/display details. The same information can be opened by clicking the painting in the gallery.
5. **Keep curating.** They select up to six artworks, change their order, name the exhibition, optionally add a theme, and choose a gallery atmosphere.
6. **Understand the collection.** Curatorial Insights computes and displays a summary based on the paintings selected, such as how many distinct artists are represented and how many years separate the earliest and latest known works.
7. **Finish and visit.** Clicking **Finish Curating** presents an elegant opening overlay with the exhibition's title. They click **Enter My Gallery** to browse the three wall views and explore individual paintings.
8. **Return or restart.** They can click **Edit Exhibition** at any time. Changes save automatically in the same browser. **New Exhibition** requires confirmation because it replaces the existing one.

The signature loop is **discover → add → see it appear → learn its story → continue curating**. That loop takes priority over advanced visual effects.

## 5. Screen-by-screen UI requirements

### 5.1 Studio — default screen

**Desktop layout:** Two-column composition with **Discover** on the left (~45%) and **Your Exhibition** on the right (~55%). Follow exact layout values in `DESIGN.md`. When the layout is a single column (below 1000px), **Discover comes first, then Your Exhibition**, with a visible jump link between them.

**Header:** ATELIER. wordmark, small subtitle *“Your museum. Your vision.”*, an obvious **My Collection (N/6)** button in the top-right, and a secondary **New Exhibition** action.

**Discover panel:**
- A labeled search field with placeholder `Search an artist, artwork, or subject`, a **Search** button, and Enter-key submission.
- Category chips/buttons: **Featured**, **Nature**, **Portraits**, **City Life**, **Abstract & Contemporary**. These issue different museum searches; do not make decorative filter buttons.
- A clear results/status area for the five required UI states.
- Artwork cards: accurate image, painting title, artist, optional date, **Add to Exhibition**, and **Explore** (view details without adding).
- Added artworks show **In your exhibition** instead of an active duplicate Add button.

**Your Exhibition panel:**
- A prominent live gallery preview with visible room perspective or 2D fallback.
- Wall controls: **Front Wall**, **Left Wall**, **Right Wall**.
- Counter: `0 / 6 artworks`, updating immediately after additions/removals.
- Editable exhibition title (`Untitled Exhibition` as a display fallback).
- Optional theme controls: suggested themes **Nature**, **Dreams**, **Humanity**, **Color & Light**, **My Own Theme**, plus **None**. Custom text is limited to 80 characters. No theme is required to add art.
- Atmosphere choices: **White Cube** (default), **Warm Gallery**, **Dark Gallery**. Only room wall/floor/light styling changes; artwork itself is not recolored.
- Ordered list of selected paintings with **Explore**, **Move Earlier**, **Move Later**, and **Remove** actions. Disable boundary moves appropriately.
- **Curatorial Insights** module (Section 7).
- Primary **Finish Curating** button enabled once at least one painting is selected. A separate **View Gallery** action is optional but may not replace the opening moment.

**Live placement:** Adding a painting immediately updates its CSS gallery image and shifts the active view to the wall that receives it. Removing/reordering recomputes positions using the selected-artwork array order.

### 5.2 My Collection drawer — top-right saved paintings

**Entry:** **My Collection (N/6)** is visible in both Studio and Gallery. It opens a drawer or accessible panel from the right; on mobile it may fill most of the screen.

**Contents:** selected artworks in exhibition order, with thumbnail, title, artist, an **Explore** button (accessible name: **Explore the Artwork**, e.g. “Explore Water Lilies by Claude Monet”), and Close control. Use the same selected collection—not a second favorites system.

**Empty:** `Your collection is empty. Add a painting to start exploring.` Provide **Browse Artworks** to return to Discover.

**Behavior:** Clicking an item opens the detail dialog described next. When the details close, return to the drawer when that is where the user came from. Closing the drawer returns focus to the button that opened it. Pressing Escape closes the active dialog/drawer.

### 5.3 Explore the Artwork — educational detail view

This is a **core feature**, not a stretch goal. It's why ATELIER is useful to an art lover like the primary user.

**Entry points:** (a) from My Collection, (b) from a saved-artwork row, (c) by clicking/tapping the framed painting in either the gallery preview or Gallery mode, and (d) from the **Explore** button on any Discover result, with no need to add it first.

**Display hierarchy:**
1. Large artwork image and full title.
2. Artist, creation date, and medium when available.
3. Heading **The Story Behind the Artwork**. Show museum-supplied `short_description`, else `description`, as readable text. Museum description fields may contain HTML: extract safe text rather than injecting untrusted HTML (for example, parse with `DOMParser` and read `textContent`, or strip tags, then insert with `textContent`). If absent, say `The museum has not provided a description for this artwork.` Do not fabricate explanations.
4. Heading **Where Can I Find It?** Clearly separate:
   - **Holding collection:** `Art Institute of Chicago`, because Version 1 uses that institution's collection API. This is not a promise that the artwork is physically hanging there today.
   - **Current display status:** if `is_on_view === true`, show `Reported on view at the Art Institute of Chicago` and `gallery_title` if returned. If `is_on_view === false`, say `Not listed as currently on view at the museum`. If the museum provides loan information, show `on_loan_display` as an attributed note. If missing/unknown, say `Current display status unavailable`.
   - **Place of origin:** `place_of_origin` if known, under its own label. **Never confuse place of origin with current location.**
5. A real outbound link **View on Museum Website**, for example `https://www.artic.edu/artworks/{id}`, and the note `Museum displays may change. Check the official website before visiting.`
6. Attribution: `Artwork information: Art Institute of Chicago` with the official record link, including appropriate credit for museum-provided descriptions.

**Data freshness:** Fetch individual artwork details when the dialog opens. Loading/error states belong **inside the dialog**, not on a blank page. The visitor's saved painting remains intact even if the detail request fails. Do not persist `is_on_view` or gallery room names as permanently current facts.

**Implementation note:** Use the native `<dialog>` element with `showModal()` for the detail view and overlay; it provides focus trapping, Escape handling, and a backdrop without a library, and is easy to explain in class.

### 5.4 Gallery mode — visit the finished exhibition

- A larger version of the **same selected collection and room**, not a second independently managed scene.
- Minimal interface with exhibition title, optional theme, **My Collection (N/6)**, **Edit Exhibition**, and wall-view controls.
- Six fixed artwork positions: two on Front Wall, two on Left Wall, two on Right Wall. Empty positions stay discreet/blank.
- Each displayed painting is a focusable, clickable native HTML button that opens **Explore the Artwork**.
- Use CSS `perspective`, transforms, borders, shadows, and simple shapes to create the architectural illusion. **No 3D library.** Offer a full-function **2D artwork grid fallback**, chosen by a CSS media query alone: viewports **below 600px** show the 2D layout (the same six slots grouped under Front, Left and Right headings, with the same click-to-Explore behavior); 600px and wider show the perspective room. No browser feature detection.
- The selected theme/atmosphere changes visual context only; it never alters the original artwork image.

### 5.5 Finish Curating — exhibition opening

- The button is disabled until at least one painting is selected.
- Clicking it opens a polished but quick overlay: `ATELIER PRESENTS`, exhibition title (or `Untitled Exhibition`), optional theme, artwork count, and a brief Curatorial Insights summary.
- Buttons: **Enter My Gallery** (primary) and **Keep Editing** (secondary). Escape closes the overlay.
- This is a celebration, **not publication**. Editing remains possible afterward, and finishing can be repeated.

## 6. Painting placement and personalization rules

Array position determines wall slot; never maintain a second competing placement database:

| Selected array index | Wall position |
|---|---|
| 0 | Front Wall — left |
| 1 | Front Wall — right |
| 2 | Left Wall — first |
| 3 | Left Wall — second |
| 4 | Right Wall — first |
| 5 | Right Wall — second |

- On adding the first artwork, counter becomes `1/6` and the Front Wall is displayed.
- On adding the third artwork, automatically switch to Left Wall so the newly added painting is visible.
- On removing an artwork, the remaining list closes the gap and the wall positions are recalculated.
- Reordering does not modify the source artwork record, only its position in the selected list.
- Preserve artwork proportions using `object-fit: contain`; do not stretch paintings or crop out substantial content to fill a frame.
- Never allow more than six paintings or the same artwork twice.
- Changing wall view must not change selected order or send an API request.

## 7. Calculated output — Curatorial Insights (graded requirement)

**Why this is required:** The assignment does not accept simply displaying whatever the API returns. ATELIER must process API-derived metadata into a new answer about the user's exhibition.

Use **only the selected painting records** to calculate, update immediately on Add/Remove/Reorder:

1. **Total artworks:** `selected.length` out of 6.
2. **Distinct artists:** count unique artists using a `Set` of `artist_title` values, trimmed and lowercased for comparison. If `artist_title` is missing or blank, the painting has no artist key: it is labeled “Artist unknown” on cards and in the details view, and it is **not** counted as an artist (and never as a separate artist each time). When this happens the insight says so, e.g. “3 artists (1 painting with unknown artist not counted).”
3. **Historical span:** from paintings with a valid numeric `date_start`, compute `latestYear - earliestYear`; also display earliest and latest known years. Use only actually returned years; never infer a year from an unparseable description.

**Examples of behavior (examples are not fixed output):**
- Empty: `Add paintings to discover the story of your collection.`
- One painting: `1 artwork · 1 artist · Created in 1884` (if year is known); no invented time span.
- Multiple dated paintings: `Your exhibition brings together 4 artists and spans 120 years of art history.` The actual numbers must be derived dynamically.
- No usable years: `Creation dates aren't available for enough of these artworks to calculate a time span.`
- Only one usable year among several paintings: display that one known year but do not claim a multi-artwork range.

**Acceptance check:** Selecting a second artist changes the distinct-artist result. Adding an artwork with a different known year changes the chronological span. Removing a work recomputes all values. These are genuine JavaScript calculations from API metadata.

`calculateInsights()` must be a pure function (selected array in, result object out, no DOM access) so it can be demonstrated and explained on its own.

### 7.1 Curatorial Reflection (written thread)

Below the Insights numbers, the Studio shows a short **Curatorial Reflection**: a few sentences naming the idea or feeling that connects the selected paintings, written for visitors who may not have words for what they feel in front of art. It is **not AI-generated and uses no extra service**: `buildReflection()` is a pure function that matches the museum's own `subject_titles` tags (requested in the existing `fields=` list, along with `style_title`) to a fixed set of human themes (nature and time, the human face, closeness and home, faith, struggle and mortality, everyday life, myth and imagination, color and form). The theme shared by the most paintings leads the text; a second shared theme and the year span can add a sentence.
- Fewer than two paintings: `Add at least two paintings and ATELIER will look for the thread that connects them.`
- No theme shared by at least two paintings: an honest message that the thread is the visitor's own choice, with a nudge to title the exhibition.
- Shown under the stats with a `Shared subjects:` evidence line and the note that it is not AI-generated, and repeated in the Finish Curating overlay.
- Paintings saved before subjects existed are filled in once at start-up with one `/artworks?ids=…&fields=id,subject_titles` request; if it fails, the reflection just has less to work with.

## 8. Museum API, live data, and network rules

**API name:** Art Institute of Chicago Public API
**Base URL:** `https://api.artic.edu/api/v1` (define once as a constant in `js/script.js`; every endpoint below is built from it)
**Documentation:** https://api.artic.edu/docs/
**Example artwork endpoint (checked 2026-11-04, returns 200):** https://api.artic.edu/api/v1/artworks/27992
**Search endpoint:** `https://api.artic.edu/api/v1/artworks/search?q=monet`
**Image pattern:** `https://www.artic.edu/iiif/2/{image_id}/full/843,/0/default.jpg`, using the returned `config.iiif_url` if available.

### API fields to use

| Field | Purpose |
|---|---|
| `id` | Stable artwork ID, avoid duplicates, construct official record link |
| `title` | Card, collection, label, detail title |
| `artist_title` / `artist_display` | Artist label and distinct-artist calculation (`artist_display` is multi-line with dates and nationality; use `artist_title` for counting) |
| `date_display`, `date_start` | Visible date; historical span calculation |
| `image_id`, `thumbnail` | Museum artwork image, aspect ratio (`thumbnail.width`/`height`), alt text (`thumbnail.alt_text`) |
| `is_public_domain` | Show eligible works |
| `artwork_type_title` / `classification_title` | Keep results to paintings |
| `short_description`, `description` | Educational story, loaded on demand |
| `medium_display`, `place_of_origin` | Optional details |
| `is_on_view`, `gallery_title`, `on_loan_display` | Reported display information, fetched on demand |

### Discover requests

- On Studio load, automatically fetch one **Featured** artwork set so the page is useful immediately, even before a search. **Featured** uses the museum's own highlighted set: the same filters as below plus `query[bool][filter][2][term][is_boosted]=true` and **no search text** (checked 2026-11-04: 120 public-domain painting highlights, e.g. Van Gogh's *The Bedroom*, Seurat's *La Grande Jatte*). Do not ship hardcoded artwork data masquerading as a live response.
- The other category buttons each send a different text query: Nature=`landscape`, Portraits=`portrait`, City Life=`city`. Abstract & Contemporary instead filters on the museum's own `classification_titles` value `modern and contemporary art` and excludes the Impressionism and Post-Impressionism styles. These are search hints, not exact art-historical classifications. Featured has its own source, so it never duplicates a category.
- Explicit Search button/Enter sends a trimmed, URL-encoded search string. Don't send network requests on every keystroke. Empty/whitespace-only queries are invalid and must be refused locally.
- **Filter on the server, not just the client, and put the search text INSIDE the `query` object.** The search endpoint accepts Elasticsearch-style queries. **Do not use the `q=` parameter together with `query[...]` filters: it was tested on 2026-11-04 and the search text is ignored, so every search (even nonsense) returned all 1,965 paintings and the zero-results state could never appear.** Use this shape instead (checked: `monet` returns 39 paintings with Monet's own first, `van gogh` as a phrase returns 10, and nonsense returns 0):
  - filters: `query[bool][filter][0][term][is_public_domain]=true` and `query[bool][filter][1][term][artwork_type_title.keyword]=Painting`
  - text: `query[bool][must][0][multi_match][query]=<user text>` with `query[bool][must][0][multi_match][fields][]=artist_title^5`, `title^3`, `short_description`, and `subject_titles` (boosting the artist and title so an artist search lists that artist's paintings first)
  - for every query (one word or several), also set `query[bool][must][0][multi_match][type]=cross_fields` and `query[bool][must][0][multi_match][operator]=and`, so each word must match somewhere (checked: `monet water lilies` returns 3 Monet paintings; `van gogh` returns Van Gogh's paintings first, then a few that mention him; nonsense returns 0). Because description text is searched too, a search can also list paintings by other artists whose description mentions the search words; this is intended for "artist, artwork, or subject" search, and the artist's own paintings rank first.

  Build the URL with `URLSearchParams` so brackets and user text are encoded. Still re-check `is_public_domain`, `artwork_type_title`, and `image_id` on the client before rendering, and drop anything ineligible.
- Request only the fields needed via `fields=`, and request `limit=22` results. **Display 8 to 18 paintings**: after the client-side eligibility re-check, show the first 18 that pass, or all of them if fewer than 18 pass (including fewer than 8). **Do not request or store `thumbnail.lqip`** (a base64 blur placeholder that bloats responses and localStorage): ask for `fields=...,thumbnail.alt_text` (checked: the API returns only the alt text when asked this way) and keep only that.
- If fewer eligible results exist, show only those. The results grid always reflects the real API response.
- Check the response's `data` shape (`Array.isArray`); keep the current saved collection untouched if search fails. Prevent old, slow searches from overwriting newer results using `AbortController` or request sequence IDs.
- Keep requests modest and respect the API's documented usage limits. Public GETs need no secret key.

### Every request must follow this pattern

```js
async function fetchMuseumData(url, { signal } = {}) {
  let response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;          // superseded request, not a visible error
    throw new Error('Could not reach the museum (network problem).');
  }

  if (!response.ok) {                                       // check BEFORE reading JSON
    throw new Error(`Museum API returned HTTP ${response.status}`);
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw new Error('The museum API sent data that could not be read.');
  }

  if (json.error || !json.data) {
    throw new Error('The museum API returned an unexpected response.');
  }
  return json;
}
```

This is a reference shape, not a fixed implementation. The required properties: `await fetch` inside `try/catch`, `response.ok` checked before `response.json()`, `.json()` parse failure handled, error/shape check afterward, and each failure mapped to a distinct, readable message for the calling feature's Error state and Retry button. A `catch` that only re-throws the same error with no added handling is not acceptable.

All API paths (Featured, Search, Artwork Details) MUST use the validated helper or an equivalent `try/catch` + `await fetch()` + `response.ok` structure. A canceled superseded search is not a visible error. Never use a token, a proxy server, or an external request library.

**Content integrity:** Do not write fabricated histories or claim real-time availability. If an artwork is not listed as currently on view, show that distinction. The app can only make claims supported by Art Institute records, and the official museum website is the final authority for visiting.

## 9. Five mandatory UI states — exact visual behavior

These must be implemented, demonstrated, and match `DESIGN.md`. A successful request is not sufficient if error/empty/invalid states are missing.

**Mapping to the five required states:** *Empty* = initial collection + zero search results. *Loading* = discovery + details. *Error* = discovery + details. *Invalid Input* = search validation. *In Use* = a valid request produced paintings and the user is curating. The table below lists them as separate rows because each has its own location and message.

| State | Trigger | Where to show it | Exact message | User action / behavior |
|---|---|---|---|---|
| **Empty — initial collection** | First visit, no art saved | Gallery preview + Insights | `Your gallery is waiting for its first masterpiece.` and `Choose a painting to bring your gallery to life.` | User browses Featured or searches. Gallery displays empty walls and `0/6`. |
| **Empty — no search results** | Search succeeded but no eligible paintings found | Discover results grid, replacing cards | `No paintings found. Try a different artist or keyword.` If a second museum check finds that the searched artist has paintings that are still under copyright, show instead: `{Artist} is in the Art Institute of Chicago's collection, but their work is still under copyright, so it can't be displayed here. ATELIER only shows public-domain paintings. Try an artist whose work is in the public domain, such as Claude Monet or Vincent van Gogh.` | **Clear Search**, new search, or choose Featured; do not erase collection. |
| **Loading — discovery** | Featured/category/search request pending | Discover results grid | `Finding artworks…` | Status text/skeletons; disable only relevant search controls, keep saved gallery usable. |
| **Loading — details** | Individual artwork request pending | Story/location region in details dialog | `Loading artwork details…` | Keep title/image visible; show progress with `role="status"`. |
| **Error — discovery** | Network failure, HTTP 404/429/500, API error or unexpected payload | Discover results area | `We couldn't load artworks right now. Your exhibition is safe.` | **Retry** same query; preserve saved collection. |
| **Error — details** | Failed details request | Details dialog story/location region | `Artwork details are temporarily unavailable.` | **Retry Details**; keep saved artwork and official link accessible. |
| **Invalid input** | Empty/whitespace-only query, or query longer than 120 characters | Directly below Search field | `Enter an artist, artwork, or subject to search.` / `Keep your search under 120 characters.` | Keep focus on input, show `aria-invalid`; **do not send fetch**. |
| **In Use** | A valid request produces eligible paintings; user selects/curates | Search cards, live room, collection drawer, Insights, details | Actual artwork titles/artists + `N/6` + calculated insight | Add, reorder, remove, explore, switch wall view/style; save to localStorage. |

**Additional guarded interactions (not extra API requests):**
- **Duplicate Add:** `In your exhibition`; do not duplicate or increment count.
- **Seventh Add:** `Gallery full — remove a painting to add another.`; disable Add when full.
- **Finish with zero:** disable Finish; hint `Add at least one painting to finish.`
- **Theme over 80 characters:** prevent with `maxlength` and local validation.
- **Missing artwork description:** `The museum has not provided a description for this artwork.` This is an **available-data limitation**, not a network error.
- **Unknown current display:** `Current display status unavailable`; never imply a known location.
- **Broken image:** Show a neutral image placeholder, keep text/selection available; don't insert a different painting.
- **Viewport below 600px:** show the interactive 2D layout with the same Explore capability (see Section 5.4).
- **LocalStorage blocked:** continue in current session and show `Changes cannot be saved in this browser.` Do not falsely say Saved.
- **New Exhibition:** confirm `Start a new exhibition? Your current selection will be replaced.` On cancel, keep everything.

Messages should be inline, readable and actionable. Do not rely on blocking `alert()` popups for normal error/empty states. (The New Exhibition confirmation should use a `<dialog>`, not `window.confirm()`, to stay consistent with this rule.)

## 10. Data model and local persistence

Use one exhibition object as the single source of truth. Store under key `atelier-exhibition-v2`:

```js
const exhibition = {
  version: 2,
  title: '',
  theme: { type: 'none', value: '' }, // 'none' | 'preset' | 'custom'
  atmosphere: 'white-cube',          // 'white-cube' | 'warm' | 'dark'
  artworks: [
    // Real normalized records returned by the museum API:
    // { id, title, artist, artistKey, dateLabel, startYear,
    //   imageId, imageUrl, altText, sourceUrl }
  ]
};
```

- Save on every meaningful change (add, remove, reorder, rename, theme, atmosphere) and reload on refresh.
- Always validate loaded data before rendering: correct types, unique numeric IDs, maximum six items, valid atmosphere, length limits. A corrupted storage entry must never crash the page; start clean and show a small notice if recovery is necessary.
- The selected painting array order **is** the gallery slot order.
- Search results, current wall viewpoint, open drawer/dialog, loading state, and active network request stay transient; do not persist them.
- Do **not** permanently store `is_on_view`, `gallery_title`, or other live display claims; load them when Explore opens.
- No cloud synchronization, login, public sharing, or multiple exhibitions in the MVP.

**Useful beginner-explainable JavaScript functions:** `searchArtworks()`, `fetchMuseumData()`, `normalizeArtwork()`, `addArtwork()`, `removeArtwork()`, `moveArtwork()`, `renderArtworkCards()`, `renderGallery()`, `calculateInsights()`, `openArtworkDetails()`, `saveExhibition()`, `loadExhibition()`, `renderState()`.

## 11. Visual design and accessibility

`DESIGN.md` is mandatory at the repo root and defines exact visual tokens. The overall direction is **quiet, elegant, editorial museum**, not a game interface. The art itself should be the main visual focus.

- Warm off-white shell, charcoal text and controls, subtle borders, editorial serif headings, readable system sans-serif body. No Google Fonts (use system font stacks, e.g. Georgia for headings).
- Three atmospheres affect **only the virtual room**, not the whole website: White Cube (neutral), Warm Gallery (beige), Dark Gallery (charcoal).
- Natural artwork aspect ratios and clearly readable labels; avoid cropping significant painting content.
- Desktop two-column Studio; tablet/mobile stacked layout. At 375px viewport, no sideways scrolling and primary controls remain tappable.
- Use semantic `header`, `main`, `section`, `form`, `label`, `button`, lists, and proper dialog semantics. No clickable plain `<div>` as the only control.
- All gallery artwork images are inside accessible buttons, with meaningful accessible names and alt text. Hover is never the sole way to see an action.
- Visible keyboard focus rings; Escape closes overlays; opening/closing a drawer/dialog manages and restores focus.
- `aria-live="polite"`/`role="status"` for state updates; distinguish error and empty visually as well as textually. Respect `prefers-reduced-motion`.
- Use `textContent` and safe DOM creation for API text. Never inject raw museum-provided HTML into `innerHTML`.
- The browser can zoom; do not disable viewport scaling.

**Required files:**

```text
art-exhibition-builder/
├── index.html
├── css/
│   └── styles.css        # all styles; tokens defined once on :root per DESIGN.md
├── js/
│   └── script.js         # all behavior (may later split into small, clearly named files)
├── PRD.md                # this file
├── DESIGN.md             # required visual rules
└── README.md             # setup, API, usage, limitations, live URL
```

Use relative file paths so deployment under `/art-exhibition-builder/` works on GitHub Pages. No `/`-root-relative asset paths that break the project URL.

## 12. Implementation plan for Claude Code

Build and test in this order. **Do not implement stretch goals until all required tests pass.**

1. Confirm the working repo is `TuttiJonson/art-exhibition-builder` (public, separate from previous school repos). `PRD.md` is at its root. **`DESIGN.md` does not exist yet: create it (or add the class-provided one) and review it before writing any CSS.**
2. Create semantic `index.html`, local CSS, and vanilla JavaScript. Verify the static page opens directly into the Studio.
3. Connect Featured + Search to the real API. Build `fetchMuseumData()` with `await fetch`, `try/catch`, `response.ok`, and response-shape checks. Render real image cards. Handle all Discover states.
4. Implement one selected-artwork array, six-item capacity, duplicate guard, Add/Remove/Reorder, and `localStorage`. Build the live wall-slot display (2D first).
5. Implement the six-slot CSS perspective room, three fixed wall controls, three atmospheres, and mobile 2D fallback. Clicking paintings must open details.
6. Implement My Collection and one shared artwork-details dialog; fetch story and museum/display facts on demand, with separate loading/error states.
7. Implement Curatorial Insights calculations and ensure they change correctly with selected artworks.
8. Implement title/theme, Finish Curating opening, Edit Exhibition, New Exhibition confirmation.
9. Test keyboard interactions, screen width ~375px, all five UI states, localStorage corruption/failure, missing fields and images, and API errors.
10. Deploy the working app to **GitHub Pages**. Put its live URL in `README.md` and verify the URL loads with no broken asset paths.

If a feature is unexpectedly difficult, prefer reducing CSS visual sophistication—not removing the API calculations, art stories, museum attribution, saved collection, or five required states.

## 13. Acceptance criteria — manual checklist

**Data and classroom rules**
- [ ] Public GitHub repo `art-exhibition-builder` is separate from existing work; site is reachable on GitHub Pages.
- [ ] `PRD.md` and `DESIGN.md` are at root; implemented styles follow DESIGN.md.
- [ ] App uses only plain HTML/CSS/JS, no imported framework, package, icon library, CDN script/style/font or API key.
- [ ] Browser JavaScript issues actual museum API calls using `fetch()` and `await`; every fetch checks `response.ok` in `try/catch`.
- [ ] User choices change API requests and/or displayed output; no fake or hardcoded live results.
- [ ] Curatorial Insights computes distinct artists and chronological year span from selected API-derived artwork metadata, with valid incomplete-date behavior.

**User journey**
- [ ] Studio displays Featured paintings without a required intro form.
- [ ] Search for an artist returns appropriate real painting cards when the API has results.
- [ ] Add makes an artwork appear on a visible wall instantly, increments count, and saves.
- [ ] Duplicate selections and a seventh artwork are blocked.
- [ ] Remove and Move Earlier/Move Later update the room and summary without another API request.
- [ ] Exhibition title/theme and White Cube/Warm/Dark atmospheres save and restore.
- [ ] My Collection (N/6) remains accessible from Studio and Gallery.
- [ ] Clicking a saved artwork opens a readable description, artist/date, and separately labeled holding museum and current-display status when available.
- [ ] Clicking the painting on the gallery wall opens the same detail view.
- [ ] Museum source link is correct; missing info is labeled honestly rather than invented.
- [ ] Finish Curating opens the exhibition reveal, Enter My Gallery works, and Edit Exhibition returns to the Studio without losing data.
- [ ] New Exhibition asks for confirmation and resets only when confirmed.

**Five states and resilience**
- [ ] Initial empty gallery, zero-results search, loading, error, invalid input, and in-use are visually distinct and match Section 9.
- [ ] Whitespace-only search shows invalid input **without issuing fetch**.
- [ ] HTTP failure (including 404, 429, 500) shows a retryable error and does **not** erase the saved exhibition.
- [ ] Missing description/display information uses honest fallback copy.
- [ ] Missing/broken image doesn't crash the UI or silently replace a painting.
- [ ] Refresh restores one exhibition and its order. Corrupted localStorage is handled safely.
- [ ] View is legible on a phone, works by keyboard, and has no horizontal overflow.

## 14. Explicit non-goals and stretch ideas

**Not in Version 1:** AI-written artwork analysis, full 3D walking, drag-and-drop paintings, accounts/logins, uploading personal photos, museum-wide worldwide search, maps or travel directions, booking museum tickets, multiple saved exhibitions, public sharing, or backend data storage.

**Stretch goals only after MVP and grading tests pass:** optional walking controls built without libraries (not recommended), custom frame styles, export a gallery screenshot if browser restrictions permit, additional museum APIs after licensing and location data are verified.

## 15. Links and source references

- Art Institute of Chicago API docs: https://api.artic.edu/docs/
- Example live JSON artwork record: https://api.artic.edu/api/v1/artworks/27992
- Search endpoint example: https://api.artic.edu/api/v1/artworks/search?q=monet
- Museum's official Seurat record: https://www.artic.edu/artworks/27992/a-sunday-on-la-grande-jatte-1884
- GitHub Pages publication instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

**Final build mandate:** ATELIER should feel elegant and personal to someone who loves art. Its value lies in **discovering paintings, putting them together, understanding their stories, and learning where they might be seen in real life**. The JavaScript must visibly do more than display API results, and the implementation must be explainable by a beginner in class.
