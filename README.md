# AuraOnboard

> **AI-powered employee onboarding agent.** New hires talk to an assistant that knows their role, knows the tools they need, and files access requests for them, so day one is for working, not chasing IT.

---

## The problem

New hires lose their first week waiting for tool access instead of doing real work. They can't push code (no GitHub), track tasks (no Jira), or reach vendors (no Slack), so they spend days chasing IT, managers, and HR, who are equally buried in the same repetitive requests. There's no intelligent layer between what a company knows about a role and what a new hire actually needs.

## What it does

When a new hire logs in, they get a personal onboarding assistant in a chat panel that already knows their role, their required tools, and the status of each one. They just talk to it.

- _"What tools do I still need?"_ gets a real, data-grounded answer
- _"Request GitHub access for me"_ files the request automatically
- _"Is AWS standard for my role?"_ checks the database and answers honestly

On the other side, an **admin** sees a live dashboard (total employees, active, pending logins, open requests) and an approval queue showing who asked for what, whether it's relevant to their role, and why. One click approves or denies, and the employee's dashboard updates instantly, no refresh.

## How it flows

```
Employee logs in  ->  Chat assistant (grounded in their role + live tool status)
                          |
                          |- validate_role   -> is this tool standard for the role?
                          |- request_access  -> writes a pending request to the DB
                                                    |
Admin approval queue  <---------------------------+
   |  approve / deny
   +-> employee dashboard updates live  (Supabase Realtime)
```

Signing in routes you by identity: admins land on `/admin`, employees on `/dashboard`, signed-out visitors on `/login`.

## What makes it different

- **It acts, it doesn't just list.** Most onboarding tools are forms and checklists. AuraOnboard is an agent that files requests on the employee's behalf.
- **The AI reasons before it acts.** Before requesting any tool, the agent calls `validate_role`. If the tool isn't mapped to the employee's role, it warns them it'll be flagged for manager review but still offers to submit. Every answer is grounded in live DB state, so no hallucinated tools or ETAs.
- **Production-grade reliability.** A multi-provider AI pool auto-discovers API keys, ranks them by priority and failure history, and fails over transparently on rate-limit or timeout with exponential backoff. The employee never sees an error.
- **End-to-end and real-time.** Employee chats, agent requests, DB updates, admin approves, employee dashboard refreshes live.

---

<details>
<summary><strong>Tech stack</strong></summary>

<br>

Next.js 16 (App Router), React 19, TypeScript, Supabase (Postgres + Realtime), Tailwind CSS v4, and a multi-provider AI pool (Groq, SambaNova, or any OpenAI-compatible LLM).

</details>

<details>
<summary><strong>Getting started</strong></summary>

<br>

**1. Install dependencies**

```bash
npm install
```

**2. Set environment variables** in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# AI providers: at least one key required. Add more for automatic failover.
GROQ_API_KEY=...
GROQ_API_KEY_2=...            # optional fallback
SAMBANOVA_API_KEY=...         # optional; needs SAMBANOVA_BASE_URL + SAMBANOVA_MODEL
```

The provider pool auto-discovers any supported key (Groq, SambaNova, OpenAI, Together, Mistral, and more), ranks them by priority, and fails over transparently.

**3. Run the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The `/sim` route is a **Demo Control Room** with guided steps, an invite launcher, and a demo reset.

</details>

<details>
<summary><strong>Project structure</strong></summary>

<br>

```
app/
  page.tsx              Session-aware redirector
  login/                Login
  dashboard/            Employee view: tool status + onboarding chat assistant
  admin/                Admin dashboard + approval queue (admin/queue)
  invite/[token]/       Invite acceptance
  sim/                  Demo Control Room (how-to, launcher, reset)
  console/              Mock-context admin console
  ai/                   AI provider failover playground
  api/
    auth/               Login + flip invited to active
    dashboard/          Employee access view
    request-access/     Create an access request
    assistant/          Onboarding agent: tool-calling loop over the provider pool
    admin/              queue, approve, deny, stats, roles, users
    ai/                 chat, providers (failover playground)
    demo-reset/         Reset demo state

components/             SimLauncher, Providers, BrandIcons
lib/
  ai/provider-pool.ts   Multi-provider discovery, ranking, and failover
  supabase/             Browser + server clients
  types.ts              Shared types + documented view shapes
```

</details>

<details>
<summary><strong>Data model</strong></summary>

<br>

The agent's answers are grounded in this schema. It reads real role-to-tool mappings rather than guessing.

**Core entities**

| Entity | What it holds |
|---|---|
| `orgs` | Company, name, email domain |
| `roles` | Role per org (name, color) |
| `employees` | A person: org, role, `invited` to `active` status, admin flag |
| `resources` | A tool/access (GitHub, Jira, etc.) with access and doc links, avg provisioning days, escalation contact |
| `role_resources` | Maps which resources are mandatory/optional **for a role**, powering `validate_role` |
| `employee_access` | Per-employee status of each resource: `not_requested`, `pending`, `granted`, `denied` |
| `access_requests` | A submitted request: who/what, `requested_by` (employee or agent), role-relevance flag, notes, status |

**Views the app reads from**

| View | Used by |
|---|---|
| `employee_access_view` | Employee dashboard: every resource and its status for one employee |
| `admin_requests_view` | Admin queue: pending requests joined with employee, role, and relevance |
| `org_onboarding_stats` | Admin dashboard: totals for active, pending logins, open/approved requests |

Full column shapes live in [`lib/types.ts`](lib/types.ts).

</details>

<details>
<summary><strong>Scripts</strong></summary>

<br>

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

</details>
