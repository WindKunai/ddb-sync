import { MODULE_ID, registerSettings } from "./settings.js";
import { testConnection } from "./ddb-api.js";
import { importCharacter, syncCharacter } from "./sync.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class DDBSyncPanel extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ddb-sync-panel",
    tag: "form",
    window: { title: "D&D Beyond Sync", icon: "fa-solid fa-dice-d20" },
    position: { width: 420, height: "auto" },
    actions: {
      testConnection: DDBSyncPanel.#onTestConnection,
      import: DDBSyncPanel.#onImport,
      sync: DDBSyncPanel.#onSync
    }
  };

  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/settings.hbs` }
  };

  async _prepareContext() {
    return { characterId: this._characterId ?? "" };
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    this.element
      .querySelector('[name="characterId"]')
      ?.addEventListener("input", (ev) => {
        this._characterId = ev.currentTarget.value;
      });
  }

  static async #onTestConnection() {
    try {
      const ok = await testConnection();
      ui.notifications[ok ? "info" : "error"](
        ok ? "ddb-sync: Proxy reachable." : "ddb-sync: Proxy did not respond OK."
      );
    } catch (err) {
      ui.notifications.error(err.message);
    }
  }

  static async #onImport(event, target) {
    const id = this._characterId?.trim();
    if (!id) return ui.notifications.warn("ddb-sync: Enter a character ID first.");
    try {
      await importCharacter(id);
    } catch (err) {
      ui.notifications.error(err.message);
    }
  }

  static async #onSync(event, target) {
    const id = this._characterId?.trim();
    if (!id) return ui.notifications.warn("ddb-sync: Enter a character ID first.");
    try {
      await syncCharacter(id);
    } catch (err) {
      ui.notifications.error(err.message);
    }
  }
}

Hooks.once("init", () => {
  registerSettings();

  game.settings.registerMenu(MODULE_ID, "panel", {
    name: "Open D&D Beyond Sync Panel",
    label: "Open Panel",
    icon: "fa-solid fa-dice-d20",
    type: DDBSyncPanel,
    restricted: true
  });
});

// Adds a "Sync DDB" header button on actor sheets that are already
// linked to a DDB character, so re-syncing doesn't require opening
// the settings panel and retyping the id every time.
Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) => {
  const characterId = sheet.actor?.getFlag(MODULE_ID, "characterId");
  if (!characterId) return;
  buttons.unshift({
    label: "Sync DDB",
    class: "ddb-sync-button",
    icon: "fa-solid fa-arrows-rotate",
    onclick: () => syncCharacter(characterId).catch((err) => ui.notifications.error(err.message))
  });
});

Hooks.once("ready", () => {
  console.log("ddb-sync | loaded");
});
