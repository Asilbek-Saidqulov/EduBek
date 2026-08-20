/**
 * Profile page — public-facing user card.
 *
 * GET /api/auth/me → current user's UserDto.
 * PATCH /api/auth/me → update name, bio, country, avatarUrl, username.
 * POST /api/auth/locale → change locale (already used by LanguageSwitcher).
 *
 * The page has two parts:
 *   1. Read-only "public card" view (avatar, name, role badge, bio, stats)
 *   2. Inline "Edit profile" form (react-hook-form + zod + shadcn Form)
 *      posts to PATCH /api/auth/me.
 *
 * Achievements + cosmetics are stubbed (Phase 6G.7 cosmetics-platform is
 * in-memory; the achievements catalog is huge but has no public read API).
 */
"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  BadgeCheck,
  Calendar,
  Globe,
  Loader2,
  Mail,
  Pencil,
  Save,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { api, ApiError } from "@/lib/api-client";
import { useCurrentUser, type CurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the backend updateProfileBodySchema.
const profileSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100, { message: "Name is too long" }),
  username: z
    .string()
    .trim()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(32, { message: "Username is too long" })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username may only contain letters, digits, and underscores",
    })
    .optional()
    .or(z.literal("")),
  bio: z.string().max(500, { message: "Bio is too long" }).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  avatarUrl: z
    .string()
    .url({ message: "Avatar URL must be a valid URL" })
    .max(2_000)
    .optional()
    .or(z.literal("")),
});
type ProfileValues = z.infer<typeof profileSchema>;

function roleAccent(role: string): { label: string; className: string } {
  switch (role) {
    case "superadmin":
    case "admin":
      return { label: role, className: "bg-admin/10 text-admin border-admin/30" };
    case "moderator":
      return { label: role, className: "bg-admin/10 text-admin border-admin/30" };
    case "creator":
      return { label: role, className: "bg-creator/10 text-creator border-creator/30" };
    case "teacher":
      return { label: role, className: "bg-teacher/10 text-teacher border-teacher/30" };
    default:
      return { label: "student", className: "bg-student/10 text-student border-student/30" };
  }
}

export function ProfileView() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tErr = useTranslations("errors");
  const { user, isLoading } = useCurrentUser();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState(false);

  if (isLoading) return <ProfileSkeleton />;
  if (!user) return null;

  const role = user.platformRoles[0] ?? "user";
  const accent = roleAccent(role);
  const initials = (user.name ?? user.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Public card */}
      <Card className="overflow-hidden border-border/60">
        <div className="h-1.5 w-full bg-gradient-to-r from-teacher via-ai to-creator" />
        <CardContent className="p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar className="size-20">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name ?? user.email} className="size-full object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-teacher to-ai text-xl font-bold text-teacher-foreground">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {user.name ?? user.username ?? user.email}
                </h1>
                <Badge variant="outline" className={accent.className}>
                  {accent.label}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {user.username && (
                  <span className="flex items-center gap-1">
                    <BadgeCheck className="size-3.5" aria-hidden />
                    @{user.username}
                  </span>
                )}
                {user.country && (
                  <span className="flex items-center gap-1">
                    <Globe className="size-3.5" aria-hidden />
                    {user.country}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" aria-hidden />
                  {t("joined")} {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="size-4" aria-hidden />
                {t("edit")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      {editing && (
        <EditProfileForm
          user={user}
          onClose={() => setEditing(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["auth", "me"] });
            toast({ title: tCommon("success"), description: t("updated") });
          }}
          onError={(err: ApiError) => {
            toast({ title: tErr("error"), description: err.message, variant: "destructive" });
          }}
        />
      )}

      {/* Roles & permissions summary */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm">{t("roles")}</CardTitle>
          <CardDescription>{t("rolesDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {user.platformRoles.map((r) => (
              <Badge key={r} variant="outline" className={roleAccent(r).className}>
                <ShieldCheck className="me-1 size-3" aria-hidden />
                {r}
              </Badge>
            ))}
            {user.platformRoles.length === 0 && (
              <Badge variant="secondary">{t("defaultRole")}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievements stub */}
      <Card className="border-dashed border-border/60 bg-card/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-ai" aria-hidden />
            <CardTitle className="text-sm">{t("achievements")}</CardTitle>
          </div>
          <CardDescription>{t("achievementsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("achievementsEmpty")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function EditProfileForm({
  user,
  onClose,
  onSuccess,
  onError,
}: {
  user: CurrentUser;
  onClose: () => void;
  onSuccess: () => void;
  onError: (err: ApiError) => void;
}) {
  const t = useTranslations("profile");
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name ?? "",
      username: user.username ?? "",
      bio: user.bio ?? "",
      country: user.country ?? "",
      avatarUrl: user.avatarUrl ?? "",
    },
    mode: "onSubmit",
  });

  const mut = useMutation({
    mutationFn: (values: ProfileValues) => {
      // Strip empty strings → undefined so the API doesn't try to set them.
      const body: Record<string, string | undefined> = { name: values.name };
      if (values.username) body.username = values.username;
      if (values.bio) body.bio = values.bio;
      if (values.country) body.country = values.country;
      if (values.avatarUrl) body.avatarUrl = values.avatarUrl;
      return api.patch<{ user: CurrentUser }>("/api/auth/me", body);
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (err: ApiError) => onError(err),
  });

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t("editProfile")}</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => { form.reset(); onClose(); }} aria-label={t("cancel")}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nameLabel")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("usernameLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="learn_with_me" />
                    </FormControl>
                    <FormDescription>{t("usernameHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("countryLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Uzbekistan" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bioLabel")}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} placeholder={t("bioPlaceholder")} />
                  </FormControl>
                  <FormDescription>{t("bioHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("avatarUrlLabel")}</FormLabel>
                  <FormControl>
                    <Input type="url" {...field} placeholder="https://…" />
                  </FormControl>
                  <FormDescription>{t("avatarUrlHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { form.reset(); onClose(); }}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={mut.isPending}>
                {mut.isPending ? (
                  <><Loader2 className="size-4 animate-spin" aria-hidden /> {t("saving")}</>
                ) : (
                  <><Save className="size-4" aria-hidden /> {t("save")}</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

// silence unused imports
void Mail;
