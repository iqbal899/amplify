"use client";

import { useState } from "react";

import { endCampaign, startCampaign } from "@/app/actions/campaigns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionSubmit } from "@/lib/use-action-submit";
import type { Campaign } from "@/lib/types";

function StartButton({ campaign }: { campaign: Campaign }) {
  const { submit, pending } = useActionSubmit(startCampaign);

  const missingMilestones = !campaign.milestones?.length;
  const missingDeadline = !campaign.endsAt;
  const blocked = missingMilestones || missingDeadline;

  return (
    <form action={submit}>
      <input type="hidden" name="id" value={campaign.id} />

      <Button type="submit" disabled={pending || blocked}>
        {pending ? "Starting…" : "Start campaign"}
      </Button>

      {blocked ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Needs {missingMilestones ? "milestones" : ""}
          {missingMilestones && missingDeadline ? " and " : ""}
          {missingDeadline ? "a deadline" : ""} before it can be started.
        </p>
      ) : null}
    </form>
  );
}

/**
 * Ending is irreversible and pays real money, so it is gated behind typing the
 * track name rather than a single click. It is also slow — the backend calls
 * Instagram once per submission — so the dialog says so, to stop an operator
 * assuming it hung and retrying.
 */
function EndButton({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const { submit, pending } = useActionSubmit(endCampaign, () => {
    setOpen(false);
    setConfirmation("");
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">End &amp; settle</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>End “{campaign.trackName}”?</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                This brings the deadline forward to now, takes a final view
                reading for every submission, writes the payouts, and closes the
                campaign. <strong>It cannot be undone.</strong>
              </p>
              <p>
                It calls Instagram once per submission, so it may take a while.
                Do not retry if it seems slow.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <form action={submit} className="space-y-4">
          <input type="hidden" name="id" value={campaign.id} />

          <div className="space-y-2">
            <Label htmlFor="confirm">
              Type <strong>{campaign.trackName}</strong> to confirm
            </Label>
            <Input
              id="confirm"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || confirmation !== campaign.trackName}
            >
              {pending ? "Settling…" : "End & settle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CampaignLifecycle({ campaign }: { campaign: Campaign }) {
  if (campaign.status === "draft") {
    return <StartButton campaign={campaign} />;
  }

  if (campaign.status === "closed") {
    return (
      <p className="text-muted-foreground text-sm">
        Closed. Payouts are on the{" "}
        <a href="/payouts" className="underline">
          payouts
        </a>{" "}
        page.
      </p>
    );
  }

  return <EndButton campaign={campaign} />;
}
