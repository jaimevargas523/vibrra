import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Steps } from "@/components/sections/Steps";
import { Mechanics } from "@/components/sections/Mechanics";
import { Calculator } from "@/components/sections/Calculator";
import { Host } from "@/components/sections/Host";
import { ClientSection } from "@/components/sections/ClientSection";
import { MapTeaser } from "@/components/sections/MapTeaser";
import { CtaHost } from "@/components/sections/CtaHost";
import { Access } from "@/components/sections/Access";
import { Footer } from "@/components/layout/Footer";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Steps />
        <Mechanics />
        <Calculator />
        <Host />
        <ClientSection />
        <MapTeaser />
        <CtaHost />
        <Access />
      </main>
      <Footer />
    </>
  );
}
