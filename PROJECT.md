# CfC Interactive Project Map

## Background

Joey met with **Mike McEvoy** (co-founder, Construction for Change) about joining the CfC board. Within an hour of the meeting, Mike shared a Google Sheet with all CfC project data and asked for an interactive map to replace the lower section of their [projects page](https://www.constructionforchange.org/).

Instead of asking clarifying questions, Joey is replying with a **deployed interactive map** — a gift that demonstrates value before any formal role.

## What Mike Asked For

From the text thread:
> "On our project page I want to keep 12 feature projects at the top like what we currently have and then replace everything below it with a map of the world with little pins in locations or something. Then when you hover on that pin a project page expands to show a few details. Our team can help build those project pages but we need the map built out to start."

## Data Source

**File:** `~/Downloads/CfC All Client Projects March 19 2024.xlsx`
**Best sheet:** "summary for Koenig" — clean, structured data

### Data Summary
- **133 total projects** (2008–2024)
- **88 projects with lat/lng coordinates** (45 need geocoding)
- **23 countries** across Africa, Americas, Caribbean, Asia-Pacific
- **9 project types:** Healthcare (49), Education (30), Housing (17), Solar (16), Economic (13), Food Security (4), WASH (1), Health Clinic (1)

### Top Countries
Kenya (30), USA (28), Togo (27), Puerto Rico (7), Uganda (7), Dominica (6), Bolivia (3), India (3), Malawi (3), USVI (3)

### Key Partners
- **Integrate Health** — Togo (Phases 1–5, ~25 projects)
- **Flying Kites** — Kenya (schools, dorms, kitchens, ~10 projects)
- **Pallet** — USA (temporary homeless shelters, ~12 projects)
- **Expedia/Clinton Foundation** — Solar in Puerto Rico, USVI, Dominica
- **Matibabu & Tiba Foundation** — Kenya (healthcare)

## Tech Stack

- **Framework:** Next.js (App Router)
- **Map:** Mapbox GL JS (Joey's API key for now, CfC gets their own later)
- **UI:** shadcn/ui + Tailwind CSS (future-proofed if Joey builds them a full site)
- **Fonts:** Lato (primary) + Oswald (secondary) — matching CfC's existing site
- **Deploy:** Vercel
- **Embed strategy:** Standalone app → CfC drops an iframe into their WordPress/Divi site

## CfC Brand Style Reference

### Fonts
| Role | Font | Weights | Fallback |
|------|------|---------|----------|
| Primary (headings + body) | Lato | 100, 300, 400, 700, 900 | Helvetica, Arial, Lucida, sans-serif |
| Secondary (buttons, small headings) | Oswald | 200, 300, 400, 500, 600, 700 | Helvetica, Arial, Lucida, sans-serif |

### Typography Scale
| Element | Font | Size | Weight | Extra |
|---------|------|------|--------|-------|
| H1 | Lato | 28px | 800 | letter-spacing: 1px |
| H2 | Lato | 32px | 900 | letter-spacing: 0.64px |
| H3 | Lato | 20px | 700 | color: #364959 |
| H4 | Lato | 16px | 400 | UPPERCASE, letter-spacing: 2px, color: #901a1d |
| H5 | Oswald | 13px | 400 | letter-spacing: 0.78px |
| Body | Lato | ~16px | 400 | line-height ~1.5 |

### Brand Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary Red | `#cb463a` | CTA buttons, links, logo accent |
| Dark Red / Maroon | `#901a1d` | Subheadings (H4), secondary accent, logo building icon |
| Bright Red | `#e02b20` | Hover/alert emphasis |
| Dark Slate Blue | `#374859` / `#364959` | Primary dark text, dark section backgrounds |
| Darker Slate | `#2d3940` | Deepest dark tone |
| Logo Navy | `#174258` | Wordmark text in logo |
| White | `#ffffff` | Primary background, text on dark |
| Off-White / Cream | `#faf9f5` | Warm background sections |
| Light Gray | `#d6d6d6` / `#dddddd` | Borders, dividers |
| Mid Gray | `#999999` | Muted/secondary text |
| Dark Gray | `#333333` / `#666666` | Body text alternatives |
| Muted Gold | `#a39965` | Subtle accent |

### Buttons
- **Primary CTA:** bg `#cb463a`, text white, Lato 900, uppercase, border-radius 6px
- **Ghost/Secondary:** transparent bg, `#cb463a` text/border, Oswald 400, uppercase, sharp corners

### Backgrounds
- White sections: `#ffffff`
- Dark sections: `#374859` / `#364959`
- Warm sections: `#faf9f5`
- Hero overlays: black

## Map Feature Spec

### Core
- World map with project pins, color-coded by project type
- Click/hover on pin → card/panel with project details
- Filter by project type (Healthcare, Education, Solar, Housing, Economic, Food Security)
- Responsive (desktop + mobile)
- Clean, nonprofit-appropriate design using CfC brand

### Pin Card Content
- Project partner name
- Project type + icon
- Location (city, country)
- Year range
- Details/description
- (Future: photos, impact metrics — CfC team builds these out)

### Project Type Colors (proposed, within CfC brand)
| Type | Color | Rationale |
|------|-------|-----------|
| Healthcare | `#cb463a` (primary red) | Most projects, most impact — brand color |
| Education | `#374859` (dark slate) | Serious, foundational |
| Housing | `#901a1d` (maroon) | Shelter/safety feel |
| Solar | `#a39965` (muted gold) | Energy/sun association |
| Economic | `#364959` (slate blue) | Growth/stability |
| Food Security | `#2d3940` (darker slate) | Earth/ground |

### Nice-to-Haves
- Animated fly-to on pin click
- Cluster markers when zoomed out
- Stats bar (total projects, countries, years active)
- Timeline slider to filter by year

## CfC Existing Site

- **Stack:** WordPress + Divi theme (v4.27.0) + PHP + jQuery 3.7.1
- **No modern JS frameworks** — standard Divi drag-and-drop build
- **Embed plan:** CfC team drops iframe code into a Divi Code Module
- **API key handoff:** Joey's Mapbox key for now → walk CfC through getting their own later

## Strategic Context

This is a gift / proof of value. Joey is positioning for a CfC board seat. By delivering a deployed interactive map before Mike even expects a response, Joey demonstrates:
1. Speed of execution
2. Technical capability
3. Understanding of CfC's mission and data
4. The kind of value he'd bring to the board

The map also opens the door to building CfC a full modern website (replacing WordPress/Divi), which is why we're using Next.js + shadcn as the foundation.
