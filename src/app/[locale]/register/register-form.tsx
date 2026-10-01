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
import { GoogleAuthButton } from "@/components/edubek/google-auth-button";
import { AuthPanda } from "@/components/edubek/auth-panda";
import type { PandaMood } from "@/components/edubek/panda-mascot";

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
    role: z.enum(["student", "teacher"]),
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
  const [focus, setFocus] = React.useState<string | null>(null);
  const [badField, setBadField] = React.useState<string | null>(null);

  // The schema includes `confirmPassword` which the API doesn't want —
  // strip it before sending.
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", role: "student" },
    mode: "onSubmit",
  });
  const email = form.watch("email");
  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");
  const emailLooksWrong = email.length > 3 && !email.includes("@");
  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

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
          role: values.role,
          locale,
        }),
        credentials: "same-origin",
      });
      if (res.ok) {
        setBadField(null);
        router.refresh();
        if (values.role === "teacher") {
          router.replace("/classrooms?first=1");
        } else {
          router.replace("/live-quiz?tab=discover&first=1");
        }
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
            setBadField(issue.path);
          }
        }
        return;
      }
      const code = err?.code ?? "";
      let message: string;
      switch (code) {
        case "CONFLICT":
          message = tErr("alreadyExists");
          setBadField("email");
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

  const mood: PandaMood = formError || badField || emailLooksWrong || mismatch ? "worry" : submitting ? "cheer" : "idle";
  const note = emailLooksWrong || badField === "email"
    ? "Email?"
    : mismatch || badField === "confirmPassword"
      ? "Mos emas"
      : formError || badField
        ? "Hmm"
        : focus === "name"
          ? "Salom"
          : focus
            ? "..."
            : "";

  return (
    <>
      <AuthPanda mood={mood} note={note} cover={focus === "password" || focus === "confirmPassword"} />
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
                  onFocus={() => setFocus("name")}
                  onBlur={() => setFocus(null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("register.roleLabel")}</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`rounded-xl border p-3 text-left ${field.value === "student" ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => field.onChange("student")}
                >
                  <div className="font-medium">{t("register.roleStudent")}</div>
                  <div className="text-xs text-muted-foreground">{t("register.roleStudentHint")}</div>
                </button>
                <button
                  type="button"
                  className={`rounded-xl border p-3 text-left ${field.value === "teacher" ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => field.onChange("teacher")}
                >
                  <div className="font-medium">{t("register.roleTeacher")}</div>
                  <div className="text-xs text-muted-foreground">{t("register.roleTeacherHint")}</div>
                </button>
              </div>
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
              <FormLabel>{t("register.passwordLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...field}
                  onFocus={() => setFocus("password")}
                  onBlur={() => setFocus(null)}
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
                  onFocus={() => setFocus("confirmPassword")}
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
              {t("register.submitting")}
            </>
          ) : (
            t("register.submit")
          )}
        </Button>

        <div className="relative my-1 text-center text-xs text-muted-foreground">
          <span className="bg-background px-2">or</span>
        </div>
        <GoogleAuthButton label="Continue with Google" />

        <p className="text-center text-xs text-muted-foreground">
          {t("register.termsNotice")}
        </p>
      </form>
    </Form>
    </>
  );
}
