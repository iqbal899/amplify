import Link from "next/link";

import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="bg-background border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6">
          <Link href="/campaigns" className="font-semibold">
            Amplify
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/campaigns"
              className="text-muted-foreground hover:text-foreground"
            >
              Campaigns
            </Link>
            <Link
              href="/payouts"
              className="text-muted-foreground hover:text-foreground"
            >
              Payouts
            </Link>
          </nav>

          <form action={logout} className="ml-auto">
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
