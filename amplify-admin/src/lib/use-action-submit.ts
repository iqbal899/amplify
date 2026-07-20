"use client";

import { useTransition } from "react";
import { toast } from "sonner";

export type ActionResult = { error: string } | { ok: string } | null;

type Action = (
  previous: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

/**
 * Runs a server action from a form and reports the result as a toast.
 *
 * Deliberately not `useActionState` + `useEffect`: reacting to the returned
 * state object means the toast fires on state identity rather than on the
 * submission itself, and closing a dialog from an effect is a setState-during-
 * render hazard the React Compiler lint rejects. Awaiting the action inside a
 * transition gives one toast per submit and an unambiguous success callback.
 */
export function useActionSubmit(action: Action, onSuccess?: () => void) {
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await action(null, formData);

      if (!result) return;

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(result.ok);
      onSuccess?.();
    });
  }

  return { submit, pending };
}
