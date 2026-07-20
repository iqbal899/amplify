"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import type { Milestone } from "@/lib/types";

type Draft = {
  views: string;
  minDaysLive: string;
  incrementalPayout: string;
};

function toDraft(milestone: Milestone): Draft {
  return {
    views: String(milestone.views),
    minDaysLive: String(milestone.minDaysLive),
    incrementalPayout: String(milestone.incrementalPayout),
  };
}

/**
 * Milestone tiers.
 *
 * `cumulativePayout` is deliberately NOT editable. Settlement pays the
 * cumulative figure and ignores the increments, so letting an operator type
 * both invites a silent mismatch that only shows up as a wrong payout. Here it
 * is derived from the increments, which is also exactly what the API validates.
 */
export function MilestoneEditor({
  initial,
}: {
  initial?: Milestone[] | null;
}) {
  const [rows, setRows] = useState<Draft[]>(
    initial?.length
      ? [...initial].sort((a, b) => a.views - b.views).map(toDraft)
      : [{ views: "", minDaysLive: "", incrementalPayout: "" }],
  );

  // Sorted by views before accumulating, matching how the backend evaluates
  // tiers — it does not trust author ordering either.
  const computed = useMemo(() => {
    type Entry = { index: number; cumulative: number; milestone: Milestone };

    // Accumulated with reduce rather than a mutable counter in the enclosing
    // scope: the React Compiler treats reassigning a captured variable during
    // render as unsafe, since the closure can outlive the render that made it.
    return rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => Number(a.row.views) - Number(b.row.views))
      .reduce<Entry[]>((entries, { row, index }) => {
        const previous = entries.at(-1)?.cumulative ?? 0;
        const cumulative = previous + (Number(row.incrementalPayout) || 0);

        return [
          ...entries,
          {
            index,
            cumulative,
            milestone: {
              views: Number(row.views) || 0,
              minDaysLive: Number(row.minDaysLive) || 0,
              incrementalPayout: Number(row.incrementalPayout) || 0,
              cumulativePayout: cumulative,
            } satisfies Milestone,
          },
        ];
      }, []);
  }, [rows]);

  const cumulativeByIndex = new Map(
    computed.map((entry) => [entry.index, entry.cumulative]),
  );

  const payload = computed
    .map((entry) => entry.milestone)
    .filter((milestone) => milestone.views > 0);

  const duplicateViews =
    new Set(payload.map((milestone) => milestone.views)).size !== payload.length;

  function update(index: number, field: keyof Draft, value: string) {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Milestones</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setRows((current) => [
              ...current,
              { views: "", minDaysLive: "", incrementalPayout: "" },
            ])
          }
        >
          Add tier
        </Button>
      </div>

      <div className="bg-background rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Views</TableHead>
              <TableHead>Min days live</TableHead>
              <TableHead>Extra payout</TableHead>
              <TableHead className="text-right">Total paid</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    inputMode="numeric"
                    placeholder="10000"
                    value={row.views}
                    onChange={(event) =>
                      update(index, "views", event.target.value)
                    }
                  />
                </TableCell>

                <TableCell>
                  <Input
                    inputMode="numeric"
                    placeholder="3"
                    value={row.minDaysLive}
                    onChange={(event) =>
                      update(index, "minDaysLive", event.target.value)
                    }
                  />
                </TableCell>

                <TableCell>
                  <Input
                    inputMode="numeric"
                    placeholder="100"
                    value={row.incrementalPayout}
                    onChange={(event) =>
                      update(index, "incrementalPayout", event.target.value)
                    }
                  />
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  {formatMoney(cumulativeByIndex.get(index) ?? 0)}
                </TableCell>

                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={rows.length === 1}
                    onClick={() =>
                      setRows((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    ✕
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-muted-foreground text-xs">
        A creator must hit the view target <strong>and</strong>{" "}
        have been live for the minimum days. &ldquo;Total paid&rdquo; is what
        they receive at that tier — it accumulates, and is computed for you.
      </p>

      {duplicateViews ? (
        <p className="text-destructive text-xs">
          Two tiers share the same view target.
        </p>
      ) : null}

      <input type="hidden" name="milestones" value={JSON.stringify(payload)} />
    </div>
  );
}
