import Link from "next/link";

import { PayoutActions } from "@/components/payout-actions";
import { PayoutStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDate, formatMoney, formatViews } from "@/lib/format";
import type { Payout, PayoutStatus } from "@/lib/types";

const TABS: { label: string; status: PayoutStatus }[] = [
  { label: "Pending", status: "pending" },
  { label: "Failed", status: "failed" },
  { label: "Paid", status: "paid" },
];

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const active: PayoutStatus = TABS.some((tab) => tab.status === status)
    ? (status as PayoutStatus)
    : "pending";

  const { payouts } = await api.get<{ payouts: Payout[] }>(
    `/admin/payouts?status=${active}&limit=100`,
  );

  const total = payouts.reduce((sum, payout) => sum + Number(payout.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payouts</h1>
        <p className="text-muted-foreground text-sm">
          Send the money from your own UPI app, then record it here. Nothing on
          this page transfers funds.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <Link
              key={tab.status}
              href={`/payouts?status=${tab.status}`}
              className={
                tab.status === active
                  ? "bg-background rounded-md border px-3 py-1.5 text-sm font-medium"
                  : "text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm"
              }
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {payouts.length > 0 ? (
          <p className="text-muted-foreground text-sm tabular-nums">
            {payouts.length} · {formatMoney(total)}
          </p>
        ) : null}
      </div>

      {payouts.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-12 text-center text-sm">
          Nothing {active}.
        </p>
      ) : (
        <div className="bg-background rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    <div className="font-medium">{payout.creatorName}</div>
                    <div className="text-muted-foreground text-xs">
                      {payout.creatorUpiId ?? (
                        <span className="text-destructive">
                          no UPI id — cannot pay
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/campaigns/${payout.campaignId}`}
                      className="hover:underline"
                    >
                      {payout.trackName}
                    </Link>
                    <div className="text-muted-foreground text-xs">
                      <a
                        href={payout.reelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        view reel ↗
                      </a>
                    </div>
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {formatViews(payout.currentViews)}
                  </TableCell>

                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(payout.amount)}
                  </TableCell>

                  <TableCell>
                    <PayoutStatusBadge status={payout.status} />
                    <div className="text-muted-foreground text-xs">
                      {payout.status === "paid"
                        ? formatDate(payout.paidAt)
                        : formatDate(payout.createdAt)}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <PayoutActions payout={payout} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        The view count shown is the latest reading, which may differ from the one
        a payout was settled against if the final Instagram read failed.
      </p>
    </div>
  );
}
