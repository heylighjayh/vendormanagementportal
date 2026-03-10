import Link from "next/link";
import { auth, signOut } from "@/auth";
import { CompanyLogo } from "@/components/company-logo";
import { dashboardRoutes } from "@/lib/portal-data";
import { getPortalSnapshot } from "@/lib/portal-repository";
import { getDashboardHref } from "@/lib/role-utils";
import { getJobSummary, getVendorStatusSummary } from "@/lib/workflows";

function formatRoleLabel(label: string) {
  return label === "Internal Control" ? "Internal control" : label;
}

export default async function Home() {
  const [session, snapshot] = await Promise.all([auth(), getPortalSnapshot()]);
  const dashboardHref = session?.user?.role ? getDashboardHref(session.user.role) : "/login";
  const vendorSummary = getVendorStatusSummary(snapshot.vendors);
  const jobSummary = getJobSummary(snapshot.jobs);
  const nextVendorDeadline = [...snapshot.vendors]
    .filter((vendor) => vendor.status !== "verified")
    .sort((left, right) => left.onboardingDeadline.localeCompare(right.onboardingDeadline))[0];
  const latestJobs = snapshot.jobs.slice(0, 3);

  return (
    <main className="min-h-screen bg-[var(--portal-bg)] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.45)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <CompanyLogo />
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={dashboardHref}
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {session?.user ? "Open workspace" : "Sign in"}
            </Link>
            {session?.user ? (
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </form>
            ) : null}
          </div>
        </header>

        {snapshot.source === "sample" ? (
          <article className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            {snapshot.error
              ? `Showing sample records. ${snapshot.error}`
              : "Showing sample records."}
          </article>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.45)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--portal-blue)]">
              Vendor Management
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Vendors, reviews, and jobs.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Open a dashboard and work from the queue.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={dashboardHref}
                className="rounded-full bg-[var(--portal-blue)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#184ca8]"
              >
                {session?.user ? "Go to my dashboard" : "Continue to login"}
              </Link>
              <Link
                href="/dashboard/admin"
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Open admin dashboard
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Total vendors</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {vendorSummary.total}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Verified vendors</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {vendorSummary.verified}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Open jobs</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {jobSummary.open}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Completion reviews</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {jobSummary.completionPending}
                </p>
              </article>
            </div>
          </article>

          <aside className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_30px_90px_-50px_rgba(15,23,42,0.8)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
              Attention now
            </p>
            <div className="mt-6 space-y-4">
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Onboarding queue</p>
                <p className="mt-2 text-2xl font-semibold">{vendorSummary.collecting}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Vendors are still collecting documents or awaiting review.
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Next deadline</p>
                <p className="mt-2 text-lg font-semibold">
                  {nextVendorDeadline
                    ? `${nextVendorDeadline.companyName} · ${nextVendorDeadline.onboardingDeadline}`
                    : "No pending onboarding deadline"}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Invoice-ready jobs</p>
                <p className="mt-2 text-2xl font-semibold">{jobSummary.invoiceReady}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Completion evidence has passed approval and invoicing can proceed.
                </p>
              </article>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_28px_80px_-55px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--portal-blue)]">
                  Dashboards
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Open a dashboard</h2>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {dashboardRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--portal-red)]">
                    {formatRoleLabel(route.label)}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">
                    {route.href.replace("/dashboard/", "")}
                  </p>
                </Link>
              ))}
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_28px_80px_-55px_rgba(15,23,42,0.45)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--portal-blue)]">
              Recent jobs
            </p>
            <div className="mt-5 space-y-4">
              {latestJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-950">{job.title}</h2>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {job.status.replaceAll("-", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {job.id} · {job.category} · Created {job.createdAt}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
