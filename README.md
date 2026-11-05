# ATELIER — art exhibition builder

ATELIER is a personal art-curation website. Discover real paintings from the Art Institute of Chicago, choose up to six favorites, hang them in a virtual gallery, read the story behind each one, and find out whether the museum currently lists it as on view.

**Live site:** https://tuttijonson.github.io/art-exhibition-builder/ (published with GitHub Pages; see "Publishing" below)

Built for someone who loves art and wants to enjoy it without needing an art-history background: no sign-in, no setup, and your exhibition is remembered on the device you use.

## What you can do

- **Discover:** browse Featured paintings (the museum's own highlights) or the Nature, Portraits and City Life categories, or search by artist, artwork or subject.
- **Curate:** add up to six paintings, reorder them with Move Earlier / Move Later, and remove any. Each painting lands on a fixed wall slot (two per wall).
- **Personalize:** name the exhibition, pick an optional theme (or write your own, up to 80 characters), and choose White Cube, Warm Gallery or Dark Gallery.
- **Explore the Artwork:** open any painting for the museum's description, medium, and where to find it. *Holding collection*, *current display status* and *place of origin* are kept separate, because a painting's origin is not where it hangs.
- **Curatorial Insights:** the page calculates the number of distinct artists and the span of years between the earliest and latest known creation dates in your selection, and updates it on every change.
- **Finish Curating:** an opening overlay, then a larger gallery you can walk through wall by wall (Front, Left, Right). You can always go back and edit.

## How it meets the project requirements

| Requirement | Where |
|---|---|
| Plain HTML, CSS and JavaScript only; no frameworks, packages, build step, CDN scripts/styles/fonts | `index.html`, `css/styles.css`, `js/script.js` |
| Real data with `fetch()` and `await` | `fetchMuseumData()` in `js/script.js` (every request uses it) |
| `try/catch`, `response.ok` checked before reading JSON, bad payloads detected | `fetchMuseumData()`: network failure, HTTP errors (404/429/500), unreadable JSON and unexpected response bodies each get their own message |
| User choices change what is requested or shown | search, categories, add/remove/reorder, theme, atmosphere, wall view |
| Calculated output from API data | `calculateInsights()` and `describeInsights()`: distinct artists (a `Set`) and year span (min/max of `date_start`) |
| Empty, Loading, Error, Invalid Input, In Use states | Discover results area, details dialog, search field, gallery (see `PRD.md` section 9 and `DESIGN.md` section 7) |
| Accessible and works at about 375px wide | semantic HTML, native `<dialog>`, keyboard focus rings, 2D wall layout below 600px |
| No API key or secret | none exists; the museum's public API needs none |

## The museum API

- Base URL: `https://api.artic.edu/api/v1` (documentation: https://api.artic.edu/docs/)
- Search: `/artworks/search` with a query that keeps only public-domain paintings that have an image. Featured uses the museum's highlighted set. A search never fires on every keystroke, and an older, slower search cannot overwrite a newer one.
- Details: `/artworks/{id}` is fetched when you open **Explore the Artwork**, so display status is never stored or treated as permanent.
- **Images:** painting images are loaded from the museum's own image service (`www.artic.edu/iiif/...`) as part of the artwork data the API returns. They are artwork content, not app assets. ATELIER loads no other external files.
- **Attribution:** artwork information and descriptions come from the Art Institute of Chicago. Museum displays change, so check the official website before visiting.

## Saved data

One exhibition is saved automatically in this browser's `localStorage` (key `atelier-exhibition-v2`). There are no accounts, no server, and no sharing. If saved data is damaged it is ignored and a short notice appears; if the browser blocks storage, ATELIER keeps working for the session and says changes cannot be saved.

## Running it locally

There is nothing to install. Either open `index.html` in a browser, or serve the folder so paths behave as they do online:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/
```

## Publishing

In the GitHub repository, open **Settings → Pages**, choose **Deploy from a branch**, select `main` and the `/ (root)` folder, and save. All file paths in the project are relative, so the site works under `/art-exhibition-builder/`.

## Project files

| File | Purpose |
|---|---|
| `PRD.md` | What the product must do, API rules, the five UI states, acceptance checklist |
| `DESIGN.md` | Visual tokens, layouts, responsive and accessibility rules |
| `PROPOSAL.md` | The original project proposal |
| `index.html`, `css/styles.css`, `js/script.js` | The app |

## Known limits

- Only the Art Institute of Chicago is searched, and only public-domain paintings with images.
- Category buttons are search hints (for example, Nature searches "landscape"), not exact art-historical classifications.
- The room uses CSS perspective only (no 3D library). Below 600px wide it becomes a flat list of the three walls.
- Display status is whatever the museum reports at the moment you open a painting.
