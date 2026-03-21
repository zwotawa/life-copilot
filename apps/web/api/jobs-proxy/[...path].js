// apps/web/api/jobs-proxy/[...path].js
export default async function handler(req, res) {
  const baseUrl = (process.env.AZURE_API_BASE_URL || "").trim();
  const apiKey = (process.env.AZURE_API_KEY || "").trim();

  // Allow preflight (Vercel functions can still see OPTIONS occasionally)
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (!baseUrl || !apiKey) {
    res.status(500).send("Proxy not configured.");
    return;
  }

  const method = (req.method || "").toUpperCase();
  const allowed = ["POST", "PUT", "DELETE", "PATCH"];
  if (!allowed.includes(method)) {
    res.status(405).send("Method not allowed.");
    return;
  }

  // Catch-all route parts (array or string), plus URL fallback
  const pathPartsRaw = req.query.path;
  let pathParts = [];
  if (Array.isArray(pathPartsRaw)) pathParts = pathPartsRaw;
  else if (typeof pathPartsRaw === "string") pathParts = [pathPartsRaw];

  if (pathParts.length === 0) {
    const url = new URL(req.url, "https://dummy");
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

    res.status(upstream.status);
    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("content-type", ct);

    res.send(text);
  } catch {
    res.status(502).send("Bad gateway");
  }
}