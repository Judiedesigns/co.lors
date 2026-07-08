# Paletta Gradient Page Plan

## Goal

Create a separate gradient generator page for Paletta that lets users make practical gradient assets from two colours without making the main colour-system page longer.

## Scope

- Add a new `gradients.html` page.
- Add a simple page switcher/nav between `System` and `Gradients`.
- Let users edit two hex colours.
- Let users switch gradient orientation.
- Show a large live gradient preview.
- Generate copyable CSS for the selected gradient.
- Allow CSS download.
- Allow PNG download from the static gradient preview.
- Allow a motion preview.
- Allow WebM download from the animated preview.
- Keep the design aligned with Paletta's quiet, clean visual language.

## Not In This Pass

- Shader integration.
- MP4 export.
- Saved presets.
- Three-colour gradients.
- Cross-page shared colour state.

## Implementation Checklist

- [x] Create `gradients.html`.
- [x] Create `gradients.css`.
- [x] Create `gradients.js`.
- [x] Add `System` / `Gradients` nav to the main page.
- [x] Add `System` / `Gradients` nav to the gradient page.
- [x] Build orientation controls.
- [x] Build two colour inputs with swatches and hex fields.
- [x] Render a live gradient preview.
- [x] Generate CSS output.
- [x] Implement copy CSS.
- [x] Implement download CSS.
- [x] Implement download PNG.
- [x] Implement motion preview toggle.
- [x] Implement download WebM.
- [x] Add responsive mobile layout.
- [x] Verify generated CSS updates when orientation changes.
- [x] Verify generated CSS updates when colours change.
- [x] Verify download CSS uses the current gradient.
- [x] Verify download PNG uses the current gradient.
- [x] Verify motion preview uses the current gradient.
- [x] Verify download WebM records the animated gradient.
- [x] Run a static sanity check for broken links and obvious syntax issues.

Note: WebM export uses the browser `MediaRecorder` API, so support depends on the user's browser.
