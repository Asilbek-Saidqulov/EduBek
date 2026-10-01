"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, AlertCircle } from "lucide-react";
import { GoogleAuthButton } from "@/components/edubek/google-auth-button";
import { AuthPanda } from "@/components/edubek/auth-panda";
import type { PandaMood } from "@/components/edubek/panda-mascot";

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
  const [focus, setFocus] = React.useState<"email" | "password" | null>(null);
  const [badField, setBadField] = React.useState<"email" | "password" | null>(null);

  React.useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) setFormError("Google sign-in was cancelled or is not configured yet.");
  }, []);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });
  const email = form.watch("email");
  const emailLooksWrong = email.length > 3 && !email.includes("@");

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    setBadField(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "same-origin",
      });
      if (res.ok) {
        setBadField(null);
        router.refresh();
        router.replace("/dashboard");
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: ApiError } | null;
      const err = body?.error;
      if (err?.issues && err.issues.length > 0) {
        for (const issue of err.issues) {
          if (issue.path) {
            form.setError(issue.path as keyof LoginValues, { type: "server", message: issue.message });
            if (issue.path === "email" || issue.path === "password") setBadField(issue.path);
          }
        }
        return;
      }
      const code = err?.code ?? "";
      let message: string;
      switch (code) {
        case "UNAUTHORIZED":
        case "INVALID_CREDENTIALS":
          message = tErr("invalidCredentials");
          setBadField("password");
          break;
        case "FORBIDDEN":
          message = tErr("accountBanned");
          setBadField("email");
          break;
        case "RATE_LIMITED":
          message = tErr("rateLimited");
          break;
        default:
          message = err?.message ?? t("login.failed");
          setBadField("password");
      }
      setFormError(message);
    } catch {
      setFormError(t("login.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  const mood: PandaMood = badField || emailLooksWrong || formError ? "worry" : submitting ? "cheer" : "idle";
  const note = badField === "email" || emailLooksWrong
    ? "Email?"
    : badField === "password" || formError
      ? "Hmm"
      : focus === "password"
        ? "..."
        : focus === "email"
          ? "Salom"
          : "";

  return (
    <>
      <AuthPanda mood={mood} note={note} cover={focus === "password" && !badField} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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
                    onFocus={() => setFocus("email")}
                    onBlur={() => setFocus(null)}
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
                  <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                    {t("login.forgotLink")}
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...field}
                    onFocus={() => setFocus("password")}
                    onBlur={() => setFocus(null)}
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

          <div className="relative my-1 text-center text-xs text-muted-foreground">
            <span className="bg-background px-2">or</span>
          </div>
          <GoogleAuthButton label="Continue with Google" />
        </form>
      </Form>
    </>
  );
}
