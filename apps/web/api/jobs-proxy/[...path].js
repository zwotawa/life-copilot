// apps/web/api/jobs-proxy/[...path].js
export default async function handler(req, res) {
  const baseUrl = process.env.AZURE_API_BASE_URL;
  const apiKey = (process.env.AZURE_API_KEY || "").trim();

  if (!apiKey) {
    res.status(500).send("AZURE_API_KEY missing in Vercel env.");
    return;
    }

  // TEMP: verify header length without exposing it
  // (remove after debugging)
  res.setHeader("x-proxy-key-len", String(apiKey.length));

  // Allow preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (!baseUrl || !apiKey) {
    res.status(500).send("Proxy not configured.");
    return;
  }

  res.setHeader("x-proxy-not-allowed", req.method || "NO-METHOD");

  const method = (req.method || "").toUpperCase();
  const allowed = ["POST", "PUT", "DELETE", "PATCH"];
  if (!allowed.includes(method)) {
    res.setHeader("Not-Allowed", method);
    res.status(405).send(`Method not allowed. ${req.method} is not supported.`);
    return;
  }

const pathPartsRaw = req.query.path;

// Vercel usually provides an array for catch-all; handle string too.
let pathParts = [];
if (Array.isArray(pathPartsRaw)) pathParts = pathPartsRaw;
else if (typeof pathPartsRaw === "string") pathParts = [pathPartsRaw];

// Fallback: parse from URL if query param didn't populate
if (pathParts.length === 0) {
  const url = new URL(req.url, "https://dummy");
  // /api/jobs-proxy/<id>  -> take everything after /api/jobs-proxy/
  const prefix = "/api/jobs-proxy/";
  const pathname = url.pathname || "";
  if (pathname.startsWith(prefix)) {
    const rest = pathname.slice(prefix.length);
    if (rest) pathParts = rest.split("/").filter(Boolean);
  }
}

const targetUrl =
  pathParts.length > 0
    ? `${baseUrl}/api/jobs/${pathParts.join("/")}`
    : `${baseUrl}/api/jobs`;

  const headers = {
    "Content-Type": req.headers["content-type"] || "application/json",
    "X-API-Key": apiKey,
  };

  let body;
  if (method !== "DELETE") {
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
  }

  try {
    const upstream = await fetch(targetUrl, { method, headers, body });
    const text = await upstream.text();

    res.setHeader("x-upstream-status", String(upstream.status));
    res.setHeader("x-upstream-url", targetUrl);

    res.status(upstream.status);
    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("content-type", ct);
    res.send(text);
  } catch (e) {
    res.status(502).send("Bad gateway");
  }
}