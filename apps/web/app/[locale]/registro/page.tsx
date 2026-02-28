import { setRequestLocale } from "next-intl/server";
import { RegistroWizard } from "@/components/registro/RegistroWizard";

export default async function RegistroPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RegistroWizard />;
}
