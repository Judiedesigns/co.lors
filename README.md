# Paletta

Paletta is a colour system generator for designing websites. It turns one anchor colour into a usable UI palette with companion colours, page previews, role rules, brand mockups, and export-ready tokens.

Live link: https://co-lors.vercel.app

## What It Does

- Generates a six-role UI colour system from one anchor colour
- Suggests a compact companion palette for secondary colour direction
- Shows the palette in dark and light page previews
- Defines how each colour should be used through role rules and constraints
- Provides brand mockups to see the system in a visual context
- Exports the system as CSS variables, JSON, or PNG

## Why It Exists

Paletta is built for making colour decisions easier when designing websites. Instead of only producing swatches, it explains what each colour is for, where it belongs, and where it should not be used.

## Tech

This is a static HTML, CSS, and JavaScript project. It uses Culori for colour conversion and OKLCH-based palette generation.
