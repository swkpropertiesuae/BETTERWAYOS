# Betterway Mortgages LLC — Unified Design System (`BetterwayMortgages` ↔ `Betterwayos`)

## 1. Visual Language: Institutional Private Banking + Calm Operating Wallet
Both the public advisory platform (`BetterwayMortgages`) and the internal Corporate Operating System (`Betterwayos`) share a single, disciplined token contract built on Impeccable and TasteSkill craft principles:

| Role | Token | Hex | Usage |
| :--- | :--- | :--- | :--- |
| Canvas | `--bg` | `#F8F9FA` | Institutional Alabaster primary page background |
| Surface | `--surface` / `--card` | `#FFFFFF` | Floating data surfaces, tables, and drawers |
| Primary Ink & Chrome | `--navy` / `--ink` | `#021125` | Midnight Banking Navy sidebars, hero wallet, headers, buttons |
| Hover & Elevated Dark | `--fold` | `#072244` | Royal Navy hover states and gradients |
| Luxury Accent | `--champ` | `#D7B04E` | Sovereign Gold emblems, borders, dark-surface callouts |
| Accessible Gold Text | `--champ-deep` | `#8A6518` | WCAG AA (`>= 4.5:1`) gold labels on light surfaces |
| Positive / Verified | `--success` | `#0D8A52` | On-time attendance, eligible bank offers, cleared CDD |
| Warning / Attention | `--warning` | `#B45309` | SLA timers, pending owner approvals |
| Blocked / Critical | `--danger` | `#BC3A26` | CBUAE knockouts, cellular check-in block, contemptor alerts |

## 2. Typography
- **Display:** `Plus Jakarta Sans Variable` (`-0.025em` tight tracking)
- **Editorial Serif Accent:** `Instrument Serif` (italic emphasis words in headings, quotes, and greetings)
- **Body:** `Inter Variable` (`14px`, `1.45` leading)
- **Financial Numerals:** `JetBrains Mono Variable` with `font-variant-numeric: tabular-nums`
- **Arabic / RTL:** `IBM Plex Sans Arabic` (`dir="rtl"` full parity)

## 3. Motion Choreography
- Powered by `motion/react` with exponential deceleration `[0.22, 1, 0.36, 1]` and spring pill morphing (`layoutId`) on portal tabs and department filters.
- Full `@media (prefers-reduced-motion: reduce)` fallbacks across all stylesheets.

## 4. Photography & Staff Identity Standard
- All 6 photographed Betterway staff portraits are remastered to true **8K UHD vertical masters** (`4282×7680` / `5730×7680` WebP) plus Retina `2400px` editorial portraits and `1200×1200` face-centered avatars in `public/staff/` across both repositories, preserving 100% authentic likeness.
