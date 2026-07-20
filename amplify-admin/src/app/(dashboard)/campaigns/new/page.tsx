import Link from "next/link";

import { CampaignForm } from "@/components/campaign-form";

export default function NewCampaignPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/campaigns"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Campaigns
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New campaign</h1>
      </div>

      <CampaignForm />
    </div>
  );
}
