import Link from "next/link";
import { CompanyLogo } from "@/components/company-logo";
import {
  dashboardRoutes,
  lifecycleModules,
  portalHighlights,
  processSteps,
  recommendedStack,
  roleCards,
} from "@/lib/portal-data";

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--portal-blue)]">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--portal-bg)] text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200/70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(31,93,199,0.24),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(239,68,68,0.16),_transparent_22%),linear-gradient(180deg,_#f4f7fb_0%,_#f8fafc_48%,_#eef4ff_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.95)_100%)]" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 py-8 sm:px-8 lg:px-12">
          <header className="flex flex-col gap-6 rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-[0_24px_90px_-50px_rgba(15,23,42,0.5)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <CompanyLogo />
            <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
              <a className="rounded-full px-4 py-2 hover:bg-slate-100" href="#modules">
                Modules
              </a>
              <a className="rounded-full px-4 py-2 hover:bg-slate-100" href="#workflow">
                Workflow
              </a>
              <a className="rounded-full px-4 py-2 hover:bg-slate-100" href="#roles">
                Roles
              </a>
              <Link
                className="rounded-full bg-slate-950 px-5 py-2.5 text-white transition hover:bg-slate-800"
                href="/architecture"
              >
                View architecture
              </Link>
            </nav>
          </header>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="max-w-3xl space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--portal-border)] bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[var(--portal-red)]" />
                Dual-approval vendor lifecycle for admin, approver, vendors, and internal control
              </div>

              <div className="space-y-6">
                <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                  A modular portal for vendor onboarding, job assignments, completion
                  evidence, and invoice submission.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                  This starter foundation is designed for non-technical teams to extend
                  safely with Codex. Each module can evolve independently while keeping a
                  clear approval chain and a complete audit trail.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  className="rounded-full bg-[var(--portal-blue)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(31,93,199,0.75)] transition hover:bg-[#184ca8]"
                  href="/dashboard/admin"
                >
                  Open admin command center
                </Link>
                <Link
                  className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                  href="/dashboard/vendor"
                >
                  Preview vendor experience
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {portalHighlights.map((highlight) => (
                  <article
                    key={highlight.label}
                    className="rounded-[1.5rem] border border-white/80 bg-white/85 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.55)]"
                  >
                    <p className="text-sm font-medium text-slate-500">{highlight.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                      {highlight.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {highlight.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-[2rem] border border-[var(--portal-border)] bg-slate-950 p-6 text-white shadow-[0_30px_100px_-40px_rgba(15,23,42,1)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                    Portal snapshot
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                    March 2026 operations view
                  </h2>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                  Live-ready design
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">Onboarding SLA</p>
                  <p className="mt-2 text-2xl font-semibold">14 days</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Reminder alerts on day 0, day 7, day 12, and the deadline date.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">Assignment control</p>
                  <p className="mt-2 text-2xl font-semibold">Admin + Approver</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    A job cannot move forward until both approvals are recorded.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(31,93,199,0.26),rgba(15,23,42,0.2))] p-5">
                <p className="text-sm font-medium text-slate-300">Supported categories</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Networking Jobs", "CCTV Jobs", "Power & UPS", "Maintenance"].map(
                    (category) => (
                      <span
                        key={category}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white"
                      >
                        {category}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-dashed border-[rgba(255,255,255,0.2)] p-5">
                <p className="text-sm font-medium text-slate-300">
                  Future-ready integration lane
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Microsoft 365 sign-in, Google sign-in, email alerts, PostgreSQL, and a
                  later SAP ByDesign connector are already reflected in the architecture.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="modules" className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
        <SectionTitle
          eyebrow="Modules"
          title="Each part of the portal can be updated without rewriting the whole site."
          description="The build is organized as a set of focused modules so onboarding, sourcing, approvals, and invoicing can evolve independently."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-5">
          {lifecycleModules.map((module) => (
            <article
              key={module.title}
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.55)] transition hover:-translate-y-1 hover:shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--portal-blue-soft)] text-sm font-bold text-[var(--portal-blue)]">
                {module.badge}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-950">{module.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{module.description}</p>
              <p className="mt-5 text-sm font-medium text-slate-900">{module.outcome}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="workflow"
        className="border-y border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#edf4ff_100%)]"
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
          <SectionTitle
            eyebrow="Workflow"
            title="The portal enforces the exact lifecycle you described."
            description="Vendors move from invitation to verification, then into quoting, assignment, completion evidence, and invoice submission with approval gates at the right stages."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {processSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_26px_70px_-45px_rgba(15,23,42,0.45)]"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--portal-blue)]">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
                <p className="mt-4 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-700">
                  Approval rule: {step.gate}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
        <SectionTitle
          eyebrow="Roles"
          title="Four role experiences, one shared audit trail."
          description="Admin owns creation, vendors submit evidence, approvers provide the second sign-off, and internal control keeps oversight without disrupting the workflow."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {roleCards.map((role) => (
            <article
              key={role.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_26px_70px_-45px_rgba(15,23,42,0.4)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--portal-red)]">
                {role.eyebrow}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">{role.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{role.description}</p>
              <Link
                className="mt-6 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                href={role.href}
              >
                Open dashboard
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
              Recommended stack
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Chosen for maintainability, speed, and easy future extensions.
            </h2>
            <p className="max-w-xl text-base leading-7 text-slate-300">
              The portal is scaffolded with a practical setup that works well for
              lightweight deployment today and real integrations later.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {recommendedStack.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {item.title}
                </p>
                <p className="mt-3 text-lg font-semibold text-white">{item.choice}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.reason}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_32px_90px_-60px_rgba(15,23,42,0.55)] sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--portal-blue)]">
                Next move
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                This foundation is ready for real database, authentication, file storage,
                and email wiring.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The codebase already includes the workflow model, sample dashboards,
                database schema draft, and integration stubs so the next iteration can go
                straight into production features.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {dashboardRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  {route.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
