import { getProxyUrl, getCobaltToken } from "./settings.js";

/**
 * Thin wrapper around a self-hosted ddb-proxy instance.
 *
 * Route and payload shape confirmed against ddb-importer's own
 * DDBCharacter.getCharacterData() (MIT licensed): it POSTs to
 * `${proxyUrl}/proxy/v5/character` and gets back
 * `{ success, ddb: { character: {...} } }`, not a bare character object.
 * If your self-hosted ddb-proxy version predates the v5 endpoint this
 * will 404 - check its README/CHANGELOG for the route it actually
 * exposes and adjust ROUTES.character below.
 */
const ROUTES = {
  ping: "/ping",
  character: "/proxy/v5/character"
};

async function proxyPost(path, body) {
  const url = `${getProxyUrl()}${path}`;
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (err) {
    throw new Error(`ddb-sync: could not reach proxy at ${url} (${err.message})`);
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`ddb-sync: proxy returned ${response.status} ${response.statusText} ${text}`);
  }
  return response.json();
}

export async function testConnection() {
  const url = `${getProxyUrl()}${ROUTES.ping}`;
  const response = await fetch(url, { method: "GET" });
  return response.ok;
}

/**
 * Fetch a raw D&D Beyond character JSON blob for the given character id.
 * @param {string|number} characterId
 * @returns {Promise<object>} raw DDB character data (the `ddb.character`
 *   object - already unwrapped, so callers get name/stats/etc at top level)
 */
export async function fetchCharacter(characterId) {
  const cobalt = getCobaltToken();
  const response = await proxyPost(ROUTES.character, {
    cobalt,
    characterId: String(characterId),
    // Fields ddb-importer sends alongside cobalt/characterId. Most are
    // optional/no-ops for a self-hosted proxy without those features, but
    // included so the request shape matches what the proxy expects.
    campaignId: null,
    filterModifiers: false,
    splitSpells: true,
    devMode: false,
    updateId: null
  });

  if (!response || typeof response !== "object") {
    throw new Error("ddb-sync: proxy returned an unexpected (non-JSON-object) response.");
  }
  if (response.success === false) {
    throw new Error(`ddb-sync: proxy reported failure${response.message ? `: ${response.message}` : "."}`);
  }
  const character = response.ddb?.character;
  if (!character) {
    throw new Error(
      "ddb-sync: response did not contain ddb.character - check your ddb-proxy version's actual response shape."
    );
  }
  return character;
}