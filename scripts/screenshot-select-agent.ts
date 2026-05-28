// Screenshot /select-agent (and /session) using system Chrome via
// puppeteer-core. Run with the dev server already on :3000.
//
//   node --experimental-strip-types scripts/screenshot-select-agent.ts
//
// The dev user has an active agent (Atlas) — /select-agent redirects to
// /session in that state. To capture the cards, this script temporarily
// flips died_at on the agent row so the active-agent check fails, takes
// the screenshot, then restores died_at = NULL.  Reversible. Service-role
// access; nothing touches schema.
//
// Output: tmp/screenshots/select-agent.png and session.png

import puppeteer from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const CHROME_PATH =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE_URL = "http://localhost:3000";
const OUT_DIR = join(process.cwd(), "tmp", "screenshots");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.",
  );
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

await mkdir(OUT_DIR, { recursive: true });

async function findActiveAgentId(): Promise<string | null> {
  const { data, error } = await admin
    .from("agents")
    .select("id")
    .is("died_at", null)
    .limit(1);
  if (error) throw new Error(error.message);
  return data?.[0]?.id ?? null;
}

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  defaultViewport: { width: 1280, height: 1800, deviceScaleFactor: 2 },
});

let agentId: string | null = null;
try {
  const page = await browser.newPage();

  console.log("→ /auth/dev-login");
  const loginResp = await page.goto(`${BASE_URL}/auth/dev-login`, {
    waitUntil: "networkidle0",
    timeout: 30000,
  });
  console.log(`  status: ${loginResp?.status()}, landed: ${page.url()}`);

  // /session screenshot first (no DB mutation needed).
  console.log("→ /session");
  await page.goto(`${BASE_URL}/session`, {
    waitUntil: "networkidle0",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 600));
  const sessionPath = join(OUT_DIR, "session.png");
  await page.screenshot({ path: sessionPath, fullPage: true });
  console.log(`  saved: ${sessionPath}`);

  // Temporarily mark the agent as dead so /select-agent renders the cards.
  agentId = await findActiveAgentId();
  if (agentId) {
    console.log(`→ temp died_at on agent ${agentId}`);
    const { error } = await admin
      .from("agents")
      .update({ died_at: new Date().toISOString() })
      .eq("id", agentId);
    if (error) throw new Error(`failed to set died_at: ${error.message}`);
  } else {
    console.log("→ no active agent found; /select-agent should render natively");
  }

  console.log("→ /select-agent");
  await page.goto(`${BASE_URL}/select-agent`, {
    waitUntil: "networkidle0",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 800));
  console.log(`  landed: ${page.url()}`);
  const selectPath = join(OUT_DIR, "select-agent.png");
  await page.screenshot({ path: selectPath, fullPage: true });
  console.log(`  saved: ${selectPath}`);
} finally {
  // ALWAYS restore the agent, even if anything above threw.
  if (agentId) {
    console.log(`→ restore agent ${agentId} (died_at = NULL)`);
    const { error } = await admin
      .from("agents")
      .update({ died_at: null })
      .eq("id", agentId);
    if (error) {
      console.error(`!! FAILED to restore died_at: ${error.message}`);
      console.error(`!! Manually run: update agents set died_at = null where id = '${agentId}';`);
    } else {
      console.log("  restored.");
    }
  }
  await browser.close();
}
