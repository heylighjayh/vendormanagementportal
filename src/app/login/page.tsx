import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, getDefaultRedirectForSession, signIn } from "@/auth";
import { roles } from "@/lib/portal-types";

const seededAccess = [
  { label: "Admin", email: "admin@vendorportal.local", role: "admin" },
  { label: "Approver", email: "approver@vendorportal.local", role: "approver" },
  {
    label: "Internal control",
    email: "internal.control@vendorportal.local",
    role: "internal-control-reviewer",
  },
  { label: "Vendor", email: "northwind.vendor@gmail.com", role: "vendor" },
];

const errors: Record<string, string> = {
  CredentialsSignin: "Sign in failed. Check that the seeded email and role match.",
  Configuration: "Auth is not fully configured yet.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();

  if (session?.user?.role) {
    redirect(getDefaultRedirectForSession(session.user.role));
  }

  const params = await searchParams;
  const redirectTo =
    typeof params.redirectTo === "string" ? params.redirectTo : "/dashboard/vendor";
  const errorKey = typeof params.error === "string" ? params.error : "";
  const errorMessage = errors[errorKey];

  return (
    <main className="min-h-screen bg-[var(--portal-bg)] px-6 py-12 text-slate-900 sm:px-8 lg:px-12">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--portal-blue)]">
            Sign in
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            Access the vendor workflow by role.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            This phase uses explicit seeded-email login for local development while
            Microsoft, Google, and email magic link providers are being wired.
          </p>

          {errorMessage ? (
            <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <form
            className="mt-8 space-y-4"
            action={async (formData) => {
              "use server";

              try {
                await signIn("credentials", formData);
              } catch (error) {
                if (error instanceof AuthError) {
                  redirect(`/login?error=${error.type}&redirectTo=${encodeURIComponent(redirectTo)}`);
                }

                throw error;
              }
            }}
          >
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Seeded email</span>
              <input
                required
                type="email"
                name="email"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--portal-blue)]"
                placeholder="admin@vendorportal.local"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Role</span>
              <select
                required
                name="role"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--portal-blue)]"
                defaultValue="admin"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="w-full rounded-full bg-[var(--portal-blue)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(31,93,199,0.75)] transition hover:bg-[#184ca8]"
            >
              Continue to workspace
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Back home
            </Link>
          </div>
        </section>

        <aside className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_30px_100px_-55px_rgba(15,23,42,0.9)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
            Seeded access
          </p>
          <div className="mt-6 space-y-4">
            {seededAccess.map((entry) => (
              <article
                key={entry.email}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {entry.label}
                </p>
                <p className="mt-3 text-lg font-semibold">{entry.email}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Use role <span className="font-semibold text-white">{entry.role}</span> on the
                  form to open the correct dashboard.
                </p>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
