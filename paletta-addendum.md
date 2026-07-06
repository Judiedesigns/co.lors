**PALETTA**

Addendum: Colour Role Cards & System Rules

*Appended to PRD v3.0  —  March 2026*

# **13\. The Role Card — Core Output Format**

The most important thing Paletta outputs is not a palette. It is a system with rules. Every colour has a job, a constraint, and a context. This is what separates Paletta from every other colour tool on the market — and it is the direct result of how the Mapinduzi website was built.

*When the Mapinduzi terracotta colour system was built, the process was not “pick six colours.” It was: derive six colours, assign each one a specific role, then apply rules about where each can and cannot appear. The result was a page that felt coherent without the designer having to make colour decisions on every section.*

Paletta must replicate that process automatically. The output is not swatches. The output is Role Cards.

## **13.1 What a Role Card contains**

Each of the six generated colours is presented as a Role Card. Every card has six fields:

* Colour swatch — a filled square showing the colour

* Hex code — in monospace, copyable on click

* Role name — the assigned job (Background Dark, Primary Accent, etc.)

* Used for — a specific list of exactly where this colour appears on a page

* Never use for — explicit constraints. This is the field that makes it a system, not a palette.

* On dark bg / On light bg — shows how this colour behaves in both contexts

## **13.2 The Role Card table — terracotta example**

This is the exact system generated for the Mapinduzi website. It shows how the six fields work in practice:

| Colour | Hex & Role | Used for | Never use for | On dark bg | On light bg |
| :---- | :---- | :---- | :---- | :---- | :---- |

|   | \#2E1A0E Background Dark | Hero, footer, nav, mission, dark statement sections | Body text on its own. Never as a card background. | Not applicable — this IS the dark bg | Text and icon colour on this bg: \#FEF5E7 |
| :---- | :---- | :---- | :---- | :---- | :---- |

|   | \#FEF5E7 Background Light | Content sections, card surfaces, data sections, page bg | Dark sections. Never pair with \#FAE8C8 (too similar). | Not applicable — use as surface colour | Paragraph text: \#7A4830. Headings: \#2E1A0E |
| :---- | :---- | :---- | :---- | :---- | :---- |

|   | \#C4522A Primary Accent | CTA buttons, eyebrow labels, accent strips, active borders | Large section backgrounds (over 200px tall). Body text. | Button fill. Arrow icons. Active states. | Eyebrow labels. Link text. Tag backgrounds. |
| :---- | :---- | :---- | :---- | :---- | :---- |

|   | \#E8946A Light Accent | Italic headline words. Hover text highlights. | Buttons. Backgrounds. Body text. Anything functional. | Italic em text only — never body copy. | Decorative italic text only on light surfaces. |
| :---- | :---- | :---- | :---- | :---- | :---- |

|   | \#8B3518 Deep Accent | Pressed button states. Image overlay warm gradient. | Main CTA colour. Use only as depth/shadow of Primary Accent. | Hover/pressed state on buttons. | Warm tone for dark image overlays. |
| :---- | :---- | :---- | :---- | :---- | :---- |

|   | \#7A4830 Muted Text | Body copy on light backgrounds. Captions. Secondary labels. | Text on dark backgrounds (disappears). Buttons. | Use rgba(255,255,255,0.5) on dark bg instead. | All paragraph text. Sub-labels. Metadata. |
| :---- | :---- | :---- | :---- | :---- | :---- |

## **13.3 The seven colour rules**

These are the rules that made the Mapinduzi colour system work. They are the intelligence behind the Role Cards. Paletta should communicate all seven to the user alongside the generated system.

**Rule 1 — Never use pure black or pure white**

When the anchor colour is warm, pure black (\#000000) clashes because the temperatures don’t match. The dark background must be derived from the same hue family as the anchor, pushed to near-black. The light background must be the anchor hue at near-maximum lightness. This is what makes dark sections feel rich rather than cold, and light sections feel warm rather than clinical.

How Paletta implements it: The engine always generates dark and light backgrounds by adjusting the anchor colour’s HSL values, never by substituting black or white.

**Rule 2 — Sections alternate dark → light → dark → light**

This rhythm is not decorative. Dark sections carry weight and authority. Light sections carry warmth and approachability. The alternation stops any single feeling from becoming monotonous and gives the reader’s eye clear signals about where one section ends and another begins.

How Paletta implements it: The page preview enforces this alternation. The section sequence is fixed: dark hero → accent strip → light → dark → dark → accent strip → light → light → dark CTA → darkest footer.

**Rule 3 — The Primary Accent is never a large section background**

When the accent colour is used as a full-page-width section background, it must be thin — a strip of 60–80px maximum. If a full section used the accent as background, it would tire the eye and drain the colour of its punch. The accent stays powerful precisely because it appears sparingly.

How Paletta implements it: In the page preview, accent-coloured sections are always rendered as strips (manifesto strip, impact numbers strip). The Role Card’s “Never use for” field explicitly states: “Large section backgrounds over 200px tall.”

**Rule 4 — Light Accent is for italic headline moments only**

The light accent (\#E8946A in the terracotta system) appears exactly once per headline: on the most emotionally important italic word. It is never used for body text, buttons, or backgrounds. Its rarity is its power. When a user sees that warm highlighted word, they know something important is being said.

How Paletta implements it: The Role Card constraint field reads: “Italic em text inside headlines only. Never body copy, never buttons, never backgrounds.”

**Rule 5 — Muted text switches colour between dark and light backgrounds**

On light backgrounds, body text uses the muted brown (\#7A4830). On dark backgrounds, body text uses rgba(255,255,255,0.5). The muted brown disappears against dark backgrounds entirely. This is the most commonly missed rule when designers apply a colour system manually, and the most important one for legibility.

How Paletta implements it: The Role Card “On dark bg” field for Muted Text explicitly reads: “Do NOT use on dark backgrounds. Use rgba(255,255,255,0.5) instead.”

**Rule 6 — Temperature must be consistent across all six colours**

A warm anchor colour must produce a warm system. Every derived colour must sit in the same temperature family. Mixing a warm accent with a cool background creates a palette that feels unresolved — as if the colours were chosen separately rather than as a system.

How Paletta implements it: The engine detects the anchor’s temperature from its hue angle and applies temperature-preserving adjustments when deriving all six colours. The mode selector allows the user to intentionally shift temperature, but the default always preserves it.

**Rule 7 — Deep Accent is the bridge, not an alternative Primary**

The deep accent (\#8B3518) is darker than the primary accent and sits between it and the dark background. It appears on hover states, pressed buttons, and as the warm tone in image overlay gradients. It should never be used where the primary accent belongs. Its job is to add depth to interactions, not to be a second main colour.

How Paletta implements it: The Role Card’s “Used for” field reads: “Pressed/hover states on buttons. Image overlay warm gradient.” The “Never use for” field reads: “Main CTA colour. Eyebrow labels. Anything the Primary Accent does.”

## **13.4 How the Role Cards appear in the UI**

Role Cards are shown in the Swatch System mode of the centre canvas. The six cards are arranged in a 2×3 grid. Each card is tall enough to show all six fields comfortably. The “Never use for” field is displayed with a subtle red/warning background to make it visually distinct from the positive “Used for” field.

* Swatch block — takes up the top third of the card, full width

* Hex code — monospace, large, copy on click with tick confirmation

* Role name — bold, below the hex

* Used for — bullet list, green-tinted background

* Never use for — bullet list, red/warning-tinted background

* On dark bg / On light bg — two small preview swatches side by side showing the colour in both contexts

## **13.5 Why this matters for non-designers**

A founder or developer reading a Role Card doesn’t need design intuition to use the colour system correctly. The card tells them: “this colour goes on buttons and eyebrow labels, never on large backgrounds or body text.” They can build an entire website from that instruction without ever making a wrong colour decision.

*This is the product’s core value proposition stated plainly: Paletta turns a colour into a set of instructions that anyone can follow.*

*PALETTA PRD — Addendum v1.0 — Colour Role Cards & System Rules — March 2026*