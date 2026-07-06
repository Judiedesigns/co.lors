# Color Palette Generator Plan (Codex)

## MVP
- Build a single web page with a color picker input.
- When a primary color is selected, generate related colors using HSL.

## Color relationships (HSL)
- Complementary: hue + 180 degrees.
- Analogous: hue plus or minus 30 degrees.
- Triadic: hue + 120 degrees and hue - 120 degrees.
- Tints and shades: keep hue, adjust lightness up or down.

## First Codex prompt
Build an HTML page with:
- A color picker input.
- JavaScript that converts hex to HSL.
- Functions to compute complementary, analogous, and triadic colors.
- Swatches displayed on the page with their hex values.

## Libraries (optional, later)
- Start with plain JavaScript.
- Add Chroma.js or Color.js later for more advanced color handling.

## Iteration ideas
- Copy-to-clipboard for each swatch.
- Lock a swatch so it stays fixed while regenerating others.
- Contrast checking for accessibility.
