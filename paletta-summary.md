# Paletta Summary

## What We Are Doing

Paletta is becoming a practical colour system tool for web and brand design. The goal is not just to generate swatches, but to help users understand how colours behave in a real interface:

- Generate a full UI colour system from one primary anchor colour
- Suggest companion colours that work with the primary
- Let users add or replace one active secondary colour
- Show colour hierarchy in realistic page previews
- Test text/background contrast before using a pair
- Export usable CSS, JSON, and PNG assets

## What We Have Done

- Removed the redundant visible `Generate System` button because the system updates live.
- Added `Random primary` for generating a new primary anchor colour.
- Added inline hex validation for incomplete values.
- Fixed pasted hex values with `#`, so `#005F7C` pastes correctly as `005F7C`.
- Added a hidden legacy generate button to avoid cached-script breakage.
- Kept Companion Palette visible after adding a secondary colour.
- Made Companion Palette stay based on the primary colour.
- Let companion tiles set or replace the active secondary colour.
- Added a separate copy icon for companion hex values.
- Made the companion copy icon visible on mobile.
- Added `Primary-led` and `Secondary-led` preview hierarchy modes.
- Made secondary colours more visible in page previews.
- Added Contrast Lab with reversible/random text-background pairs.
- Added visible tooltip hints for contrast labels like `Large`.
- Removed Brand Mockups because Contrast Lab and Page Preview now carry that job better.
- Improved light mode contrast and surface styling.
- Added `Made by Mars` linking to `https://mars-portfolio.figma.site/`.

## Mobile Behaviour

- The header stacks into a single-column layout.
- The primary colour card expands to full width.
- Primary and secondary inputs wrap instead of overflowing.
- Companion Palette becomes a two-column grid on most mobile widths.
- Companion Palette becomes one column on very narrow screens.
- Companion copy icons stay visible on mobile because hover is not available.
- Tapping a companion tile sets or replaces the secondary colour.
- Tapping the copy icon copies that tile's hex value.
- Contrast Lab stacks into one column so controls sit below the preview.
- Page Preview cards reduce columns for smaller screens.
- Export controls stack when space is tight.

## What Still Needs Polishing

- Run visual QA on real mobile widths, especially 360px, 390px, and 430px.
- Confirm Companion Palette tap targets feel comfortable on touch devices.
- Check whether the mobile copy icon feels too visible or just right.
- Review `Primary-led` and `Secondary-led` naming after using it a few times.
- Check whether Contrast Lab controls still feel too dense on mobile.
- Review light mode after more real use; dark mode still feels slightly more native to the product.
- Consider adding a subtle invalid-state example for secondary input if users paste partial values often.
- Decide later whether Paletta should support multiple saved support colours beyond one active secondary.
