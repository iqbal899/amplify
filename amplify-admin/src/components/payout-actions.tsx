"use client";

import { useState } from "react";

import {
  markPayoutFailed,
  markPayoutPaid,
  setCreatorUpiId,
} from "@/app/actions/payouts";
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
import { formatMoney } from "@/lib/format";
import { useActionSubmit } from "@/lib/use-action-submit";
import type { Payout } from "@/lib/types";

/** Fills in a missing UPI id. Without one there is nowhere to send the money. */
function SetUpiDialog({ payout }: { payout: Payout }) {
  const [open, setOpen] = useState(false);

  const { submit, pending } = useActionSubmit(setCreatorUpiId, () =>
    setOpen(false),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {payout.creatorUpiId ? "Edit UPI" : "Add UPI"}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>UPI id for {payout.creatorName}</DialogTitle>
          <DialogDescription>
            Where this creator&rsquo;s payouts are sent. Saved against the
            creator, so it is reused for future campaigns.
          </DialogDescription>
        </DialogHeader>

        <form action={submit} className="space-y-4">
          <input type="hidden" name="creatorId" value={payout.creatorId} />

          <div className="space-y-2">
            <Label htmlFor={`upi-${payout.id}`}>UPI id</Label>
            <Input
              id={`upi-${payout.id}`}
              name="upiId"
              placeholder="name@bank"
              defaultValue={payout.creatorUpiId ?? ""}
              autoComplete="off"
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Records a transfer the operator has already made.
 *
 * The wording is deliberate: this button does not send money, and an operator
 * who believes it does would mark rows paid without ever paying anyone.
 */
function MarkPaidDialog({ payout }: { payout: Payout }) {
  const [open, setOpen] = useState(false);

  const { submit, pending } = useActionSubmit(markPayoutPaid, () =>
    setOpen(false),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={!payout.creatorUpiId}>
          Record payment
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment to {payout.creatorName}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                Send <strong>{formatMoney(payout.amount)}</strong> to{" "}
                <strong>{payout.creatorUpiId}</strong> from your UPI app first.
              </p>
              <p>
                This form does not transfer anything — it records that you
                already did.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <form action={submit} className="space-y-4">
          <input type="hidden" name="id" value={payout.id} />

          <div className="space-y-2">
            <Label htmlFor={`ref-${payout.id}`}>UPI transaction reference</Label>
            <Input
              id={`ref-${payout.id}`}
              name="upiReference"
              placeholder="e.g. 412345678901"
              autoComplete="off"
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Mark paid"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MarkFailedButton({ payout }: { payout: Payout }) {
  const { submit, pending } = useActionSubmit(markPayoutFailed);

  return (
    <form action={submit}>
      <input type="hidden" name="id" value={payout.id} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? "…" : "Failed"}
      </Button>
    </form>
  );
}

export function PayoutActions({ payout }: { payout: Payout }) {
  if (payout.status === "paid") {
    return (
      <span className="text-muted-foreground text-xs">
        {payout.upiReference}
      </span>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <SetUpiDialog payout={payout} />
      <MarkPaidDialog payout={payout} />
      {payout.status === "pending" ? (
        <MarkFailedButton payout={payout} />
      ) : null}
    </div>
  );
}
