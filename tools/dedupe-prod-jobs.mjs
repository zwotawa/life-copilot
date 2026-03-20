// tools/dedupe-prod-jobs.mjs
// PowerShell:
//   $env:API_URL="https://...azurewebsites.net"
//   $env:API_KEY="YOUR_KEY"
//   node tools/dedupe-prod-jobs.mjs

const API_URL =
  process.env.API_URL ||
  "https://life-copilot-api-crh4h3dddmcxfdb0.canadacentral-01.azurewebsites.net";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Missing API_KEY env var (required for DELETE).");
  process.exit(1);
}

function norm(s) {
  return (s ?? "").trim().toLowerCase();
}

// Natural key: company+role+stage+link (strong enough for your seed data)
function keyOf(j) {
  return `${norm(j.company)}||${norm(j.role)}||${norm(j.link)}`;
}

async function getJobs() {
  const res = await fetch(`${API_URL}/api/jobs`);
  if (!res.ok) throw new Error(`GET /api/jobs failed (${res.status})`);
  return res.json();
}

async function deleteJob(id) {
  const res = await fetch(`${API_URL}/api/jobs/${id}`, {
    method: "DELETE",
    headers: { "X-API-Key": API_KEY },
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new Error(`DELETE ${id} failed (${res.status}): ${text}`);
  }
}

async function main() {
  console.log(`Deduping jobs on: ${API_URL}`);

  const jobs = await getJobs();
  console.log(`Fetched ${jobs.length} jobs`);

  const groups = new Map();
  for (const j of jobs) {
    const k = keyOf(j);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(j);
  }

  const toDelete = [];
  for (const items of groups.values()) {
    if (items.length <= 1) continue;

    // Keep newest (highest createdAt)
    items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    const keep = items[0];
    const dupes = items.slice(1);

    console.log(
      `Duplicate group (${items.length}) KEEP=${keep.id} ${keep.company} — ${keep.role} [${keep.stage}]`
    );

    for (const d of dupes) toDelete.push(d.id);
  }

  console.log(`Deleting ${toDelete.length} duplicates...`);
  for (const id of toDelete) {
    await deleteJob(id);
    console.log(`🗑️ deleted ${id}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});