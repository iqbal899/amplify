"use client";

import { useActionState } from "react";

import {
  createCampaign,
  updateCampaign,
  type ActionState,
} from "@/app/actions/campaigns";
import { MilestoneEditor } from "@/components/milestone-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toDateTimeLocal } from "@/lib/format";
import type { Campaign } from "@/lib/types";

function Field({
  name,
  label,
  hint,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}

export function CampaignForm({ campaign }: { campaign?: Campaign }) {
  const isEdit = Boolean(campaign);

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    isEdit ? updateCampaign : createCampaign,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      {campaign ? (
        <input type="hidden" name="id" value={campaign.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="trackName"
          label="Track name"
          defaultValue={campaign?.trackName}
          required
        />
        <Field
          name="artistName"
          label="Artist"
          defaultValue={campaign?.artistName}
          required
        />
        <Field
          name="genre"
          label="Genre"
          defaultValue={campaign?.genre ?? ""}
        />
        <Field
          name="language"
          label="Language"
          defaultValue={campaign?.language ?? ""}
        />
        <Field
          name="spotsTotal"
          label="Spots"
          type="number"
          min={1}
          defaultValue={campaign?.spotsTotal}
          required
        />
        <Field
          name="rewardPool"
          label="Reward pool"
          type="number"
          min={0}
          step="0.01"
          defaultValue={campaign?.rewardPool ?? ""}
          hint="Total budget. Not enforced against milestone payouts."
        />
        <Field
          name="endsAt"
          label="Deadline"
          type="datetime-local"
          defaultValue={toDateTimeLocal(campaign?.endsAt ?? null)}
          required
          hint="Payouts are settled against view counts at this instant."
        />
        <Field
          name="spotifyTrackId"
          label="Spotify track id"
          defaultValue={campaign?.spotifyTrackId ?? ""}
        />
        <Field
          name="albumArt"
          label="Album art URL"
          defaultValue={campaign?.albumArt ?? ""}
        />
        <Field
          name="previewUrl"
          label="Preview URL"
          defaultValue={campaign?.previewUrl ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={campaign?.description ?? ""}
        />
      </div>

      <MilestoneEditor initial={campaign?.milestones} />

      {state && "error" in state ? (
        <p aria-live="polite" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}

      {state && "ok" in state ? (
        <p aria-live="polite" className="text-sm text-emerald-600">
          {state.ok}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Create draft"}
        </Button>
      </div>

      {!isEdit ? (
        <p className="text-muted-foreground text-xs">
          Created as a draft. Creators cannot see it until you start it.
        </p>
      ) : null}
    </form>
  );
}
