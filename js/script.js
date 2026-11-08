'use strict';
// ^ "Strict mode" makes JavaScript complain about common mistakes (like typing a variable name
//   wrong) instead of silently ignoring them. It is good practice to start every file with it.

/* ==========================================================================
   HOW TO READ THIS FILE (for beginners)

   The big idea: the app keeps ALL of its data in one JavaScript object (called "exhibition").
   Whenever the data changes, we (1) save it, then (2) redraw the page from that data.
   The page is never the "source of truth" — the data is.

       user clicks a button
              |
              v
       change the data  (section 9: addArtwork, removeArtwork, moveArtwork)
              |
              v
       save to localStorage  (section 8)
              |
              v
       redraw the page from the data  (section 10: render functions)

   Where the museum's data comes from: the Art Institute of Chicago has a free public API.
   An API is just a web address that returns data (as JSON text) instead of a web page.
   We "fetch" that data, clean it up (section 6), and show it as cards (section 11).

   Useful words:
     const / let   - make a named box for a value. const can't be re-assigned, let can.
     function      - a named, reusable block of code.
     async / await - lets us wait for something slow (like the internet) without freezing the page.
     DOM           - the page's elements as JavaScript sees them (buttons, text, images...).
     event         - something the user does (click, type, submit) that our code can react to.
   ========================================================================== */

/* ==========================================================================
   ATELIER — plain JavaScript, no libraries.
   Sections:
     1. Constants
     2. State
     3. Page elements
     4. Small helpers
     5. Talking to the museum (fetch)
     6. Turning API data into our own artwork records
     7. Curatorial Insights (the calculated output)
     8. Saving and loading (localStorage)
     9. Changing the exhibition (add / remove / move)
    10. Drawing the page (render functions)
    11. Discover: search, categories, states
    12. Explore the Artwork (details dialog)
    13. Dialogs, modes and event listeners
    14. Start-up
   ========================================================================== */


/* ---------- 1. Constants ---------- */
// "Constants" are values that never change while the app runs. Putting them at the top means
// you can tweak the app (e.g. allow 8 paintings) in ONE place instead of hunting through the code.
// By convention, constants are written in CAPITAL_LETTERS.

// The Art Institute of Chicago API. Every request starts with this address.
const API_BASE = 'https://api.artic.edu/api/v1';
// IIIF is the museum's image server. An image's address is built from this + the image's id (see normalizeArtwork).
const IIIF_DEFAULT = 'https://www.artic.edu/iiif/2';
const MUSEUM_SITE = 'https://www.artic.edu';

const MAX_ARTWORKS = 6;
const MAX_TITLE = 80;
const MAX_THEME = 80;
const MAX_QUERY = 120;
const REQUEST_LIMIT = 22;   // ask the museum for a few extra...
const DISPLAY_LIMIT = 18;   // ...and show up to 18 eligible paintings
// localStorage saves data under a "key" (like a label on a drawer). We use this label to find our exhibition again.
const STORAGE_KEY = 'atelier-exhibition-v2';

const FULL_MESSAGE = 'Gallery full — remove a painting to add another.';
const INVALID_EMPTY = 'Enter an artist, artwork, or subject to search.';
const INVALID_LONG = 'Keep your search under 120 characters.';

// Each category button sends a different museum search ("Featured" uses the museum's own highlights instead).
const CATEGORY_QUERIES = { nature: 'landscape', portraits: 'portrait', city: 'city' };
const CATEGORY_LABELS = { featured: 'Featured', nature: 'Nature', portraits: 'Portraits', city: 'City Life', abstract: 'Abstract & Contemporary' };

const THEMES = ['Nature', 'Dreams', 'Humanity', 'Color & Light'];
const ATMOSPHERES = ['white-cube', 'warm', 'dark'];

// The selected-artworks array order decides the wall slot (PRD section 6).
const WALLS = ['front', 'left', 'right'];
const WALL_LABELS = { front: 'Front Wall', left: 'Left Wall', right: 'Right Wall' };
const SLOT_WORDS = {
  front: ['left', 'right'],
  left: ['first', 'second'],
  right: ['first', 'second']
};

// The museum API can return hundreds of fields per artwork. Asking only for the ones we need
// ("fields=...") makes responses smaller and faster. Each list is joined into one comma-separated
// string, e.g. "id,title,artist_title,...". 'thumbnail.alt_text' means "the alt_text inside thumbnail".
const SEARCH_FIELDS = [
  'id', 'title', 'artist_title', 'date_display', 'date_start',
  'image_id', 'is_public_domain', 'artwork_type_title', 'thumbnail.alt_text', 'subject_titles', 'style_title'
].join(',');

// Fields for the "Explore the Artwork" dialog: the story, medium, and where the painting is displayed.
const DETAIL_FIELDS = [
  'id', 'title', 'artist_title', 'date_display', 'medium_display', 'place_of_origin',
  'short_description', 'description', 'is_on_view', 'gallery_title', 'on_loan_display', 'image_id'
].join(',');


/* ---------- 2. State ---------- */
// "State" = the app's memory: everything it needs to remember right now.
// There are two kinds, kept apart on purpose:
//   exhibition -> the user's real work. Saved to the browser, survives a page refresh.
//   ui         -> temporary things (current search results, which wall is showing). Lost on refresh.
// "let" is used for exhibition because we replace the whole object when starting a new exhibition.

// The ONE exhibition object (PRD section 10). Only this is saved to localStorage.
let exhibition = createEmptyExhibition();

// Everything below is temporary and is never saved.
const ui = {
  wall: 'front',
  results: [],
  lastRequest: { kind: 'featured' },
  // The "Seq" numbers and "Controller" objects handle slow internet: if you search twice quickly,
  // the first (older) answer must not overwrite the second. See loadDiscover() for how they work.
  searchSeq: 0,
  searchController: null,
  detailSeq: 0,
  detailController: null,
  detailArt: null,
  detailOpener: null,
  storageOk: true,
  recoveryNotice: ''
};


/* ---------- 3. Page elements ---------- */
// JavaScript can't change a button or heading until it has "grabbed" it from the HTML.
// document.getElementById('x') finds the element in index.html that has id="x".
// Below, "$" is just a short nickname for that long function, and "els" collects every
// element we need into one tidy object (e.g. els.searchInput is the search box).
// "(id) => ..." is an arrow function: a short way of writing a small function.

const $ = (id) => document.getElementById(id);

const els = {
  body: document.body,
  collectionBtn: $('collection-btn'),
  collectionCount: $('collection-count'),
  newBtn: $('new-btn'),
  editBtn: $('edit-btn'),
  tabs: [...document.querySelectorAll('.tab')],
  tabCount: $('tab-count'),
  discover: $('discover'),
  exhibitionPanel: $('exhibition'),
  searchForm: $('search-form'),
  searchInput: $('search-input'),
  searchBtn: $('search-btn'),
  searchError: $('search-error'),
  chips: document.querySelectorAll('[data-category]'),
  resultsTitle: $('results-title'),
  discoverStatus: $('discover-status'),
  fullHint: $('full-hint'),
  resultsRegion: $('results-region'),
  stage: $('stage'),
  emptyNote: $('empty-note'),
  wallButtons: document.querySelectorAll('[data-wall]'),
  counterNum: $('counter-num'),
  galleryHeading: $('gallery-heading'),
  galleryTitle: $('gallery-title'),
  galleryTheme: $('gallery-theme'),
  storageNotice: $('storage-notice'),
  titleInput: $('title-input'),
  titleError: $('title-error'),
  themeSelect: $('theme-select'),
  themeCustomWrap: $('theme-custom-wrap'),
  themeCustom: $('theme-custom'),
  themeCount: $('theme-count'),
  atmosphereRadios: document.querySelectorAll('input[name="atmosphere"]'),
  selectedTitle: $('selected-title'),
  selectedEmpty: $('selected-empty'),
  selectedList: $('selected-list'),
  insightsSummary: $('insights-summary'),
  insightsStats: $('insights-stats'),
  reflection: $('insights-reflection'),
  reflectionShared: $('insights-shared'),
  finishBtn: $('finish-btn'),
  finishHint: $('finish-hint'),
  viewBtn: $('view-btn'),
  saveStatus: $('save-status'),
  announcer: $('announcer'),
  drawer: $('drawer'),
  drawerCount: $('drawer-count'),
  drawerList: $('drawer-list'),
  drawerEmpty: $('drawer-empty'),
  browseBtn: $('browse-btn'),
  detailsDialog: $('details-dialog'),
  detailsFigure: $('details-figure'),
  detailsTitle: $('details-title'),
  detailsMeta: $('details-meta'),
  detailsLive: $('details-live'),
  detailsAttribution: $('details-attribution'),
  openingDialog: $('opening-dialog'),
  openingTitle: $('opening-title'),
  openingTheme: $('opening-theme'),
  openingCount: $('opening-count'),
  openingInsights: $('opening-insights'),
  openingReflection: $('opening-reflection'),
  enterBtn: $('enter-btn'),
  confirmDialog: $('confirm-dialog'),
  confirmNewBtn: $('confirm-new-btn')
};

// The six painting positions: slotEls[0] and [1] are the Front Wall, [2] and [3] Left, [4] and [5] Right.
const slotEls = [];


/* ---------- 4. Small helpers ---------- */
// Little tools used all over the file.

// Builds an element safely. Text is always added as plain text, never as HTML.
// Example:  el('p', { class: 'hint', text: 'Hello' })   ->   <p class="hint">Hello</p>
// Why not write HTML strings? Putting text from the internet into HTML can let attackers sneak in
// malicious code (called XSS). Using textContent treats everything as harmless plain text.
// "...children" means "any number of extra arguments", which become the element's contents.
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child !== null && child !== undefined && child !== false) node.append(child);
  }
  return node;
}

// plural(1, 'artist') -> 'artist';  plural(3, 'artist') -> 'artists'
function plural(count, singular, pluralWord) {
  return count === 1 ? singular : (pluralWord || singular + 's');
}

// Each wall holds 2 paintings, so painting #0,1 -> front, #2,3 -> left, #4,5 -> right.
// Math.floor(index / 2) rounds down: 0,1 -> 0   2,3 -> 1   4,5 -> 2.
function wallOfIndex(index) { return WALLS[Math.floor(index / 2)]; }

function slotLabel(index) {
  const wall = wallOfIndex(index);
  return `${WALL_LABELS[wall]} · ${SLOT_WORDS[wall][index % 2]}`;
}

// .some() asks "does ANY painting in the list match?" and answers true or false.
function isSelected(id) { return exhibition.artworks.some((a) => a.id === id); }
function isFull() { return exhibition.artworks.length >= MAX_ARTWORKS; }

function describeArt(art) {
  return art.artist ? `${art.title} by ${art.artist}` : art.title;
}

// Screen-reader users can't see changes on screen, so we write messages into a hidden
// "live region" (#announcer) and the screen reader reads them out loud.
// Clearing it first, then setting the text after a tiny delay, makes sure repeated messages are re-read.
function announce(message) {
  els.announcer.textContent = '';
  window.setTimeout(() => { els.announcer.textContent = message; }, 40);
}

// If an image will not load, show a neutral placeholder. Never swap in a different painting.
function attachImageFallback(img) {
  img.addEventListener('error', () => {
    img.replaceWith(el('span', { class: 'img-fallback', role: 'img', 'aria-label': 'Image unavailable', text: 'Image unavailable' }));
  }, { once: true });
  return img;
}

function artImage(art) {
  return attachImageFallback(el('img', { src: art.imageUrl, alt: art.altText, loading: 'lazy', decoding: 'async' }));
}

// Museum descriptions can contain HTML. DOMParser makes an inert document (nothing runs or loads),
// and we keep only the plain text of each paragraph.
function htmlToParagraphs(html) {
  if (typeof html !== 'string' || !html.trim()) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks = [...doc.body.querySelectorAll('p, li')].map((n) => n.textContent.trim()).filter(Boolean);
  if (blocks.length) return blocks;
  const text = doc.body.textContent.trim();
  return text ? [text] : [];
}


/* ---------- 5. Talking to the museum ---------- */
// THE API IN A NUTSHELL
//   1. We build a web address (URL) describing what we want, e.g. ".../artworks/search?query...".
//   2. fetch(url) sends the request over the internet and gives back a "Response".
//   3. response.json() turns the text the museum sent back into a JavaScript object.
//   4. We read the data we need from that object.
// Each step can fail (no internet, server error, odd data), so each step is checked.

// Every request goes through this one function: await fetch inside try/catch,
// response.ok checked BEFORE reading JSON, and the JSON body checked afterwards.
// "async" marks a function that does slow work; inside it, "await" means "pause HERE until the
// answer arrives, then continue" (the rest of the page keeps working while we wait).
// "signal" lets us cancel the request if the user starts a newer search (see AbortController later).
async function fetchMuseumData(url, { signal } = {}) {
  let response;
  // STEP 1 — send the request. try/catch: if anything inside "try" throws an error,
  // the code jumps into "catch" instead of crashing. fetch() only fails like this when
  // there's no connection at all (offline, blocked, DNS problem).
  try {
    // referrerPolicy 'no-referrer': the museum's API rejects (HTTP 403) requests that carry a
    // Referer header from some websites (e.g. a deployed *.vercel.app site), so we don't send one.
    response = await fetch(url, { signal, referrerPolicy: 'no-referrer' });
  } catch (error) {
    if (error.name === 'AbortError') throw error;   // a newer search replaced this one: not a visible error
    throw new Error('Could not reach the museum (network problem).');
  }

  // STEP 2 — did the server say "OK"? HTTP status codes: 200 = fine, 404 = not found, 500 = server broke.
  // fetch() does NOT treat 404/500 as errors, so we must check response.ok ourselves.
  if (!response.ok) {   // a 404 or 500 does not throw by itself, so we check
    throw new Error(`Museum API returned HTTP ${response.status}`);
  }

  // STEP 3 — turn the text into a JavaScript object. This can fail if the server sent something
  // that isn't valid JSON (e.g. an error web page), so it gets its own try/catch.
  let json;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error('The museum API sent data that could not be read.');
  }

  // STEP 4 — check the shape. The museum wraps its results in a "data" property. If it's missing
  // (or the API reports an "error"), we treat the response as unusable.
  if (!json || json.error || !json.data) {
    throw new Error('The museum API returned an unexpected response.');
  }
  return json;
}

// Builds the search address. The museum's search text goes INSIDE the query (not "q="),
// because "q=" is ignored once filters are added.
//
// Example of a finished address (shortened):
//   https://api.artic.edu/api/v1/artworks/search?limit=22&fields=id,title,...
//     &query[bool][filter][0][term][is_public_domain]=true
//     &query[bool][filter][1][term][artwork_type_title.keyword]=Painting
// Read the "query[...]" parts as a filter list: "only public-domain" AND "only paintings" AND ...
// "request" says what the user asked for: { kind: 'featured' } | { kind: 'category', key } | { kind: 'search', text }
function buildDiscoverUrl(request, { publicDomain = true } = {}) {
  // URLSearchParams builds the "?name=value&name2=value2" part and safely encodes odd characters
  // (spaces, accents, &) so they can't break the address.
  const params = new URLSearchParams();
  params.set('limit', String(publicDomain ? REQUEST_LIMIT : 40));
  params.set('fields', SEARCH_FIELDS);
  // publicDomain:false is used only to find out WHY a search came back empty (see findCopyrightedArtist).
  params.set('query[bool][filter][0][term][is_public_domain]', String(publicDomain));
  params.set('query[bool][filter][1][term][artwork_type_title.keyword]', 'Painting');

  if (request.kind === 'featured') {
    params.set('query[bool][filter][2][term][is_boosted]', 'true');   // the museum's own highlights
  } else if (request.kind === 'category' && request.key === 'abstract') {
    // Uses the museum's own "modern and contemporary art" label instead of a text guess, and
    // leaves out Impressionism so the results lean toward abstract and modernist work.
    params.set('query[bool][filter][2][term][classification_titles.keyword]', 'modern and contemporary art');
    params.set('query[bool][must_not][0][term][style_title.keyword]', 'Impressionism');
    params.set('query[bool][must_not][1][term][style_title.keyword]', 'Post-Impressionism');
  } else {
    // A text search (typed by the user, or a category like Nature -> "landscape").
    // "multi_match" searches several fields at once; the ^5 / ^3 mean "a match in artist counts
    // 5x, in title 3x" so searching "Monet" ranks Monet's own paintings first.
    const text = request.kind === 'category' ? CATEGORY_QUERIES[request.key] : request.text;
    const mm = 'query[bool][must][0][multi_match]';
    params.set(`${mm}[query]`, text);
    params.set(`${mm}[type]`, 'cross_fields');
    params.set(`${mm}[operator]`, 'and');
    ['artist_title^5', 'title^3', 'short_description', 'subject_titles'].forEach((field) => {
      params.append(`${mm}[fields][]`, field);
    });
  }
  return `${API_BASE}/artworks/search?${params}`;
}

// Lowercase, no accents, so "de Kooning" matches "De Kooning" and "Miró" matches "miro".
// .normalize('NFD') splits "é" into "e" + an accent mark; the regex then deletes the accent marks.
function foldText(text) {
  return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Called only when a search found no public-domain paintings. Asks the museum the same question
// for COPYRIGHTED paintings and returns the artist's name if the search words match an artist
// (every word must appear in the artist's name, so a painting that merely mentions the word does not count).
// Never throws: if this extra check fails, the normal "No paintings found" message is shown.
async function findCopyrightedArtist(request, signal) {
  if (request.kind !== 'search') return '';
  try {
    const json = await fetchMuseumData(buildDiscoverUrl(request, { publicDomain: false }), { signal });
    if (!Array.isArray(json.data)) return '';
    const words = foldText(request.text).split(/[^a-z0-9]+/).filter(Boolean);
    if (!words.length) return '';
    for (const raw of json.data) {
      if (!raw || raw.is_public_domain === true || raw.artwork_type_title !== 'Painting') continue;
      if (typeof raw.artist_title !== 'string' || !raw.artist_title.trim()) continue;
      const name = foldText(raw.artist_title);
      if (words.every((w) => name.includes(w))) return raw.artist_title.trim();
    }
  } catch (error) {
    if (error.name === 'AbortError') throw error;
  }
  return '';
}

// A second, separate API call: ask for ONE artwork by its id (".../artworks/27992?fields=...").
// Used only when the user opens "Explore the Artwork".
function buildDetailUrl(id) {
  return `${API_BASE}/artworks/${id}?fields=${DETAIL_FIELDS}`;
}


/* ---------- 6. Turning API data into our own artwork records ---------- */
// The museum's data is big, messy and sometimes missing pieces. Instead of using it directly,
// we copy only what we need into a small, predictable "artwork record". The rest of the app
// then only ever deals with our clean records. This is called "normalizing" data.

// Keeps the museum's subject tags (like "water" or "mothers") as short lowercase text. Used only for the reflection.
function cleanSubjects(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((t) => typeof t === 'string' && t.trim())
    .map((t) => t.trim().toLowerCase().slice(0, 60))
    .slice(0, 16);
}

// Returns a small clean record, or null if this result is not an eligible public-domain painting with an image.
// "raw" is one artwork exactly as the museum sent it. Returning null means "skip this one".
// The ifs below are a checklist: no id, no title, no image, not public domain, not a painting -> skip.
// (Public domain = no copyright, so we're allowed to show it.)
function normalizeArtwork(raw, iiifBase = IIIF_DEFAULT) {
  if (!raw || !Number.isInteger(raw.id)) return null;
  if (typeof raw.title !== 'string' || !raw.title.trim()) return null;
  if (typeof raw.image_id !== 'string' || !raw.image_id) return null;
  if (raw.is_public_domain !== true || raw.artwork_type_title !== 'Painting') return null;

  const artist = typeof raw.artist_title === 'string' ? raw.artist_title.trim() : '';
  const title = raw.title.trim();
  const altFromMuseum = raw.thumbnail && typeof raw.thumbnail.alt_text === 'string' ? raw.thumbnail.alt_text.trim() : '';

  // The clean record. "title," on its own is shorthand for "title: title,".
  // artistKey is a lowercase copy used to compare artists ("Monet" and "monet" count as one).
  // imageUrl is built from the image server address + the image id + size/format options
  // ("full/843,/0/default.jpg" = full picture, 843px wide, no rotation, jpg).
  return {
    id: raw.id,
    title,
    artist,
    artistKey: artist.toLowerCase(),
    dateLabel: typeof raw.date_display === 'string' ? raw.date_display.trim() : '',
    startYear: Number.isFinite(raw.date_start) ? raw.date_start : null,
    subjects: cleanSubjects(raw.subject_titles),
    imageId: raw.image_id,
    imageUrl: `${iiifBase}/${raw.image_id}/full/843,/0/default.jpg`,
    altText: altFromMuseum || (artist ? `${title} by ${artist}` : title),
    sourceUrl: `${MUSEUM_SITE}/artworks/${raw.id}`
  };
}


/* ---------- 7. Curatorial Insights: the calculated output ---------- */

// Pure function: selected paintings in, numbers out. It never touches the page.
// ("Pure" = same input always gives the same output, and nothing else changes. Easy to test!)
// This is the app's calculated output: how many artists, the earliest/latest year, and the time span.
function calculateInsights(artworks) {
  const artistKeys = new Set();       // a Set only keeps one copy of each artist
  const years = [];
  let unknownArtistCount = 0;

  for (const art of artworks) {
    if (art.artistKey) artistKeys.add(art.artistKey);
    else unknownArtistCount += 1;     // a missing artist is never counted as a new artist
    if (Number.isFinite(art.startYear)) years.push(art.startYear);
  }

  // "cond ? a : b" is a one-line if/else. "...years" spreads the array into separate numbers for Math.min.
  // null means "we don't know" — better than pretending the answer is 0.
  const earliest = years.length ? Math.min(...years) : null;
  const latest = years.length ? Math.max(...years) : null;

  return {
    total: artworks.length,
    max: MAX_ARTWORKS,
    artistCount: artistKeys.size,
    unknownArtistCount,
    datedCount: years.length,
    earliest,
    latest,
    span: years.length >= 2 ? latest - earliest : null
  };
}

// Turns the numbers from calculateInsights into a readable sentence. Template strings use
// backticks and ${...} to drop values into text: `Hello ${name}`.
function describeInsights(ins) {
  if (ins.total === 0) return 'Add paintings to discover the story of your collection.';

  if (ins.total === 1) {
    const parts = ['1 artwork', ins.artistCount === 1 ? '1 artist' : 'artist unknown'];
    if (ins.earliest !== null) parts.push(`Created in ${ins.earliest}`);
    return parts.join(' · ');
  }

  let artists;
  if (ins.artistCount === 0) {
    artists = `${ins.total} paintings (artists unknown)`;
  } else {
    artists = `${ins.artistCount} ${plural(ins.artistCount, 'artist')}`;
    if (ins.unknownArtistCount > 0) {
      artists += ` (${ins.unknownArtistCount} ${plural(ins.unknownArtistCount, 'painting')} with unknown artist not counted)`;
    }
  }

  if (ins.datedCount >= 2) {
    if (ins.span === 0) return `Your exhibition brings together ${artists}, and every dated painting was made in ${ins.earliest}.`;
    return `Your exhibition brings together ${artists} and spans ${ins.span} ${plural(ins.span, 'year')} of art history.`;
  }
  const dateNote = ins.datedCount === 1
    ? `Only one painting has a known year (${ins.earliest}), so no time span can be calculated.`
    : "Creation dates aren't available for enough of these artworks to calculate a time span.";
  return `Your exhibition brings together ${artists}. ${dateNote}`;
}


/* ---------- 7b. Curatorial Reflection: a written thread through the exhibition ---------- */

// No AI and no network: the museum's own subject tags for each painting are matched to a handful of
// human themes, and the most shared theme is turned into a short written reflection.
// Each theme below has a "pattern" — a regular expression (regex), a mini search language for text.
// /\b(tree|water)/ means "a word starting with tree or water". Don't worry about memorising regex;
// just know each pattern lists the words that put a painting into that theme.
// "pattern" is matched against each tag; \b means "start of a word", so "season" never matches "son".
const REFLECTION_THEMES = [
  { key: 'nature', short: 'nature and time',
    pattern: /\b(landscape|tree|water|weather|season|cloud|flower|sky|sea|seas|ocean|mountain|river|lake|garden|nature|foliage|plant|winter|autumn|summer|snow|storm|rain|hill|wheat|forest|countryside|rural|bird|animal|wilderness|waterfall|sun|moon)/,
    name: 'the natural world and the passing of time',
    feeling: 'a longing for stillness, and the quiet awareness that light, seasons and people are always changing' },
  { key: 'people', short: 'the human face',
    pattern: /\b(portrait|self-portrait|people|woman|women|man|men|figure|girl|boy|nobility|royal|model|actors?|beard|hairstyle)/,
    name: 'the human face and the question of who we are',
    feeling: 'the wish to be truly seen, and the effort it takes to see someone else' },
  { key: 'home', short: 'closeness and home',
    pattern: /\b(mother|famil|child|couple|love|sister|son|sons|daughter|domestic|interior|bedroom|sleep|marriage|wedding|baby|babies|holy family|everyday life)/,
    name: 'closeness, family and the rooms we live in',
    feeling: 'tenderness, and the ache of caring for people we cannot always hold on to' },
  { key: 'faith', short: 'faith and devotion',
    pattern: /\b(religio|christian|saint|angel|jesus|virgin|madonna|biblical|bible|worship|prayer|praying|spiritual|holy|crucifix|nativity|divine|heaven|altar|shrine|church|devotion|resurrection|annunciation)/,
    name: 'faith, devotion and the search for meaning',
    feeling: 'the need for something larger than ourselves, and the comfort and doubt that come with it' },
  { key: 'conflict', short: 'struggle and mortality',
    pattern: /\b(death|violence|war|weapon|battle|blood|skull|sword|beheading|decapitation|execution|conflict|soldier|gun|armor|danger|cannon|slavery|spear)/,
    name: 'struggle, danger and mortality',
    feeling: 'fear, grief and courage, the feelings that are hardest to say aloud' },
  { key: 'everyday', short: 'everyday life',
    pattern: /\b(leisure|urban|city|cityscape|street|dining|drinking|food|dance|dancer|nightlife|performance|performer|entertainment|circus|train|travel|work|farm|farming|fishing|town|bar)/,
    name: 'everyday life, leisure and the places we gather',
    feeling: 'the small pleasures and quiet loneliness of ordinary days, which usually pass unnoticed' },
  { key: 'myth', short: 'myth and imagination',
    pattern: /\b(mytholog|myth|god|goddess|deity|deities|monster|dragon|fantas|mysteries|mermaid|merman|cupid|venus|zeus|neptune|heracles|nymph|dream|symbol)/,
    name: 'myth, fantasy and the imagination',
    feeling: 'the urge to turn what we cannot explain into a story' },
  { key: 'form', short: 'color and form',
    pattern: /\b(geometric|grid|square|circle|triangle|stripe|gestural|abstract|decorative|color|colour)/,
    name: 'color, shape and pure form',
    feeling: 'emotion that has no object, a mood you can feel long before you can name it' }
];

// Tags that describe the museum's records, not the picture.
const IGNORED_SUBJECTS = /(world's fair|century of progress|collection|chicago|^painting$|^portraits?$|^people$)/;

function subjectsOf(art) { return Array.isArray(art.subjects) ? art.subjects : []; }

// Pure function: selected paintings in, a themed text and the evidence for it out.
function buildReflection(artworks) {
  const n = artworks.length;
  if (n < 2) return { text: 'Add at least two paintings and ATELIER will look for the thread that connects them.', shared: [] };

  // How many paintings touch each theme (a painting counts once per theme).
  const counts = REFLECTION_THEMES.map((theme) => ({
    theme,
    count: artworks.filter((art) => subjectsOf(art).some((tag) => theme.pattern.test(tag))).length
  })).sort((a, b) => (b.count - (b.theme.key === 'people' ? 0.5 : 0)) - (a.count - (a.theme.key === 'people' ? 0.5 : 0)));
  // (the generic "people" theme loses ties, so a more specific shared idea such as faith comes first)

  // Subject tags that two or more paintings have in common: the visible evidence.
  const tagCounts = new Map();
  artworks.forEach((art) => new Set(subjectsOf(art)).forEach((tag) => {
    if (!IGNORED_SUBJECTS.test(tag)) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }));
  const shared = [...tagCounts].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([tag]) => tag);

  const top = counts[0];
  const second = counts[1];
  const years = artworks.map((a) => a.startYear).filter(Number.isFinite);
  const span = years.length >= 2 ? Math.max(...years) - Math.min(...years) : null;

  if (top.count < 2) {
    return {
      text: `Your ${n} paintings don't share one obvious subject, and that can make the most interesting exhibition. The thread between them is whatever you felt when you chose each one. Try giving your exhibition a title that names it.`,
      shared
    };
  }

  const sentences = [
    top.count >= Math.ceil(n * 0.6)
      ? `Across your ${n} paintings, one idea keeps returning: ${top.theme.name}.`
      : `Across your ${n} paintings, the strongest thread is ${top.theme.name}.`,
    `It speaks to ${top.theme.feeling}.`
  ];
  if (second.count >= 2) {
    sentences.push(`Alongside it runs a quieter thread: ${second.theme.short}.`);
  }
  if (span !== null && span >= 100) {
    sentences.push(`Their dates stretch across about ${span} years, which suggests these feelings were as familiar to people then as they are to us now.`);
  } else if (span !== null && span <= 30) {
    sentences.push('Made within a few decades of each other, they read like a conversation between neighbors.');
  }
  sentences.push('What would you call it? The title you give this exhibition is the last word.');
  return { text: sentences.join(' '), shared };
}


/* ---------- 8. Saving and loading ---------- */
// localStorage is a small storage box built into the browser. It keeps text (strings) even after
// the tab is closed. We can only store text, so we convert our object with JSON.stringify()
// when saving and back with JSON.parse() when loading.
// Never trust stored data: the user (or another program) could have edited it, so we VALIDATE it.

function createEmptyExhibition() {
  return { version: 2, title: '', theme: { type: 'none', value: '' }, atmosphere: 'white-cube', artworks: [] };
}

function cleanString(value, max) {
  return typeof value === 'string' ? value.slice(0, max) : null;
}

// Checks a saved painting; returns a clean copy or null. Saved data is never trusted blindly.
function validateArtwork(a) {
  if (!a || typeof a !== 'object' || !Number.isInteger(a.id) || a.id <= 0) return null;
  const title = cleanString(a.title, 300);
  const artist = cleanString(a.artist, 300);
  const dateLabel = cleanString(a.dateLabel, 100);
  const imageId = cleanString(a.imageId, 100);
  const altText = cleanString(a.altText, 1000);
  if (!title || artist === null || dateLabel === null || !imageId || altText === null) return null;
  if (typeof a.imageUrl !== 'string' || !a.imageUrl.startsWith('https://')) return null;
  if (typeof a.sourceUrl !== 'string' || !a.sourceUrl.startsWith(`${MUSEUM_SITE}/artworks/`)) return null;
  if (a.startYear !== null && !Number.isFinite(a.startYear)) return null;
  return {
    id: a.id, title, artist, artistKey: artist.trim().toLowerCase(), dateLabel,
    startYear: a.startYear,
    subjects: Array.isArray(a.subjects) ? cleanSubjects(a.subjects) : null,   // null = saved before subjects existed; filled in at start-up
    imageId, imageUrl: a.imageUrl, altText, sourceUrl: a.sourceUrl
  };
}

function validateExhibition(data) {
  if (!data || typeof data !== 'object' || data.version !== 2) return null;
  const title = cleanString(data.title, MAX_TITLE);
  if (title === null) return null;
  if (!ATMOSPHERES.includes(data.atmosphere)) return null;

  const theme = data.theme;
  if (!theme || typeof theme !== 'object') return null;
  let cleanTheme;
  if (theme.type === 'none') cleanTheme = { type: 'none', value: '' };
  else if (theme.type === 'preset' && THEMES.includes(theme.value)) cleanTheme = { type: 'preset', value: theme.value };
  else if (theme.type === 'custom' && typeof theme.value === 'string') cleanTheme = { type: 'custom', value: theme.value.slice(0, MAX_THEME) };
  else return null;

  if (!Array.isArray(data.artworks) || data.artworks.length > MAX_ARTWORKS) return null;
  const artworks = [];
  const seen = new Set();
  for (const raw of data.artworks) {
    const clean = validateArtwork(raw);
    if (!clean || seen.has(clean.id)) return null;
    seen.add(clean.id);
    artworks.push(clean);
  }
  return { version: 2, title, theme: cleanTheme, atmosphere: data.atmosphere, artworks };
}

// Runs once at start-up. Three outcomes: nothing saved yet -> empty exhibition;
// saved and valid -> use it; saved but broken -> start fresh and tell the user.
function loadExhibition() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    ui.storageOk = false;   // storage is blocked in this browser
    return createEmptyExhibition();
  }
  if (raw === null) return createEmptyExhibition();

  let parsed = null;
  try { parsed = JSON.parse(raw); } catch (error) { parsed = null; }
  const valid = validateExhibition(parsed);
  if (!valid) {
    ui.recoveryNotice = 'Your saved exhibition could not be read, so we started a fresh one.';
    return createEmptyExhibition();
  }
  return valid;
}

// Called after EVERY change. Saving can fail (private browsing, full storage), so it's in try/catch.
function saveExhibition() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exhibition));
    ui.storageOk = true;
  } catch (error) {
    ui.storageOk = false;   // keep working in this session, and tell the user honestly
  }
  renderNotices();
}


/* ---------- 9. Changing the exhibition ---------- */
// Every change follows the same recipe: 1) change the data  2) save  3) redraw  4) announce.
// The ORDER of the exhibition.artworks array decides which wall slot a painting gets,
// so "moving" a painting is really just swapping two items in the array.

function addArtwork(art) {
  if (isSelected(art.id)) return;                       // no duplicates
  if (isFull()) { announce(FULL_MESSAGE); return; }     // never more than six

  exhibition.artworks.push(art);
  ui.wall = wallOfIndex(exhibition.artworks.length - 1);   // jump to the wall that received it
  saveExhibition();
  renderAll();
  announce(`Added ${art.title}. ${exhibition.artworks.length} of ${MAX_ARTWORKS} paintings. Showing the ${WALL_LABELS[ui.wall]}.`);
}

function removeArtwork(id) {
  const index = exhibition.artworks.findIndex((a) => a.id === id);
  if (index === -1) return;
  // splice(index, 1) deletes 1 item at that position and returns it (in an array, so we unpack it with [removed]).
  const [removed] = exhibition.artworks.splice(index, 1);   // later paintings close the gap
  saveExhibition();
  renderAll();
  announce(`Removed ${removed.title}. ${exhibition.artworks.length} of ${MAX_ARTWORKS} paintings.`);
}

function moveArtwork(id, direction) {
  const index = exhibition.artworks.findIndex((a) => a.id === id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= exhibition.artworks.length) return;

  const list = exhibition.artworks;
  [list[index], list[target]] = [list[target], list[index]];   // swap places in the array
  ui.wall = wallOfIndex(target);
  saveExhibition();
  renderAll();
  announce(`Moved ${list[target].title} to ${slotLabel(target)}.`);

  // Keep keyboard focus on the same button so repeated moves are easy.
  const same = els.selectedList.querySelector(`[data-action="${direction < 0 ? 'earlier' : 'later'}"][data-id="${id}"]`);
  const other = els.selectedList.querySelector(`[data-action="${direction < 0 ? 'later' : 'earlier'}"][data-id="${id}"]`);
  (same && !same.disabled ? same : other)?.focus();
}

function setWall(wall) {
  ui.wall = wall;
  renderWall();
}


/* ---------- 10. Drawing the page ---------- */
// "Render" functions read the data and update what's on screen. They never change the data.
// That keeps things predictable: data in -> page out. renderAll() simply runs every one of them.

function renderAll() {
  renderCounter();
  renderWall();
  renderGallery();
  renderSelectedList();
  renderInsights();
  renderFinish();
  renderAddButtons();
  renderDrawer();
  renderHeadings();
  renderNotices();
}

function renderCounter() {
  const n = exhibition.artworks.length;
  els.collectionCount.textContent = n;
  els.drawerCount.textContent = n;
  els.counterNum.textContent = n;
  els.tabCount.textContent = `${n}/${MAX_ARTWORKS}`;
}

// The 3D room is turned with CSS, not JavaScript. We only set an attribute: data-wall="left".
// styles.css has a rule for [data-wall="left"] that rotates the room. JS decides WHAT, CSS decides HOW.
function renderWall() {
  els.stage.dataset.wall = ui.wall;
  els.wallButtons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.wall === ui.wall)));
}

// Fills the six wall positions straight from the selected array.
function renderGallery() {
  els.stage.dataset.atmosphere = exhibition.atmosphere;
  els.emptyNote.hidden = exhibition.artworks.length > 0;

  slotEls.forEach((slot, index) => {
    const art = exhibition.artworks[index];
    const key = art ? String(art.id) : 'empty';
    if (slot.dataset.id === key) return;   // this slot already shows the right thing
    slot.dataset.id = key;

    slot.replaceChildren();
    if (art) {
      const button = el('button', {
        type: 'button', class: 'painting', 'data-action': 'explore', 'data-id': art.id,
        'aria-label': `Explore ${describeArt(art)}`
      }, artImage(art));
      slot.append(button);
    } else {
      slot.append(el('div', { class: 'slot-empty', 'aria-hidden': 'true' }));
    }
  });
}

// .map() turns every painting in the array into a list item (<li>), and replaceChildren()
// swaps the old list for the new one. Each button carries data-action and data-id attributes
// so ONE click handler (in bindEvents) can tell which button was pressed and for which painting.
function renderSelectedList() {
  const list = exhibition.artworks;
  els.selectedEmpty.hidden = list.length > 0;
  els.selectedList.replaceChildren(...list.map((art, index) => {
    const name = art.title;
    return el('li', { class: 'row' },
      el('div', { class: 'row-thumb' }, artImage(art)),
      el('div', { class: 'row-main' },
        el('p', { class: 'row-title', text: art.title }),
        el('p', { class: 'row-sub', text: art.artist || 'Artist unknown' }),
        el('p', { class: 'row-sub', text: slotLabel(index) })),
      el('div', { class: 'row-actions' },
        el('button', { type: 'button', class: 'btn btn-secondary btn-small', 'data-action': 'explore', 'data-id': art.id, 'aria-label': `Explore ${name}`, text: 'Explore' }),
        el('button', { type: 'button', class: 'btn btn-secondary btn-small', 'data-action': 'earlier', 'data-id': art.id, 'aria-label': `Move Earlier: ${name}`, disabled: index === 0, text: 'Move Earlier' }),
        el('button', { type: 'button', class: 'btn btn-secondary btn-small', 'data-action': 'later', 'data-id': art.id, 'aria-label': `Move Later: ${name}`, disabled: index === list.length - 1, text: 'Move Later' }),
        el('button', { type: 'button', class: 'btn btn-secondary btn-small', 'data-action': 'remove', 'data-id': art.id, 'aria-label': `Remove: ${name}`, text: 'Remove' })));
  }));
}

function renderInsights() {
  const ins = calculateInsights(exhibition.artworks);
  els.insightsSummary.textContent = describeInsights(ins);

  const stat = (label, value) => el('div', {}, el('dt', { text: label }), el('dd', { text: value }));
  els.insightsStats.replaceChildren(
    stat('Artworks', `${ins.total} / ${ins.max}`),
    stat('Distinct artists', String(ins.artistCount)),
    stat('Earliest year', ins.earliest === null ? 'Unknown' : String(ins.earliest)),
    stat('Latest year', ins.latest === null ? 'Unknown' : String(ins.latest)),
    stat('Years spanned', ins.span === null ? 'Unknown' : String(ins.span))
  );

  const reflection = buildReflection(exhibition.artworks);
  els.reflection.textContent = reflection.text;
  els.reflectionShared.hidden = reflection.shared.length === 0;
  els.reflectionShared.textContent = reflection.shared.length ? `Shared subjects: ${reflection.shared.join(', ')}` : '';
}

function clearTitleError() {
  els.titleError.textContent = '';
  els.titleInput.removeAttribute('aria-invalid');
}

function renderFinish() {
  const none = exhibition.artworks.length === 0;
  els.finishBtn.disabled = none;
  els.viewBtn.disabled = none;
  els.finishHint.hidden = !none;
}

// Updates the Add buttons in place (so the cards do not reload their images).
function renderAddButtons() {
  const full = isFull();
  els.fullHint.hidden = !full;
  document.querySelectorAll('[data-action="add"]').forEach((btn) => {
    const art = ui.results.find((a) => a.id === Number(btn.dataset.id));
    if (!art) return;
    const added = isSelected(art.id);
    btn.textContent = added ? 'In your exhibition' : 'Add to Exhibition';
    btn.setAttribute('aria-label', `${added ? 'In your exhibition' : 'Add to Exhibition'}: ${art.title}`);
    btn.classList.toggle('is-added', added);
    if (added || full) btn.setAttribute('aria-disabled', 'true'); else btn.removeAttribute('aria-disabled');
    if (full && !added) btn.setAttribute('aria-describedby', 'full-hint'); else btn.removeAttribute('aria-describedby');
  });
}

function currentThemeText() {
  return exhibition.theme.type === 'none' ? '' : exhibition.theme.value.trim();
}

function renderHeadings() {
  const title = exhibition.title.trim() || 'Untitled Exhibition';
  els.galleryTitle.textContent = title;
  const theme = currentThemeText();
  els.galleryTheme.hidden = !theme;
  els.galleryTheme.textContent = theme ? `Theme: ${theme}` : '';
}

// Shows a warning bar if saving doesn't work, or if saved data was unreadable.
function renderNotices() {
  const text = !ui.storageOk ? 'Changes cannot be saved in this browser.' : ui.recoveryNotice;
  els.storageNotice.hidden = !text;
  els.storageNotice.replaceChildren();
  if (text) {
    els.storageNotice.append(el('span', { text }));
    if (ui.storageOk) {
      const dismiss = el('button', { type: 'button', 'data-action': 'dismiss-notice', text: 'Dismiss' });
      els.storageNotice.append(dismiss);
    }
  }
  // Only claim "saved" when saving really worked and something is saved.
  els.saveStatus.textContent = ui.storageOk && exhibition.artworks.length ? 'Saved automatically on this browser.' : '';
}

function renderDrawer() {
  const list = exhibition.artworks;
  els.drawerEmpty.hidden = list.length > 0;
  els.drawerList.replaceChildren(...list.map((art) =>
    el('li', { class: 'row' },
      el('div', { class: 'row-thumb' }, artImage(art)),
      el('div', { class: 'row-main' },
        el('p', { class: 'row-title', text: art.title }),
        el('p', { class: 'row-sub', text: art.artist || 'Artist unknown' })),
      el('div', { class: 'row-actions' },
        el('button', { type: 'button', class: 'btn btn-secondary btn-small', 'data-action': 'explore', 'data-id': art.id, 'aria-label': `Explore the Artwork: ${art.title}`, text: 'Explore' })))));
}

function syncControlsFromExhibition() {
  els.titleInput.value = exhibition.title;
  const t = exhibition.theme;
  els.themeSelect.value = t.type === 'none' ? 'none' : t.type === 'custom' ? 'custom' : t.value;
  els.themeCustomWrap.hidden = t.type !== 'custom';
  els.themeCustom.value = t.type === 'custom' ? t.value : '';
  els.themeCount.textContent = `${els.themeCustom.value.length} / ${MAX_THEME}`;
  els.atmosphereRadios.forEach((r) => { r.checked = r.value === exhibition.atmosphere; });
}


/* ---------- 11. Discover: search, categories, states ---------- */
// The Discover panel is always in ONE of four states: loading, results, empty, or error.
// Showing the right state for each situation is what makes an app feel solid.

function describeRequest(request) {
  if (request.kind === 'featured') return 'Featured paintings';
  if (request.kind === 'category') return CATEGORY_LABELS[request.key];
  return `Results for “${request.text}”`;
}

function markActiveChip(request) {
  const active = request.kind === 'featured' ? 'featured' : request.kind === 'category' ? request.key : null;
  els.chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.category === active)));
}

// Checks the search box before any request is made. Returns the clean text, or null if invalid.
// Validate BEFORE calling the API: empty or very long searches show a message and send no request.
function validateQuery(raw) {
  const text = raw.trim();
  let message = '';
  if (!text) message = INVALID_EMPTY;
  else if (text.length > MAX_QUERY) message = INVALID_LONG;

  if (message) {
    els.searchError.textContent = message;
    els.searchInput.setAttribute('aria-invalid', 'true');
    els.searchInput.focus();
    return null;
  }
  clearInvalid();
  return text;
}

function clearInvalid() {
  els.searchError.textContent = '';
  els.searchInput.removeAttribute('aria-invalid');
}

function searchArtworks() {
  const text = validateQuery(els.searchInput.value);
  if (text === null) return;   // invalid: no fetch is sent
  loadDiscover({ kind: 'search', text });
}

function renderDiscoverState(kind, copyrightArtist = '') {
  const region = els.resultsRegion;
  region.setAttribute('aria-busy', String(kind === 'loading'));
  els.fullHint.hidden = !isFull();

  if (kind === 'loading') {
    els.discoverStatus.textContent = '';
    const skeletons = Array.from({ length: 6 }, () =>
      el('li', { class: 'card skeleton', 'aria-hidden': 'true' },
        el('div', { class: 'card-image' }),
        el('div', { class: 'card-body' }, el('div', { class: 'skeleton-line' }), el('div', { class: 'skeleton-line short' }))));
    region.replaceChildren(
      el('p', { class: 'state state-loading', role: 'status', text: 'Finding artworks…' }),
      el('ul', { class: 'card-grid', style: 'margin-top: 16px' }, skeletons));
    return;
  }

  if (kind === 'error') {
    els.discoverStatus.textContent = '';
    region.replaceChildren(el('div', { class: 'state state-error', role: 'alert' },
      el('p', { text: "We couldn't load artworks right now. Your exhibition is safe." }),
      el('button', { type: 'button', class: 'btn', 'data-action': 'retry', text: 'Retry' })));
    return;
  }

  if (kind === 'empty') {
    els.discoverStatus.textContent = '';
    const message = copyrightArtist
      ? `${copyrightArtist} is in the Art Institute of Chicago's collection, but their work is still under copyright, so it can't be displayed here. ATELIER only shows public-domain paintings. Try an artist whose work is in the public domain, such as Claude Monet or Vincent van Gogh.`
      : 'No paintings found. Try a different artist or keyword.';
    region.replaceChildren(el('div', { class: 'state state-empty' },
      el('p', { text: message }),
      el('button', { type: 'button', class: 'btn btn-secondary', 'data-action': 'clear-search', text: 'Clear Search' })));
    return;
  }

  // kind === 'results'
  els.discoverStatus.textContent = `Showing ${ui.results.length} ${plural(ui.results.length, 'painting')}.`;
  renderArtworkCards();
}

function renderArtworkCards() {
  const cards = ui.results.map((art) =>
    el('li', { class: 'card' },
      el('div', { class: 'card-image' }, artImage(art)),
      el('div', { class: 'card-body' },
        el('h4', { class: 'card-title', text: art.title }),
        el('p', { class: 'card-artist', text: art.artist || 'Artist unknown' }),
        art.dateLabel ? el('p', { class: 'card-date', text: art.dateLabel }) : null,
        el('div', { class: 'card-actions' },
          el('button', { type: 'button', class: 'btn btn-secondary btn-small', 'data-action': 'explore', 'data-id': art.id, 'aria-label': `Explore ${art.title}`, text: 'Explore' }),
          el('button', { type: 'button', class: 'btn btn-primary btn-small', 'data-action': 'add', 'data-id': art.id, text: 'Add to Exhibition' })))));
  els.resultsRegion.replaceChildren(el('ul', { class: 'card-grid' }, cards));
  renderAddButtons();
}

// Runs one Featured / category / search request and draws the right state.
// THE FULL API FLOW, step by step:
//   1. Remember the request, cancel any older one still in flight, show the loading skeletons.
//   2. buildDiscoverUrl() makes the address; fetchMuseumData() fetches and checks it.
//   3. normalizeArtwork() cleans each result; .filter(Boolean) drops the nulls (skipped ones).
//   4. Results found -> show cards. None -> maybe explain copyright. Error -> show Retry.
async function loadDiscover(request) {
  ui.lastRequest = request;
  // RACE CONDITION guard: if you click "Nature" then "Portraits" quickly, the Nature answer might
  // arrive LAST and wrongly replace Portraits. Each request gets a number (seq); when an answer
  // arrives we only use it if its number is still the newest. AbortController also cancels the old
  // network request outright.
  ui.searchSeq += 1;
  const seq = ui.searchSeq;   // lets us ignore an older, slower request that finishes late
  if (ui.searchController) ui.searchController.abort();
  const controller = new AbortController();
  ui.searchController = controller;

  markActiveChip(request);
  els.resultsTitle.textContent = describeRequest(request);
  renderDiscoverState('loading');
  els.searchBtn.disabled = true;

  try {
    const json = await fetchMuseumData(buildDiscoverUrl(request), { signal: controller.signal });
    if (seq !== ui.searchSeq) return;
    if (!Array.isArray(json.data)) throw new Error('The museum API returned an unexpected response.');

    // The museum tells us its current image-server address in json.config; use it if it looks safe (https).
    const iiif = json.config && typeof json.config.iiif_url === 'string' && json.config.iiif_url.startsWith('https://')
      ? json.config.iiif_url : IIIF_DEFAULT;
    ui.results = json.data
      .map((raw) => normalizeArtwork(raw, iiif))
      .filter(Boolean)
      .slice(0, DISPLAY_LIMIT);

    if (ui.results.length) { renderDiscoverState('results'); return; }

    const copyrightArtist = await findCopyrightedArtist(request, controller.signal);
    if (seq !== ui.searchSeq) return;
    renderDiscoverState('empty', copyrightArtist);
  } catch (error) {
    if (error.name === 'AbortError' || seq !== ui.searchSeq) return;
    console.error(error);
    ui.results = [];
    renderDiscoverState('error');   // the saved exhibition is untouched
  } finally {
    // "finally" runs whether the request succeeded OR failed — a good place to re-enable the button.
    if (seq === ui.searchSeq) els.searchBtn.disabled = false;
  }
}


/* ---------- 12. Explore the Artwork ---------- */
// The details dialog opens instantly with what we already know (title, artist, image), then makes
// a SECOND API call for the extra story and display facts. These are never saved: they are fetched
// fresh each time, so saved data stays small and the museum's wording is always current.
// <dialog>.showModal() is a built-in browser feature: it shows a pop-up, dims the page, and traps keyboard focus.

function openArtworkDetails(art, opener) {
  ui.detailArt = art;
  ui.detailOpener = opener || document.activeElement;

  els.detailsTitle.textContent = art.title;
  els.detailsMeta.textContent = [art.artist || 'Artist unknown', art.dateLabel].filter(Boolean).join(' · ');
  els.detailsFigure.replaceChildren(artImage(art));
  els.detailsAttribution.href = art.sourceUrl;

  if (!els.detailsDialog.open) els.detailsDialog.showModal();
  loadDetails(art);
}

// Fetches the story and display facts when the dialog opens (they are never saved).
async function loadDetails(art) {
  ui.detailSeq += 1;
  const seq = ui.detailSeq;
  if (ui.detailController) ui.detailController.abort();
  const controller = new AbortController();
  ui.detailController = controller;

  els.detailsLive.replaceChildren(el('p', { class: 'state state-loading', role: 'status', text: 'Loading artwork details…' }));

  try {
    const json = await fetchMuseumData(buildDetailUrl(art.id), { signal: controller.signal });
    if (seq !== ui.detailSeq) return;
    const data = json.data;
    if (typeof data !== 'object' || Array.isArray(data) || Number(data.id) !== art.id) {
      throw new Error('The museum API returned an unexpected response.');
    }
    renderDetails(data);
  } catch (error) {
    if (error.name === 'AbortError' || seq !== ui.detailSeq) return;
    console.error(error);
    els.detailsLive.replaceChildren(el('div', { class: 'state state-error', role: 'alert' },
      el('p', { text: 'Artwork details are temporarily unavailable.' }),
      el('button', { type: 'button', class: 'btn', 'data-action': 'retry-details', text: 'Retry Details' })));
  }
}

function renderDetails(data) {
  const story = htmlToParagraphs(data.short_description).length
    ? htmlToParagraphs(data.short_description)
    : htmlToParagraphs(data.description);

  const storyNodes = story.length
    ? story.map((p) => el('p', { text: p }))
    : [el('p', { class: 'hint', text: 'The museum has not provided a description for this artwork.' })];

  // Where is it? Holding collection, display status and place of origin are kept separate on purpose.
  let status;
  if (data.is_on_view === true) {
    const gallery = typeof data.gallery_title === 'string' && data.gallery_title.trim();
    status = 'Reported on view at the Art Institute of Chicago' + (gallery ? ` (${gallery})` : '');
  } else if (data.is_on_view === false) {
    status = 'Not listed as currently on view at the museum';
  } else {
    status = 'Current display status unavailable';
  }
  const loan = htmlToParagraphs(data.on_loan_display).join(' ');

  const medium = typeof data.medium_display === 'string' && data.medium_display.trim();
  const origin = typeof data.place_of_origin === 'string' && data.place_of_origin.trim();

  const facts = [
    el('div', {}, el('dt', { text: 'Holding collection' }), el('dd', { text: 'Art Institute of Chicago' })),
    el('div', {}, el('dt', { text: 'Current display status' }),
      el('dd', { text: status }),
      loan ? el('dd', { class: 'hint', text: `Loan note from the museum: ${loan}` }) : null)
  ];
  if (origin) facts.push(el('div', {}, el('dt', { text: 'Place of origin' }), el('dd', { text: origin })));

  els.detailsLive.replaceChildren(
    medium ? el('p', { class: 'details-meta', text: `Medium: ${medium}` }) : null,
    el('h3', { text: 'The Story Behind the Artwork' }),
    ...storyNodes,
    el('h3', { text: 'Where Can I Find It?' }),
    el('dl', {}, facts)
  );
}


/* ---------- 13. Dialogs, modes and event listeners ---------- */
// The app has two "modes": "studio" (build the exhibition) and "gallery" (just view it).
// setMode() writes data-mode="..." on <body>, and CSS shows/hides the right parts.

function setMode(mode) {
  els.body.dataset.mode = mode;
  const gallery = mode === 'gallery';
  els.galleryHeading.hidden = !gallery;
  els.editBtn.hidden = !gallery;
  if (gallery) setTab('exhibition');
}

// Two tabs: "artworks" (find paintings) and "exhibition" (arrange and name them).
// Only one panel is visible at a time, so the visitor focuses on one job at a time.
function setTab(tab, { focusTab = false } = {}) {
  ui.tab = tab;
  els.tabs.forEach((btn) => {
    const on = btn.dataset.tab === tab;
    btn.setAttribute('aria-selected', String(on));
    btn.tabIndex = on ? 0 : -1;
    if (on && focusTab) btn.focus();
  });
  els.discover.hidden = tab !== 'artworks';
  els.exhibitionPanel.hidden = tab !== 'exhibition';
  window.scrollTo(0, 0);
}

function openOpening() {
  const ins = calculateInsights(exhibition.artworks);
  const n = exhibition.artworks.length;
  els.openingTitle.textContent = exhibition.title.trim() || 'Untitled Exhibition';
  const theme = currentThemeText();
  els.openingTheme.hidden = !theme;
  els.openingTheme.textContent = theme ? `Theme: ${theme}` : '';
  els.openingCount.textContent = `${n} ${plural(n, 'painting')} on display`;
  els.openingInsights.textContent = describeInsights(ins);
  els.openingReflection.textContent = buildReflection(exhibition.artworks).text;
  els.openingDialog.showModal();
}

function startNewExhibition() {
  exhibition = createEmptyExhibition();
  ui.wall = 'front';
  ui.recoveryNotice = '';
  saveExhibition();
  syncControlsFromExhibition();
  setMode('studio');
  renderAll();
  announce('Started a new exhibition.');
}

function openDrawer() {
  renderDrawer();
  els.drawer.showModal();
}

// "Binding events" = telling the browser "when THIS happens to THAT element, run THIS function".
// element.addEventListener('click', function) is the pattern you'll see below again and again.
function bindEvents() {
  // Closing any dialog: buttons marked data-close, or a click on the dark backdrop.
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
    });
  });
  // Give focus back to what opened the details if the browser did not.
  els.detailsDialog.addEventListener('close', () => {
    if (ui.detailController) ui.detailController.abort();
    ui.detailSeq += 1;
    const opener = ui.detailOpener;
    if (opener && opener.isConnected && (document.activeElement === document.body || !document.activeElement)) opener.focus();
  });

  els.tabs.forEach((btn, i) => {
    btn.addEventListener('click', () => { setMode('studio'); setTab(btn.dataset.tab); });
    btn.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      const next = els.tabs[(i + (event.key === 'ArrowRight' ? 1 : els.tabs.length - 1)) % els.tabs.length];
      setMode('studio');
      setTab(next.dataset.tab, { focusTab: true });
    });
  });
  document.getElementById('to-exhibition-btn').addEventListener('click', () => setTab('exhibition'));
  document.getElementById('to-artworks-btn').addEventListener('click', () => setTab('artworks'));

  els.collectionBtn.addEventListener('click', openDrawer);
  els.newBtn.addEventListener('click', () => els.confirmDialog.showModal());
  els.confirmNewBtn.addEventListener('click', () => { els.confirmDialog.close(); startNewExhibition(); });
  els.editBtn.addEventListener('click', () => {
    setMode('studio');
    setTab('exhibition');
    els.titleInput.focus();
  });
  els.browseBtn.addEventListener('click', () => {
    els.drawer.close();
    setMode('studio');
    setTab('artworks');
    els.searchInput.focus();
  });

  // Search
  els.searchForm.addEventListener('submit', (event) => { event.preventDefault(); searchArtworks(); });
  els.searchInput.addEventListener('input', () => { if (els.searchInput.getAttribute('aria-invalid')) clearInvalid(); });
  els.chips.forEach((chip) => chip.addEventListener('click', () => {
    clearInvalid();
    els.searchInput.value = '';
    const key = chip.dataset.category;
    loadDiscover(key === 'featured' ? { kind: 'featured' } : { kind: 'category', key });
  }));

  // Buttons inside the results area.
  // EVENT DELEGATION: the cards are created and destroyed constantly, so instead of attaching a
  // listener to every button, we attach ONE listener to the container. A click "bubbles up" to it,
  // and event.target.closest(...) finds which button was actually clicked. The button's
  // data-action says what to do (add / explore / retry...) and data-id says which painting.
  els.resultsRegion.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    const art = ui.results.find((a) => a.id === Number(btn.dataset.id));
    switch (btn.dataset.action) {
      case 'add':
        if (btn.getAttribute('aria-disabled') === 'true') { if (isFull() && !isSelected(art.id)) announce(FULL_MESSAGE); return; }
        addArtwork(art);
        break;
      case 'explore': if (art) openArtworkDetails(art, btn); break;
      case 'retry': loadDiscover(ui.lastRequest); break;
      case 'clear-search':
        els.searchInput.value = '';
        clearInvalid();
        loadDiscover({ kind: 'featured' });
        els.searchInput.focus();
        break;
      default: break;
    }
  });

  // Walls, the selected list, the drawer and the gallery paintings all share one click handler.
  const handleArtworkClick = (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const art = exhibition.artworks.find((a) => a.id === id);
    switch (btn.dataset.action) {
      case 'explore': if (art) openArtworkDetails(art, btn); break;
      case 'earlier': moveArtwork(id, -1); break;
      case 'later': moveArtwork(id, 1); break;
      case 'remove':
        removeArtwork(id);
        els.selectedTitle.focus();
        break;
      default: break;
    }
  };
  els.selectedList.addEventListener('click', handleArtworkClick);
  els.drawerList.addEventListener('click', handleArtworkClick);
  els.stage.addEventListener('click', handleArtworkClick);

  els.detailsLive.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="retry-details"]') && ui.detailArt) loadDetails(ui.detailArt);
  });

  els.storageNotice.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="dismiss-notice"]')) { ui.recoveryNotice = ''; renderNotices(); }
  });

  els.wallButtons.forEach((btn) => btn.addEventListener('click', () => setWall(btn.dataset.wall)));

  // Title, theme, atmosphere.
  // The 'input' event fires on every keystroke, so the title is saved and shown as the user types.
  els.titleInput.addEventListener('input', () => {
    exhibition.title = els.titleInput.value.slice(0, MAX_TITLE);
    if (exhibition.title.trim()) clearTitleError();
    saveExhibition();
    renderHeadings();
  });
  els.themeSelect.addEventListener('change', () => {
    const value = els.themeSelect.value;
    if (value === 'none') exhibition.theme = { type: 'none', value: '' };
    else if (value === 'custom') exhibition.theme = { type: 'custom', value: els.themeCustom.value.slice(0, MAX_THEME) };
    else exhibition.theme = { type: 'preset', value };
    els.themeCustomWrap.hidden = value !== 'custom';
    if (value === 'custom') els.themeCustom.focus();
    saveExhibition();
    renderHeadings();
  });
  els.themeCustom.addEventListener('input', () => {
    const value = els.themeCustom.value.slice(0, MAX_THEME);
    els.themeCount.textContent = `${value.length} / ${MAX_THEME}`;
    exhibition.theme = { type: 'custom', value };
    saveExhibition();
    renderHeadings();
  });
  els.atmosphereRadios.forEach((radio) => radio.addEventListener('change', () => {
    if (!radio.checked || !ATMOSPHERES.includes(radio.value)) return;
    exhibition.atmosphere = radio.value;
    saveExhibition();
    renderGallery();
  }));

  // Finish Curating
  els.finishBtn.addEventListener('click', () => {
    if (!exhibition.artworks.length) return;
    // An exhibition must have a name before it can be finished.
    if (!exhibition.title.trim()) {
      els.titleError.textContent = 'Please name your exhibition before finishing.';
      els.titleInput.setAttribute('aria-invalid', 'true');
      els.titleInput.focus();
      return;
    }
    openOpening();
  });
  els.enterBtn.addEventListener('click', () => {
    els.openingDialog.close();
    setMode('gallery');
    els.galleryTitle.focus();
  });
  els.viewBtn.addEventListener('click', () => {
    if (!exhibition.artworks.length) return;
    setMode('gallery');
    els.galleryTitle.focus();
  });
}


/* ---------- 14. Start-up ---------- */
// Everything above only DEFINES functions; nothing runs until init() is called at the very bottom.

function buildRoomSlots() {
  WALLS.forEach((wall) => {
    const holder = document.querySelector(`#wall-${wall} .wall-slots`);
    for (let i = 0; i < 2; i += 1) {
      const slot = el('div', { class: 'slot' });
      holder.append(slot);
      slotEls.push(slot);
    }
  });
}

// Paintings saved before subjects existed have subjects === null. Ask the museum once for just those fields,
// save them, and redraw. If it fails, nothing breaks: the reflection simply has less to work with.
async function fillMissingSubjects() {
  const missing = exhibition.artworks.filter((a) => a.subjects === null);
  if (!missing.length) return;
  try {
    const url = `${API_BASE}/artworks?ids=${missing.map((a) => a.id).join(',')}&fields=id,subject_titles`;
    const json = await fetchMuseumData(url);
    if (!Array.isArray(json.data)) return;
    missing.forEach((art) => {
      const found = json.data.find((d) => d && d.id === art.id);
      const live = exhibition.artworks.find((a) => a.id === art.id);   // the visitor may have removed it meanwhile
      if (live) live.subjects = found ? cleanSubjects(found.subject_titles) : [];
    });
    saveExhibition();
    renderInsights();
  } catch (error) {
    console.error(error);
  }
}

// The order matters: build the room -> load saved data -> fill the form -> attach listeners ->
// draw everything -> start the first API request (Featured paintings) so the page isn't empty.
function init() {
  buildRoomSlots();
  exhibition = loadExhibition();
  ui.wall = exhibition.artworks.length ? wallOfIndex(exhibition.artworks.length - 1) : 'front';
  syncControlsFromExhibition();
  bindEvents();
  setMode('studio');
  setTab('artworks');
  renderAll();
  loadDiscover({ kind: 'featured' });   // the page is useful right away
  fillMissingSubjects();
}

init();
