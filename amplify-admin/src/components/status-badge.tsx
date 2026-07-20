import { Badge } from "@/components/ui/badge";
import type { CampaignStatus, PayoutStatus } from "@/lib/types";

const CAMPAIGN_VARIANTS: Record<
  CampaignStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  open: "default",
  full: "secondary",
  closed: "secondary",
};

const PAYOUT_VARIANTS: Record<
  PayoutStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "default",
  paid: "secondary",
  failed: "destructive",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge variant={CAMPAIGN_VARIANTS[status]}>{status}</Badge>;
}

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return <Badge variant={PAYOUT_VARIANTS[status]}>{status}</Badge>;
}
