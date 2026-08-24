/**
 * 404 fallback for the [locale] segment.
 *
 * Visiting any non-existent path under /{locale}/… shows this page
 * (e.g. /en/dashboard/missing-route, /en/whatever).
 */
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Compass, Home, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 inline-flex size-14 items-center justify-center rounded-full bg-teacher/10 text-teacher">
          <Compass className="size-7" aria-hidden />
        </div>
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          404
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("notFoundTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("notFoundBody")}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link href="/">
              <Home className="size-4" aria-hidden />
              {t("backHome")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">
              <LogIn className="size-4" aria-hidden />
              {t("goLogin")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
