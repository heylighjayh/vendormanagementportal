import Image from "next/image";
import Link from "next/link";

export function CompanyLogo() {
  return (
    <Link href="/" className="flex items-center gap-4">
      <div className="rounded-[1.25rem] bg-white p-2 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.7)]">
        <Image
          src="/company-logo.svg"
          alt="Company logo"
          width={56}
          height={56}
          priority
        />
      </div>

      <div>
        <p className="font-display text-lg font-bold uppercase tracking-[0.22em] text-slate-950">
          Vendor Portal
        </p>
        <p className="text-sm text-slate-500">Operations workspace</p>
      </div>
    </Link>
  );
}
