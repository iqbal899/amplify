"use client";

import { useActionState } from "react";

import { login, type ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    login,
    null,
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Amplify Admin</CardTitle>
        <CardDescription>
          Campaign and payout operations. Sign in with the admin password.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Admin password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>

          {state && "error" in state ? (
            <p aria-live="polite" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
