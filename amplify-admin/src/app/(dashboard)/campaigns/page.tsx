import Link from "next/link";

import { CampaignStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDate, formatMoney, relativeDeadline } from "@/lib/format";
import type { CampaignSummary } from "@/lib/types";

export default async function CampaignsPage() {
  const { campaigns } = await api.get<{ campaigns: CampaignSummary[] }>(
    "/admin/campaigns?limit=100",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-muted-foreground text-sm">
            Drafts are invisible to creators until started.
          </p>
        </div>

        <Button asChild>
          <Link href="/campaigns/new">New campaign</Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-12 text-center text-sm">
          No campaigns yet.
        </p>
      ) : (
        <div className="bg-background rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Track</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Spots</TableHead>
                <TableHead className="text-right">Pool</TableHead>
                <TableHead>Deadline</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="font-medium hover:underline"
                    >
                      {campaign.trackName}
                    </Link>
                    <div className="text-muted-foreground text-xs">
                      {campaign.artistName}
                    </div>
                  </TableCell>

                  <TableCell>
                    <CampaignStatusBadge status={campaign.status} />
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {campaign.enrolledCount} / {campaign.spotsTotal}
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {formatMoney(campaign.rewardPool)}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">{formatDate(campaign.endsAt)}</div>
                    <div className="text-muted-foreground text-xs">
                      {campaign.status === "closed"
                        ? "closed"
                        : relativeDeadline(campaign.endsAt)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
