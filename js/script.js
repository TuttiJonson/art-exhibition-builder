'use strict';

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

const API_BASE = 'https://api.artic.edu/api/v1';
const IIIF_DEFAULT = 'https://www.artic.edu/iiif/2';
const MUSEUM_SITE = 'https://www.artic.edu';

const MAX_ARTWORKS = 6;
const MAX_TITLE = 80;
const MAX_THEME = 80;
const MAX_QUERY = 120;
const REQUEST_LIMIT = 16;   // ask the museum for a few extra...
const DISPLAY_LIMIT = 12;   // ...and show up to 12 eligible paintings
const STORAGE_KEY = 'atelier-exhibition-v2';

const FULL_MESSAGE = 'Gallery full — remove a painting to add another.';
const INVALID_EMPTY = 'Enter an artist, artwork, or subject to search.';
const INVALID_LONG = 'Keep your search under 120 characters.';

// Each category button sends a different museum search ("Featured" uses the museum's own highlights instead).
const CATEGORY_QUERIES = { nature: 'landscape', portraits: 'portrait', city: 'city' };
const CATEGORY_LABELS = { featured: 'Featured', nature: 'Nature', portraits: 'Portraits', city: 'City Life' };

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

const SEARCH_FIELDS = [
  'id', 'title', 'artist_title', 'date_display', 'date_start',
  'image_id', 'is_public_domain', 'artwork_type_title', 'thumbnail.alt_text'
].join(',');

const DETAIL_FIELDS = [
  'id', 'title', 'artist_title', 'date_display', 'medium_display', 'place_of_origin',
  'short_description', 'description', 'is_on_view', 'gallery_title', 'on_loan_display', 'image_id'
].join(',');


/* ---------- 2. State ---------- */

// The ONE exhibition object (PRD section 10). Only this is saved to localStorage.
let exhibition = createEmptyExhibition();

// Everything below is temporary and is never saved.
const ui = {
  wall: 'front',
  results: [],
  lastRequest: { kind: 'featured' },
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

const $ = (id) => document.getElementById(id);

const els = {
  body: document.body,
  collectionBtn: $('collection-btn'),
  collectionCount: $('collection-count'),
  newBtn: $('new-btn'),
  editBtn: $('edit-btn'),
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
  detailsLink: $('details-link'),
  detailsAttribution: $('details-attribution'),
  openingDialog: $('opening-dialog'),
  openingTitle: $('opening-title'),
  openingTheme: $('opening-theme'),
  openingCount: $('opening-count'),
  openingInsights: $('opening-insights'),
  enterBtn: $('enter-btn'),
  confirmDialog: $('confirm-dialog'),
  confirmNewBtn: $('confirm-new-btn')
};

// The six painting positions: slotEls[0] and [1] are the Front Wall, [2] and [3] Left, [4] and [5] Right.
const slotEls = [];


/* ---------- 4. Small helpers ---------- */

// Builds an element safely. Text is always added as plain text, never as HTML.
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

function plural(count, singular, pluralWord) {
  return count === 1 ? singular : (pluralWord || singular + 's');
}

function wallOfIndex(index) { return WALLS[Math.floor(index / 2)]; }

function slotLabel(index) {
  const wall = wallOfIndex(index);
  return `${WALL_LABELS[wall]} · ${SLOT_WORDS[wall][index % 2]}`;
}

function isSelected(id) { return exhibition.artworks.some((a) => a.id === id); }
function isFull() { return exhibition.artworks.length >= MAX_ARTWORKS; }

function describeArt(art) {
  return art.artist ? `${art.title} by ${art.artist}` : art.title;
}

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

// Every request goes through this one function: await fetch inside try/catch,
// response.ok checked BEFORE reading JSON, and the JSON body checked afterwards.
async function fetchMuseumData(url, { signal } = {}) {
  let response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;   // a newer search replaced this one: not a visible error
    throw new Error('Could not reach the museum (network problem).');
  }

  if (!response.ok) {   // a 404 or 500 does not throw by itself, so we check
    throw new Error(`Museum API returned HTTP ${response.status}`);
  }

  let json;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error('The museum API sent data that could not be read.');
  }

  if (!json || json.error || !json.data) {
    throw new Error('The museum API returned an unexpected response.');
  }
  return json;
}

// Builds the search address. The museum's search text goes INSIDE the query (not "q="),
// because "q=" is ignored once filters are added.
function buildDiscoverUrl(request) {
  const params = new URLSearchParams();
  params.set('limit', String(REQUEST_LIMIT));
  params.set('fields', SEARCH_FIELDS);
  params.set('query[bool][filter][0][term][is_public_domain]', 'true');
  params.set('query[bool][filter][1][term][artwork_type_title.keyword]', 'Painting');

  if (request.kind === 'featured') {
    params.set('query[bool][filter][2][term][is_boosted]', 'true');   // the museum's own highlights
  } else {
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

function buildDetailUrl(id) {
  return `${API_BASE}/artworks/${id}?fields=${DETAIL_FIELDS}`;
}


/* ---------- 6. Turning API data into our own artwork records ---------- */

// Returns a small clean record, or null if this result is not an eligible public-domain painting with an image.
function normalizeArtwork(raw, iiifBase = IIIF_DEFAULT) {
  if (!raw || !Number.isInteger(raw.id)) return null;
  if (typeof raw.title !== 'string' || !raw.title.trim()) return null;
  if (typeof raw.image_id !== 'string' || !raw.image_id) return null;
  if (raw.is_public_domain !== true || raw.artwork_type_title !== 'Painting') return null;

  const artist = typeof raw.artist_title === 'string' ? raw.artist_title.trim() : '';
  const title = raw.title.trim();
  const altFromMuseum = raw.thumbnail && typeof raw.thumbnail.alt_text === 'string' ? raw.thumbnail.alt_text.trim() : '';

  return {
    id: raw.id,
    title,
    artist,
    artistKey: artist.toLowerCase(),
    dateLabel: typeof raw.date_display === 'string' ? raw.date_display.trim() : '',
    startYear: Number.isFinite(raw.date_start) ? raw.date_start : null,
    imageId: raw.image_id,
    imageUrl: `${iiifBase}/${raw.image_id}/full/843,/0/default.jpg`,
    altText: altFromMuseum || (artist ? `${title} by ${artist}` : title),
    sourceUrl: `${MUSEUM_SITE}/artworks/${raw.id}`
  };
}


/* ---------- 7. Curatorial Insights: the calculated output ---------- */

// Pure function: selected paintings in, numbers out. It never touches the page.
function calculateInsights(artworks) {
  const artistKeys = new Set();       // a Set only keeps one copy of each artist
  const years = [];
  let unknownArtistCount = 0;

  for (const art of artworks) {
    if (art.artistKey) artistKeys.add(art.artistKey);
    else unknownArtistCount += 1;     // a missing artist is never counted as a new artist
    if (Number.isFinite(art.startYear)) years.push(art.startYear);
  }

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


/* ---------- 8. Saving and loading ---------- */

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
    startYear: a.startYear, imageId, imageUrl: a.imageUrl, altText, sourceUrl: a.sourceUrl
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
}

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

function renderDiscoverState(kind) {
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
    region.replaceChildren(el('div', { class: 'state state-empty' },
      el('p', { text: 'No paintings found. Try a different artist or keyword.' }),
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
async function loadDiscover(request) {
  ui.lastRequest = request;
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

    const iiif = json.config && typeof json.config.iiif_url === 'string' && json.config.iiif_url.startsWith('https://')
      ? json.config.iiif_url : IIIF_DEFAULT;
    ui.results = json.data
      .map((raw) => normalizeArtwork(raw, iiif))
      .filter(Boolean)
      .slice(0, DISPLAY_LIMIT);

    renderDiscoverState(ui.results.length ? 'results' : 'empty');
  } catch (error) {
    if (error.name === 'AbortError' || seq !== ui.searchSeq) return;
    console.error(error);
    ui.results = [];
    renderDiscoverState('error');   // the saved exhibition is untouched
  } finally {
    if (seq === ui.searchSeq) els.searchBtn.disabled = false;
  }
}


/* ---------- 12. Explore the Artwork ---------- */

function openArtworkDetails(art, opener) {
  ui.detailArt = art;
  ui.detailOpener = opener || document.activeElement;

  els.detailsTitle.textContent = art.title;
  els.detailsMeta.textContent = [art.artist || 'Artist unknown', art.dateLabel].filter(Boolean).join(' · ');
  els.detailsFigure.replaceChildren(artImage(art));
  els.detailsLink.href = art.sourceUrl;
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

function setMode(mode) {
  els.body.dataset.mode = mode;
  const gallery = mode === 'gallery';
  els.galleryHeading.hidden = !gallery;
  els.editBtn.hidden = !gallery;
  els.newBtn.hidden = gallery;
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

  els.collectionBtn.addEventListener('click', openDrawer);
  els.newBtn.addEventListener('click', () => els.confirmDialog.showModal());
  els.confirmNewBtn.addEventListener('click', () => { els.confirmDialog.close(); startNewExhibition(); });
  els.editBtn.addEventListener('click', () => {
    setMode('studio');
    els.titleInput.focus();
  });
  els.browseBtn.addEventListener('click', () => {
    els.drawer.close();
    setMode('studio');
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

  // Buttons inside the results area
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

  // Title, theme, atmosphere
  els.titleInput.addEventListener('input', () => {
    exhibition.title = els.titleInput.value.slice(0, MAX_TITLE);
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
  els.finishBtn.addEventListener('click', () => { if (exhibition.artworks.length) openOpening(); });
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

function init() {
  buildRoomSlots();
  exhibition = loadExhibition();
  ui.wall = exhibition.artworks.length ? wallOfIndex(exhibition.artworks.length - 1) : 'front';
  syncControlsFromExhibition();
  bindEvents();
  setMode('studio');
  renderAll();
  loadDiscover({ kind: 'featured' });   // the page is useful right away
}

init();
