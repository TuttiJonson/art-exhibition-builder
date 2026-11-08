# ATELIER — art exhibition builder

**Live site:** https://tuttijonson.github.io/art-exhibition-builder/
**Live site Vercel:** https://art-exhibition-builder.vercel.app

## What it does

ATELIER lets you discover real paintings, pick up to six favorites, and hang them in a virtual gallery. You can read the story behind each painting, see whether the museum currently has it on view, and get a short summary of your exhibition (number of artists, years spanned, and a written reflection).

## API

[Art Institute of Chicago API](https://api.artic.edu/docs/) — free and public, no key needed. Only public-domain paintings with images are shown.

## How to use it

1. Browse the Featured paintings or a category, or search by artist, artwork or subject.
2. Press **Explore** to read a painting's story and where it hangs.
3. Press **Add to Exhibition** (up to six). The Curatorial Insights update as you add or remove.
4. Turn the room with the Front / Left / Right buttons, and reorder with **Move Earlier / Move Later**.
5. Name your exhibition, then optionally pick a theme and gallery atmosphere.
6. Press **Finish Curating**, then **Enter the Gallery**.

Your exhibition is saved automatically in your browser.


## Where the agent's work differed from what I expected

**Commit:** [c8ba20a](https://github.com/TuttiJonson/art-exhibition-builder/commit/c8ba20a5603c5ca20dd3e011e9b910c2436e74f2)

**What the agent built:** Discover and Your Exhibition sat on one long page, with "Skip to your exhibition" and "Back to Discover" links to jump between them. On a phone, tapping "Skip to your exhibition" scrolled down the page, and getting back meant scrolling up again. The exhibition showed up in several places, so it was unclear where it actually was.

**What I expected:** A better UI would have the exhibition in its own tab. Users were confused about where to click and where the exhibition was, because it kept moving down and up the page. The exhibition should be one place, not several, so a user can focus on the exhibition first and on the artworks afterward.

**How I fixed it:** I asked for the exhibition to be a separate tab, and the agent made the change in the commit above. The page now has two tabs, **Artworks** and **Exhibition**, and only one shows at a time. The jump links are gone. The Exhibition tab label shows how many paintings are chosen (for example `2/6`), and "New Exhibition" now sits inside the Exhibition tab.
