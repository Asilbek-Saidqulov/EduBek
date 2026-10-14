import { setRequestLocale } from "next-intl/server";
import { FriendsView } from "./view";

export default async function FriendsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FriendsView />;
}
