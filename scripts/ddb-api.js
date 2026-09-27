import { getProxyUrl, getCobaltToken } from "./settings.js";

/**
 * Thin wrapper around a self-hosted ddb-proxy instance.
 *
 * NOTE: ddb-proxy's exact route names/payload shape can change between
 * versions of that project. Check the README / source of whatever
 * ddb-proxy version you deploy and adjust ROUTES / the request body
 * below to match. This file intentionally isolates all of that so the
 * rest of the module never has to know about it.
 */
const ROUTES = {
  ping: "/ping",
  character: "/proxy/character"
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
 * @returns {Promise<object>} raw DDB character data
 */
export async function fetchCharacter(characterId) {
  const cobalt = getCobaltToken();
  const data = await proxyPost(ROUTES.character, {
    cobalt,
    characterId: String(characterId)
  });
  // Depending on the proxy version this may be wrapped, e.g. { success, data }.
  if (data && typeof data === "object" && "data" in data) return data.data;
  return data;
}
