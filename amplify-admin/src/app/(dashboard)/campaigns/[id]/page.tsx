import Link from "next/link";
import { notFound } from "next/navigation";

import { CampaignForm } from "@/components/campaign-form";
import { CampaignLifecycle } from "@/components/campaign-lifecycle";
import { CampaignStatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, ApiRequestError } from "@/lib/api";
import { formatDate, formatMoney, relativeDeadline } from "@/lib/format";
import type { Campaign } from "@/lib/types";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let campaign: Campaign;

  try {
    ({ campaign } = await api.get<{ campaign: Campaign }>(
      `/admin/campaigns/${id}`,
    ));
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  const closed = campaign.status === "closed";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/campaigns"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Campaigns
        </Link>

        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{campaign.trackName}</h1>
          <CampaignStatusBadge status={campaign.status} />
        </div>

        <p className="text-muted-foreground text-sm">{campaign.artistName}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>
            {campaign.spotsFilled ?? 0} of {campaign.spotsTotal} spots filled ·{" "}
            {formatMoney(campaign.rewardPool)} pool ·{" "}
            {formatDate(campaign.endsAt)} ({relativeDeadline(campaign.endsAt)})
          </CardDescription>
        </CardHeader>

        <CardContent>
          <CampaignLifecycle campaign={campaign} />
        </CardContent>
      </Card>

      {closed ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
            <CardDescription>
              A closed campaign cannot be edited — the payouts it produced have
              already been decided.
            </CardDescription>
          </CardHeader>

          <CardContent className="text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              {(campaign.milestones ?? []).map((milestone) => (
                <div key={milestone.views}>
                  <dt className="text-muted-foreground">
                    {milestone.views.toLocaleString("en-IN")} views ·{" "}
                    {milestone.minDaysLive}d live
                  </dt>
                  <dd className="font-medium">
                    {formatMoney(milestone.cumulativePayout)}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
            {(campaign.spotsFilled ?? 0) > 0 ? (
              <CardDescription className="text-amber-600">
                Creators are already enrolled. Changing milestones or the
                deadline changes the terms of work they may have already done.
              </CardDescription>
            ) : null}
          </CardHeader>

          <CardContent>
            <CampaignForm campaign={campaign} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
