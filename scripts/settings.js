export const MODULE_ID = "ddb-sync";

export function registerSettings() {
  game.settings.register(MODULE_ID, "proxyUrl", {
    name: "Proxy URL",
    hint: "Base URL of your self-hosted ddb-proxy instance, e.g. https://ddb.mathiels.uk",
    scope: "world",
    config: true,
    type: String,
    default: "https://ddb.mathiels.uk"
  });

  game.settings.register(MODULE_ID, "cobaltToken", {
    name: "D&D Beyond Session Cookie (cobalt)",
    hint: "Your dndbeyond.com 'CobaltSession' cookie value. Stored locally in this world only, sent only to your own proxy.",
    scope: "world",
    config: true,
    type: String,
    default: ""
  });

  // Per-actor character-id / last-sync bookkeeping lives on the Actor's
  // flags (see sync.js), not in world settings, so multiple actors can
  // each track their own DDB character independently.
}

export function getProxyUrl() {
  const url = game.settings.get(MODULE_ID, "proxyUrl")?.trim();
  if (!url) throw new Error("ddb-sync: Proxy URL is not configured in module settings.");
  return url.replace(/\/+$/, "");
}

export function getCobaltToken() {
  const token = game.settings.get(MODULE_ID, "cobaltToken")?.trim();
  if (!token) throw new Error("ddb-sync: D&D Beyond session cookie is not configured in module settings.");
  return token;
}
