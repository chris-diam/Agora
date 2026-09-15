# Agora Brand Assets

## Brand
Name: Agora
Tagline: PEOPLE PLACES PASSIONS

## Visual language
Clean, modern, social/city-culture platform identity. Rounded geometry, generous whitespace,
mint/teal accent, deep teal/navy text, soft pale backgrounds.

## Colors
- Primary Green: #10B891
- Dark Teal: #0B2E2B
- Text Dark: #0B1F1E
- Muted Text: #6B7C7A
- Light Background: #F8FAFC

## Logo usage
- Use `svg/logo.svg` on light backgrounds.
- Use `svg/logo-dark.svg` on dark backgrounds.
- Use `svg/logo-mark.svg` when space is limited.
- Use `svg/logo-mark-dark.svg` for a dark app/icon treatment.
- Never stretch, skew, rotate, or recolor the logo arbitrarily.
- Keep clear space around the logo equal to at least the height of the central dot.
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

## CSS tokens
--agora-green: #10B891;
--agora-dark: #0B2E2B;
--agora-text: #0B1F1E;
--agora-muted: #6B7C7A;
--agora-bg: #F8FAFC;
