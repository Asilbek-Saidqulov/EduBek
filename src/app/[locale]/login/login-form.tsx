/**
 * LoginForm — client component using react-hook-form + zod + shadcn Form.
 *
 * Posts to /api/auth/login. On success calls router.refresh() then
 * redirects to /dashboard. On failure surfaces the API error envelope
 * as field-level or form-level messages.
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mirrors the backend loginBodySchema (see features/auth/auth.schema.ts).
// Re-declared locally so the client bundle doesn't import Prisma-coupled code.
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" })
    .max(254, { message: "Email is too long" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginValues = z.infer<typeof loginSchema>;

interface ApiError {
  code?: string;
  message?: string;
  messageKey?: string;
  issues?: Array<{ path: string; message: string; code?: string }>;
}

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tErr = useTranslations("errors");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "same-origin",
      });
      if (res.ok) {
        // Cookies are set by the API. Refresh the router so middleware
        // picks up the new session, then go to the dashboard.
        router.refresh();
        router.replace("/dashboard");
        return;
      }
      const body = (await res.json().catch(() => null)) as
        | { error?: ApiError }
        | null;
      const err = body?.error;
      if (err?.issues && err.issues.length > 0) {
        // Map API field issues to form errors.
        for (const issue of err.issues) {
          if (issue.path) {
            form.setError(issue.path as keyof LoginValues, {
              type: "server",
              message: issue.message,
            });
          }
        }
        return;
      }
      // Map known error codes to translated messages.
      const code = err?.code ?? "";
      let message: string;
      switch (code) {
        case "UNAUTHORIZED":
        case "INVALID_CREDENTIALS":
          message = tErr("invalidCredentials");
          break;
        case "FORBIDDEN":
          message = tErr("accountBanned");
          break;
        case "RATE_LIMITED":
          message = tErr("rateLimited");
          break;
        default:
          message = err?.message ?? t("login.failed");
      }
      setFormError(message);
    } catch {
      setFormError(t("login.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" aria-hidden />
            <AlertTitle>{tErr("error")}</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("login.emailLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>{t("login.passwordLabel")}</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                >
                  {t("login.forgotLink")}
                </Link>
              </div>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={submitting} className="mt-2 w-full">
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("login.submitting")}
            </>
          ) : (
            t("login.submit")
          )}
        </Button>
      </form>
    </Form>
  );
}
