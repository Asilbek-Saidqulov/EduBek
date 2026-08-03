# EduBek Cosmetics, Inventory, Identity & Personalization Platform

## Overview

The single source of truth for every cosmetic item, inventory asset, collectible, profile customization, and player identity across all game modes. Never affects gameplay — only manages cosmetic ownership, inventory state, and profile appearance.

## 16 Systems

1. **Inventory Platform** — 8 item statuses (owned/locked/equipped/temporary/expired/hidden/archived/gifted)
2. **Cosmetic Catalog** — 18 cosmetic types, configurable definitions
3. **Equipment System** — 15 equipment slots, multiple loadouts, conflict detection
4. **Player Identity** — Avatar, frame, banner, theme, background, title, badges, public card
5. **Collections** — 4 collection types, progress tracking, set bonuses (visual only)
6. **Rarity System** — 7 rarities (common→mythic), no gameplay bonuses
7. **Cosmetic Unlock Engine** — 9 unlock sources (references external rewards only)
8. **Inventory Transactions** — 6 transaction types, full audit trail, trade disabled by default
9. **Showcase Platform** — Featured cosmetics, collections, achievements, statistics
10. **Personalization Engine** — Themes, accessibility, animations, sound, UI scale
11. **Seasonal Cosmetics** — Season-exclusive items, retirement, legacy labels, availability windows
12. **Organization Identity** — School/university/district/enterprise branding
13. **Marketplace Integration** — References marketplace, license verification
14. **Extension Integration** — Extension-defined cosmetics, validation, namespaces
15. **Inventory Analytics** — Ownership rates, equip rates, popularity, collection completion
16. **Inventory Dashboard** — Player overview, loadouts, collections, health status

## Architecture

Passive Event Bus consumer + producer. Never directly calls Progression, Competitive, Social, or LiveOps. Everything goes through Event Bus.

## Testing

323 tests covering all 16 systems. 370 i18n keys × 3 locales. 0 TypeScript errors, 0 ESLint errors.
