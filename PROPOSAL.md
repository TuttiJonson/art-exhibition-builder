# Proposal MD (the project through my eyes)

## What am I building: 
Atelier is an interactive virtual gallery where users can discover real artworks, create their own six-piece exhibition, and explore paintings and their stories in a personalized 3D style museum. 

## Who is this for: 
I initially built this for my mom because, while having a conversation with her, she told me about how she wished she could be a creator herself, but couldn't figure out the visual aspect of it. Atelier is designed for art enthusiasts who want to discover art without needing the extensive knowledge of an artist or museum. Atelier makes the experience of browsing through individual artworks more interactive by allowing users to become curators themselves. 

## API:
I shall be using the Art Institute of Chicago API. , 
Fields I will use:
id — Unique identifier for each artwork.
title — Artwork title.
artist_display — Artist information.
date_start and date_display — Creation year and displayed date.
image_id — Identifier for displaying the artwork image.
short_description — Information about the artwork.
gallery_title and is_on_view — Museum display information, when available.
is_public_domain — Whether the artwork is in the public domain.

JavaScript will use fetch() and await to retrieve JSON data, then dynamically display the artworks.

## What would the user do: 
A user can search by artist or artwork, browse different feature categories, and select up to six paintings for their exhibition. 
- Choose a theme or write their own. 
- Select one of three gallery atmospheres. 
- Change the order of a selected painting. 

## What the page works out: 
the Atelier page will analyze the selected artworks and generate Curatorial Insights using data from the museum API. JavaScript will calculate the total number of paintings selected, the number of distinct artists represented, the oldest and the newest artwork in creation years, and the number of years covered by the exhibition. These calculations were updated whenever the user adds or removes an artwork. 

## Features: 
- Discover Art: Search and browse public-domain artworks through the Art Institute of Chicago API.
- Curate an Exhibition: Select, remove, and reorder up to six artworks.
- Personalize the Gallery: Name the exhibition, choose a theme, and customize the museum atmosphere.
- Explore the Exhibition: See selected paintings in an interactive gallery with different viewing angles. Clicking a painting reveals its description, artist, and museum location when available.
- Curatorial Insights: Generate statistics from the selected artworks and save the exhibition locally in the browser.



