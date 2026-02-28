import { setRequestLocale } from "next-intl/server";
import { RecargaClient } from "@/components/recarga/RecargaClient";

export default async function RecargaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecargaClient />;
}
