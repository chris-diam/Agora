# KYMA Brand Assets

## Brand
Name: KYMA (Greek for "wave")
Tagline: PEOPLE PLACES PASSIONS

## Mark
The mark is a "K" formed from two strokes — a straight vertical bar and a
continuous flowing wave-curve crossing through it — reading as both a letter
and a wave at once. The same single closed path is reused (recolored/repositioned)
across every file in `svg/`.

## Visual language
Clean, modern, social/city-culture platform identity. Rounded geometry, generous whitespace,
mint/teal accent, deep teal/navy text, soft pale backgrounds.

## Colors
- Primary Teal: #10B891
- Dark Teal: #0B2E2B
- Text Dark: #0B1F1E
- Muted Text: #6B7C7A
- Light Background: #F8FAFC

The app itself ships 6 selectable themes (see `frontend/src/context/ThemeContext.tsx`);
the palette above is the "Classic" theme and the canonical color for static assets
(favicon, OG image, app icon) that can't respond to the in-app theme switcher.

## Logo usage
- Use `svg/logo.svg` on light backgrounds.
- Use `svg/logo-dark.svg` on dark backgrounds.
- Use `svg/logo-mark.svg` when space is limited.
- Use `svg/logo-mark-dark.svg` for a dark app/icon treatment.
- Never stretch, skew, rotate, or recolor the logo arbitrarily.
- For very small UI sizes, use the mark only rather than the full wordmark.

## Web
- Favicon: `png/favicon.ico` or `svg/favicon.svg`
- Modern browsers can use `svg/favicon.svg`.
- Header/brand: `svg/logo.svg`
- Dark header: `svg/logo-dark.svg`
- Small avatar/button: `svg/logo-mark.svg`

## App / PWA
- 512x512: `png/icon-512.png`
- 192x192: `png/icon-192.png`
- Apple touch icon: `png/apple-touch-icon.png`
- 1024x1024 source: `png/icon-1024.png`

## Social / sharing
- Open Graph / link preview: `social/og-image.png` (1200x630)
- Square thumbnail: `social/square-thumbnail.png` (1024x1024)

## Monochrome
- `svg/monochrome-light.svg` = dark mark/wordmark for light backgrounds
- `svg/monochrome-dark.svg` = white mark/wordmark for dark backgrounds

## Suggested implementation
Use SVG wherever possible for UI because it stays sharp at every resolution.
Use PNG/ICO only where a platform explicitly requires raster assets.

Note: `<img src="...">` does not resolve `currentColor`, so the shipped
logo files bake in a fixed brand color rather than adapting to the active
in-app theme — same approach the original kit used.

## CSS tokens
--kyma-teal: #10B891;
--kyma-dark: #0B2E2B;
--kyma-text: #0B1F1E;
--kyma-muted: #6B7C7A;
--kyma-bg: #F8FAFC;
