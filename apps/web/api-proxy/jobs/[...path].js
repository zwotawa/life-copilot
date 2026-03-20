export default async function handler(req, res) {
  const baseUrl = process.env.AZURE_API_BASE_URL;
  const apiKey = process.env.AZURE_API_KEY;

  // CORS headers (safe for same-origin too)
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (!baseUrl || !apiKey) {
    res.status(500).send("Server proxy is not configured.");
    return;
  }

  const method = req.method?.toUpperCase();
  const allowed = ["POST", "PUT", "DELETE", "PATCH"];
  if (!allowed.includes(method)) {
    res.status(405).send("Method not allowed.");
    return;
  }

  const pathParts = Array.isArray(req.query.path) ? req.query.path : [];
  const targetUrl = `${baseUrl}/api/jobs/${pathParts.join("/")}`;

  const headers = {
    "Content-Type": req.headers["content-type"] || "application/json",
    "X-API-Key": apiKey,
  };

  let body = undefined;
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
