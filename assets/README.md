# Visual Asset Pipeline

Phase 1 establishes the visual asset structure for the pixel-art upgrade.

## Planned folders

- tiles/ — terrain and map tiles
- objects/ — trees, buildings, props, quest objects
- characters/ — playable characters and NPCs
- animals/ — animal sprites and animations
- effects/ — weather, particles, lighting and story effects

## Pixel-art rules

- PNG preferred for sprite sheets and transparent art.
- Work on a fixed pixel grid.
- Use nearest-neighbour scaling.
- Keep sprite frames aligned to consistent pivots.
- Avoid anti-aliased source artwork.
- Do not mix arbitrary sprite sizes without documenting their world-space size.

The current game still uses procedural Canvas artwork for most objects. Later phases will replace those renderers progressively without rewriting the quest/story systems.
