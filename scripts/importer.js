// Maps a raw D&D Beyond character JSON blob onto the fields the dnd5e
// system expects on an Actor. This is intentionally narrow (see README) -
// it covers the core sheet, not every DDB feature.
//
// DDB's raw JSON layout for `stats` is a fixed-order array:
//   0 STR, 1 DEX, 2 CON, 3 INT, 4 WIS, 5 CHA
// `modifiers` contains bonuses from race/class/items/feats etc. Full
// modifier resolution is out of scope for the MVP - we start from the
// base stats plus DDB's own computed `stats` array, and let the user
// verify/adjust in Foundry, rather than re-implementing DDB's entire
// bonus-stacking engine.

const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"];

function abilityScores(ddb) {
  const out = {};
  (ddb.stats ?? []).forEach((stat, i) => {
    const key = ABILITY_KEYS[i];
    if (!key) return;
    out[key] = { value: stat.value ?? 10 };
  });
  return out;
}

function hitPoints(ddb) {
  const base = ddb.baseHitPoints ?? 0;
  const bonus = ddb.bonusHitPoints ?? 0;
  const removed = ddb.removedHitPoints ?? 0;
  const temp = ddb.temporaryHitPoints ?? 0;
  const max = base + bonus;
  return {
    value: Math.max(0, max - removed),
    max,
    temp
  };
}

function currency(ddb) {
  const c = ddb.currencies ?? {};
  return {
    pp: c.pp ?? 0,
    gp: c.gp ?? 0,
    ep: c.ep ?? 0,
    sp: c.sp ?? 0,
    cp: c.cp ?? 0
  };
}

function details(ddb) {
  return {
    level: ddb.classes?.reduce((sum, c) => sum + (c.level ?? 0), 0) ?? 1,
    race: ddb.race?.fullName ?? ddb.race?.baseName ?? "",
    background: ddb.background?.definition?.name ?? "",
    alignment: ddb.alignmentId ? String(ddb.alignmentId) : ""
  };
}

/**
 * Build a Foundry actor data object from a raw DDB character blob.
 * @param {object} ddb - result of ddb-api.fetchCharacter()
 * @returns {object} data suitable for Actor.create() / Actor#update()
 */
export function buildActorData(ddb) {
  return {
    name: ddb.name ?? "Unnamed DDB Character",
    type: "character",
    img: ddb.decorations?.avatarUrl || ddb.avatarUrl || undefined,
    system: {
      abilities: abilityScores(ddb),
      attributes: {
        hp: hitPoints(ddb),
        ac: { flat: ddb.overrideAc ?? undefined }
      },
      details: details(ddb),
      currency: currency(ddb)
    },
    flags: {
      "ddb-sync": {
        characterId: String(ddb.id ?? ddb.characterId ?? ""),
        lastSync: Date.now()
      }
    }
  };
}

/**
 * Very small item list mapper for the MVP: inventory items only,
 * as loose (non-embedded) item data. Spells/feats/class-features
 * are deliberately deferred to a later pass - see README "Roadmap".
 */
export function buildInventoryItems(ddb) {
  return (ddb.inventory ?? []).map((invItem) => {
    const def = invItem.definition ?? {};
    return {
      name: def.name ?? "Unknown Item",
      type: "loot",
      system: {
        quantity: invItem.quantity ?? 1,
        weight: def.weight ?? 0,
        equipped: !!invItem.equipped
      },
      flags: {
        "ddb-sync": { ddbItemId: invItem.id }
      }
    };
  });
}
