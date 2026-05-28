-- 30 canonical drills for M5 launch.
-- 10 Build / 10 Refine / 10 Decide.
--
-- Run ONCE on a fresh drills table. No TRUNCATE, no ON CONFLICT —
-- re-running would error on duplicate titles only if a unique title
-- constraint existed (it doesn't), so a second run inserts duplicates.
-- Treat this as one-time seed content.
--
-- Authoring notes:
--   - Titles are under 8 words
--   - Prompts are under 2000 characters (DB check enforces)
--   - Each drill is sized for five commands of work in an AI tool
--   - Each drill should produce visibly distinct work across Atlas/Vela/Iris
--     (Atlas ships fast and rough, Vela scopes and structures, Iris validates
--     and verifies — the same drill yields three different sessions)

insert into public.drills (title, prompt) values

  -- ---------- BUILD (10) ----------

  ($drill$Mobile habit checklist$drill$,
   $drill$Build a single-screen mobile habit checklist with exactly three hardcoded habits and tap-to-toggle checkmarks. No storage, no auth, no settings. The screen renders, the checkmarks toggle, that is the entire deliverable.$drill$),

  ($drill$Markdown link extractor$drill$,
   $drill$Build a command-line tool that takes a markdown file path as its argument and prints every URL contained in it, one per line, in the order they appear. Any http or https URL is in scope. Files with no URLs produce empty output and exit cleanly.$drill$),

  ($drill$One-page personal landing site$drill$,
   $drill$Build a one-page personal landing site with your name, three projects (each with a title and a one-sentence description), and a contact email. No JavaScript framework. Plain HTML and CSS only. The page should render cleanly in a modern browser without errors.$drill$),

  ($drill$CSV row diff tool$drill$,
   $drill$Build a script that takes two CSV file paths and prints rows that differ between them. Both files share identical column structure. Output each differing row prefixed with its source file name. Identical rows produce no output.$drill$),

  ($drill$Four-URL status page$drill$,
   $drill$Build a web page that, on load, fetches four hardcoded public URLs and displays a green dot for each that returned HTTP 200, red for anything else. No build tool. One HTML file with a script tag is fine. Pick the four URLs yourself.$drill$),

  ($drill$Local note-taking app$drill$,
   $drill$Build a single-page note-taking app. One textarea at the top, a list of saved notes below. Notes save to localStorage on textarea blur and the list updates without a page reload. No backend, no auth, no edit-existing-notes affordance.$drill$),

  ($drill$JSON key path flattener$drill$,
   $drill$Build a function that takes a JSON object of arbitrary depth and returns every key as a flat array of dotted paths. For the input {a:{b:1,c:2}} it returns ["a.b","a.c"]. Handle nested objects. Arrays are out of scope for V1 — treat their contents as opaque values.$drill$),

  ($drill$Weekly meal randomizer$drill$,
   $drill$Build a tool that takes seven meal names (input however you prefer — text field, file, hardcoded array) and outputs a randomized seven-day schedule from Monday to Sunday. Re-running produces a different randomization. No constraint on repeated meals across days.$drill$),

  ($drill$Slack webhook poster$drill$,
   $drill$Build a Python script that posts a message to a Slack incoming webhook. The webhook URL comes from an environment variable. The message is read from sys.argv. Print success or failure to stdout. Do not depend on slack_sdk — use requests or urllib.$drill$),

  ($drill$Email redaction filter$drill$,
   $drill$Build a tool that takes a chunk of text and replaces anything matching an email-address pattern with [REDACTED]. Read from stdin, write to stdout. Use a regex that catches typical email formats. Do not try to be RFC-perfect — handle the common cases cleanly.$drill$),

  -- ---------- REFINE (10) ----------

  ($drill$React re-render audit$drill$,
   $drill$You have a React component that re-renders far more often than it should. Find the source of the wasted re-renders (state changes that should not trigger downstream renders, missing memoization, prop instability from inline objects or functions) and fix them without changing the public API of the component.$drill$),

  ($drill$Python script speed-up$drill$,
   $drill$You have a Python script that runs in 30 seconds on 10MB of input data. Profile it (cProfile is fine), identify the actual bottleneck, and get it under 5 seconds. The output must remain identical — only the path it takes to produce the output changes.$drill$),

  ($drill$Inline form validation$drill$,
   $drill$You have an HTML form with no validation. Add client-side validation that shows specific error messages for each invalid field, displayed inline below the field rather than in a global alert. Do not add external libraries. Use the browser native constraint validation API where possible.$drill$),

  ($drill$Mobile-breaking layout fix$drill$,
   $drill$You have a CSS layout that breaks on screens narrower than 600px (text overflows, elements stack wrong, padding eats the viewport). Find the breaking points and fix them with min-width or max-width media queries. The desktop layout stays untouched.$drill$),

  ($drill$Slow SQL query rewrite$drill$,
   $drill$You have a SQL query against five tables or fewer that takes 8 seconds on production data. Explain its query plan, identify the bottleneck (missing index, bad join order, unnecessary subquery), and rewrite it. The rewritten query must return identical rows.$drill$),

  ($drill$If/else chain refactor$drill$,
   $drill$You have a function with a 100-line if/elif/else chain doing conditional dispatch. Refactor it into a lookup table or dispatch map. Observable behavior must be unchanged. Add no new dependencies. The refactor should make the dispatch logic visible at a glance.$drill$),

  ($drill$README cut to ten lines$drill$,
   $drill$You have a 40-line README that no new contributor reads. Cut it to the 10 essential lines that someone arriving for the first time needs in their first hour. Everything else moves into linked docs or gets deleted. Defend each surviving line.$drill$),

  ($drill$Flaky test root cause$drill$,
   $drill$You have a Jest test suite with three flaky tests. Find the root cause of each flake (timing, ordering, shared state, network) and fix it. Marking the test as .skip or adding retries does not count — find the actual cause.$drill$),

  ($drill$API payload trim$drill$,
   $drill$You have an API response that is 200KB. Identify what is redundant, what is computable client-side, and what is actually used by the consumer. Cut the payload under 50KB without breaking any current consumer.$drill$),

  ($drill$Tailwind class extraction$drill$,
   $drill$You have a component soup of about 25 Tailwind utility classes per element across a related set of elements. Extract a coherent set of @apply rules or CSS component classes so the JSX is readable. The visual result must not change.$drill$),

  -- ---------- DECIDE (10) ----------

  ($drill$Two incidents, which cost more$drill$,
   $drill$Write down two production incidents from your past quarter (real or canonical). Decide which was more costly — measured by user-visible impact, by engineering-hours spent recovering, or by trust damage with stakeholders. Defend the axis you chose as well as your answer.$drill$),

  ($drill$Introducing an ORM mid-project$drill$,
   $drill$A teammate proposes introducing an ORM into a project that has used raw SQL queries from day one. Decide whether to support, oppose, or negotiate the change. State your decision and the single strongest argument that nearly changes your mind.$drill$),

  ($drill$Editor config for new hire$drill$,
   $drill$Compare three editor or IDE configurations: your own, your AI tool defaults, and a popular preset you know. Decide which one you would recommend to a new hire on day one. Name the strongest reason for and the strongest counter-argument against your choice.$drill$),

  ($drill$Sprint pick from 47 issues$drill$,
   $drill$You have an open issue tracker with roughly 47 issues across bugs, features, and chores. Decide which 5 belong in the next two-week sprint. Explain the principle you used to rank — not just the list. The principle should generalize to the next sprint planning, not just this one.$drill$),

  ($drill$Three API proposals$drill$,
   $drill$Three teammates submit competing API design proposals for the same endpoint. Decide which one to ship as the baseline, which one to reject outright, and the third proposal's best idea to absorb into the chosen design. Defend the rejection most directly.$drill$),

  ($drill$DB connection limit fix$drill$,
   $drill$Your service is hitting its database connection limit during traffic spikes. Decide between connection pooling, request queuing, or vertical scaling. State your choice and what you accepted as a downside. Do not pick more than one — force the trade-off.$drill$),

  ($drill$Monitoring vendor decision$drill$,
   $drill$A vendor pitches a monitoring tool that overlaps roughly 70 percent with your existing stack but is cheaper to operate and has a sharper UI. Decide: buy, build (close the 30 percent gap in-house), or do nothing. One paragraph defending your choice.$drill$),

  ($drill$Pick the junior hire$drill$,
   $drill$Three candidates for a junior role: fast but sloppy, careful but slow, balanced but unmotivated. Decide who to hire. Sketch the onboarding plan that addresses their specific weakness in three concrete actions.$drill$),

  ($drill$CI pipeline at 15 minutes$drill$,
   $drill$Your CI pipeline takes 15 minutes per run. Decide on ONE intervention: parallelize tests, cache builds, split the pipeline, or rewrite the slowest test. State the intervention, the expected savings, and what you give up by not doing the others.$drill$),

  ($drill$Feature that breaks principle$drill$,
   $drill$A potential customer asks for a feature that conflicts with your product stated strategic principle. Decide: ship the feature (and how you justify the deviation), refuse the customer (and how you communicate it), or counter-propose a different solve. Defend your choice in one paragraph.$drill$);
