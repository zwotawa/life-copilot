// tools/seed-prod-jobs.mjs
// Run: node tools/seed-prod-jobs.mjs
// Optional: API_URL env var overrides the default

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
    nextTouchAt: Date.now() + 2 * 24 * 60 * 60 * 1000, // +2d
  },
  {
    company: "Prairie Analytics",
    role: "Frontend Engineer (Dashboards)",
    stage: "followUp",
    link: "https://example.com/jobs/prairie-dashboards",
    nextAction: "Send follow-up + attach portfolio link",
    nextTouchAt: Date.now() - 60 * 60 * 1000, // DUE (1h ago)
  },
  {
    company: "Cedar Systems",
    role: "Software Engineer (Frontend)",
    stage: "interview",
    link: "https://example.com/jobs/cedar-frontend",
    nextAction: "Prep: RxJS operators + change detection + testing",
    nextTouchAt: Date.now() + 24 * 60 * 60 * 1000, // tomorrow
  },
];

async function createJob(job) {
  const res = await fetch(`${API_URL}/api/jobs`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(API_KEY ? { "X-API-Key": API_KEY } : {})
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
  const created = [];

  for (const job of jobs) {
    const c = await createJob(job);
    created.push(c);
    console.log(`✅ Created: ${c.company} — ${c.role} [${c.stage}] id=${c.id}`);
  }

  console.log(`\nDone. Created ${created.length} job cards.`);
  console.log(`Open your Vercel UI and refresh the Job page.`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});