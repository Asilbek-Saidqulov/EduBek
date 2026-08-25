/**
 * RegisterForm — name + email + password + confirm form.
 *
 * Posts to /api/auth/register. On success calls router.refresh() then
 * redirects to /dashboard.
 */
"use client";

import * as React from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
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

// Mirrors the backend registerBodySchema (see features/auth/auth.schema.ts).
const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Name must be at least 2 characters" })
      .max(100, { message: "Name is too long" }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, { message: "Email is required" })
      .email({ message: "Invalid email address" })
      .max(254, { message: "Email is too long" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(128, { message: "Password is too long" })
      .regex(/[A-Z]/, {
        message: "Password must contain an uppercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain a digit" }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });


type RegisterValues = z.infer<typeof registerSchema>;

interface ApiError {
  code?: string;
  message?: string;
  issues?: Array<{ path: string; message: string }>;
}

export function RegisterForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth");
  const tErr = useTranslations("errors");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // The schema includes `confirmPassword` which the API doesn't want —
  // strip it before sending.
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          // The page's own locale (e.g. "/uz/register" → "uz") so the
          // account is created with the language the user actually
          // registered in, instead of always defaulting server-side.
          locale,
        }),
        credentials: "same-origin",
      });
      if (res.ok) {
        // The API sets the session cookie. Refresh so middleware sees
        // it, then go to the dashboard.
        router.refresh();
        router.replace("/dashboard");
        return;
      }
      const body = (await res.json().catch(() => null)) as
        | { error?: ApiError }
        | null;
      const err = body?.error;
      if (err?.issues && err.issues.length > 0) {
        for (const issue of err.issues) {
          if (issue.path) {
            form.setError(
              (issue.path === "password" || issue.path === "confirmPassword"
                ? issue.path
                : issue.path) as keyof RegisterValues,
              { type: "server", message: issue.message },
            );
          }
        }
        return;
      }
      const code = err?.code ?? "";
      let message: string;
      switch (code) {
        case "CONFLICT":
          message = tErr("alreadyExists");
          break;
        case "RATE_LIMITED":
          message = tErr("rateLimited");
          break;
        default:
          message = err?.message ?? t("register.failed");
      }
      setFormError(message);
    } catch {
      setFormError(t("register.networkError"));
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("register.nameLabel")}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  placeholder="Your name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("register.emailLabel")}</FormLabel>
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
              <FormLabel>{t("register.passwordLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                {t("register.passwordHint")}
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("register.confirmLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
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
              {t("register.submitting")}
            </>
          ) : (
            t("register.submit")
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {t("register.termsNotice")}
        </p>
      </form>
    </Form>
  );
}
