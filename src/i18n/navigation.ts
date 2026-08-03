/**
 * EduBek — i18n navigation helpers.
 *
 * These wrappers from next-intl handle locale-prefixed routing.
 * Use them instead of the raw `next/navigation` equivalents:
 *
 *   import { Link, useRouter, usePathname, redirect } from "@/i18n/navigation"
 *
 * `usePathname()` returns the pathname WITHOUT the locale prefix,
 * so it can be used to swap locales while preserving the current page.
 */
import { createNavigation } from "next-intl/navigation"
import { routing } from "./routing"

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
