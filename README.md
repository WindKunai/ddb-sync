# ddb-sync (MVP)

A small, self-hosted Foundry VTT module for pulling a D&D Beyond character
into a `dnd5e` Actor and re-syncing it later, using your own instance of
[MrPrimate's `ddb-proxy`](https://github.com/MrPrimate/ddb-proxy) (MIT
licensed) as the backend. This is a from-scratch, narrower module — it does
not use or modify `ddb-importer` itself.

## Architecture

```
D&D Beyond  <-->  your ddb-proxy  <-->  this Foundry module  <-->  Actor
```

Your Foundry client never talks to dndbeyond.com directly (auth/CORS make
that impractical). Instead it POSTs to your own proxy, which handles the
D&D Beyond request and hands back JSON.

## Setup

1. **Run `ddb-proxy` yourself** on infrastructure you control (e.g. behind
   your existing Caddy setup on `ddb.yourdomain.tld`). Follow that project's
   own README for install/run instructions and confirm its current route
   names — they can change between versions, and `scripts/ddb-api.js` in
   this module has a single `ROUTES` object you may need to adjust to match.
2. Install this module into `Data/modules/ddb-sync/` in your Foundry install.
3. Enable it in your world, then set, in module settings:
   - **Proxy URL** — e.g. `https://ddb.yourdomain.tld`
   - **D&D Beyond session cookie (`cobalt`)** — your own `CobaltSession`
     cookie value from a logged-in dndbeyond.com session in your browser.
     This is stored in world settings and sent only to your own proxy.
4. Open the panel via *Settings → Configure Settings → Open Panel*, or the
   module settings menu entry. Enter a character ID (the number in
   `dndbeyond.com/characters/12345678`) and hit **Test Connection**, then
   **Import Character**.
5. Later, hit **Sync Character** (same ID), or use the "Sync DDB" button
   that appears in the header of any actor sheet already linked to a DDB
   character, to pull fresh data into the existing Actor instead of
   creating a duplicate.

## What's implemented (MVP)

- Module skeleton, settings, panel UI
- `GET /ping` connectivity check
- Character fetch via proxy
- Actor create with: name, ability scores, HP, currency, level/race/background
- Basic inventory import (as loose `loot`-type items)
- Actor-vs-character linking via `flags.ddb-sync.characterId`, so Sync
  updates in place rather than deleting/recreating

## Roadmap / not yet implemented

- Spells, feats, class features, proficiencies, saving throws, skills
- AC calculation (currently just passes through an override if present)
- Equipped-item -> proper `dnd5e` item types (weapon/armor/equipment) with
  correct `system` data, instead of generic loot items
- Diffing on Sync (currently a full field overwrite of the fields we manage)
- Token/portrait art handling
- Multi-actor / player-facing (currently GM-only via `restricted: true`)

## A note on scope

`ddb-importer`'s live-sync feature is a paid feature of that project, tied
to a MrPrimate Patreon subscription. This module is a separate,
independent implementation built against the public `dnd5e` system API and
the MIT-licensed `ddb-proxy`, not a patched copy of `ddb-importer`. If you
want the full feature set (monsters, adventures, compendium content,
maps, etc.), consider supporting that project directly — this MVP only
covers basic character sync.
