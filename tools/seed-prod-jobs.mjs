// tools/seed-prod-jobs.mjs
// PowerShell:
//   $env:API_URL="https://...azurewebsites.net"
//   $env:API_KEY="YOUR_KEY"
//   node tools/seed-prod-jobs.mjs

const API_KEY = process.env.API_KEY;

const API_URL =
  process.env.API_URL ||
  "https://life-copilot-api-crh4h3dddmcxfdb0.canadacentral-01.azurewebsites.net";

const jobs = [
  {
    company: "Northstar Logistics",
    role: "Frontend Engineer (Angular)",
    stage: "toApply",
    link: "https://example.com/jobs/northstar-angular",
    nextAction: "Tailor resume bullets to Angular + RxJS",
    nextTouchAt: null,
  },
  {
    company: "River City Insurance",
    role: "Full-Stack Engineer (Angular + .NET)",
    stage: "applied",
    link: "https://example.com/jobs/rivercity-fullstack",
    nextAction: "Add follow-up action for Friday",
    nextTouchAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
  },
  {
    company: "Prairie Analytics",
    role: "Frontend Engineer (Dashboards)",
    stage: "followUp",
    link: "https://example.com/jobs/prairie-dashboards",
    nextAction: "Send follow-up + attach portfolio link",
    nextTouchAt: Date.now() - 60 * 60 * 1000,
  },
  {
    company: "Cedar Systems",
    role: "Software Engineer (Frontend)",
    stage: "interview",
    link: "https://example.com/jobs/cedar-frontend",
    nextAction: "Prep: RxJS operators + change detection + testing",
    nextTouchAt: Date.now() + 24 * 60 * 60 * 1000,
  },
];

function norm(s) {
  return (s ?? "").trim().toLowerCase();
}

// Same natural key used for dedupe
function keyOf(j) {
  return `${norm(j.company)}||${norm(j.role)}||${norm(j.link)}`;
}

async function getJobs() {
  const res = await fetch(`${API_URL}/api/jobs`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET /api/jobs failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function createJob(job) {
  const res = await fetch(`${API_URL}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
    },
    body: JSON.stringify(job),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST /api/jobs failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function main() {
  console.log(`Seeding jobs to: ${API_URL}`);

  const existing = await getJobs();
  const existingKeys = new Set(existing.map(keyOf));

  let createdCount = 0;
  let skippedCount = 0;

  for (const job of jobs) {
    const k = keyOf(job);
    if (existingKeys.has(k)) {
      skippedCount++;
      console.log(`↩️  Skipping (already exists): ${job.company} — ${job.role} [${job.stage}]`);
      continue;
    }

    const c = await createJob(job);
    createdCount++;
    existingKeys.add(k);
    console.log(`✅ Created: ${c.company} — ${c.role} [${c.stage}] id=${c.id}`);
  }

  console.log(`\nDone. Created ${createdCount}. Skipped ${skippedCount}.`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});