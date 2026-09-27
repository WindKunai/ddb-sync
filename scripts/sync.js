import { MODULE_ID } from "./settings.js";
import { fetchCharacter } from "./ddb-api.js";
import { buildActorData, buildInventoryItems } from "./importer.js";

/**
 * Find an existing actor previously imported from this DDB character id.
 */
function findExistingActor(characterId) {
  return game.actors.find(
    (a) => a.getFlag(MODULE_ID, "characterId") === String(characterId)
  );
}

/**
 * Import a DDB character as a brand-new Foundry actor.
 */
export async function importCharacter(characterId) {
  const existing = findExistingActor(characterId);
  if (existing) {
    ui.notifications.warn(
      `ddb-sync: Character ${characterId} is already linked to actor "${existing.name}". Use Sync instead.`
    );
    return existing;
  }

  const ddb = await fetchCharacter(characterId);
  const actorData = buildActorData(ddb);
  const actor = await Actor.create(actorData);

  const items = buildInventoryItems(ddb);
  if (items.length) await actor.createEmbeddedDocuments("Item", items);

  ui.notifications.info(`ddb-sync: Imported "${actor.name}".`);
  return actor;
}

/**
 * Re-fetch a DDB character and update its already-linked Foundry actor
 * in place, rather than deleting/recreating it.
 */
export async function syncCharacter(characterId) {
  const actor = findExistingActor(characterId);
  if (!actor) {
    ui.notifications.warn(
      `ddb-sync: No actor linked to character ${characterId} yet. Use Import first.`
    );
    return null;
  }

  const ddb = await fetchCharacter(characterId);
  const actorData = buildActorData(ddb);

  // Update only the fields we manage; leave anything the user has
  // manually customised on the actor (custom items, HP overrides that
  // aren't from DDB, etc.) untouched where reasonably possible.
  await actor.update({
    name: actorData.name,
    img: actorData.img,
    system: actorData.system,
    flags: actorData.flags
  });

  ui.notifications.info(`ddb-sync: Synced "${actor.name}" with D&D Beyond.`);
  return actor;
}
