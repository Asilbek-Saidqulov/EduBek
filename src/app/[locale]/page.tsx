import { setRequestLocale } from "next-intl/server";

import { LandingHeader } from "@/components/edubek/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { EcosystemSection } from "@/components/landing/ecosystem-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { ProductShowcaseSection } from "@/components/landing/product-showcase-section";
import { QuizFocusSection } from "@/components/landing/quiz-focus-section";
import { KnowledgeDiscoverySection } from "@/components/landing/knowledge-discovery-section";
import { AiContextualSection } from "@/components/landing/ai-contextual-section";
import { RoleSwitcherSection } from "@/components/landing/role-switcher-section";
import { MarketplacePreviewSection } from "@/components/landing/marketplace-preview-section";
import { PlatformTruthSection } from "@/components/landing/platform-truth-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export const dynamic = "force-dynamic";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Universal Navigation Header */}
      <LandingHeader />

      {/* Main Narrative Flow */}
      <main className="flex-1 flex flex-col">
        {/* 1. Hero: Where learning connects */}
        <HeroSection />

        {/* 2. Connected Product Ecosystem */}
        <EcosystemSection />

        {/* 3. How It Works: The Continuous Learning Loop */}
        <HowItWorksSection />

        {/* 4. Interactive Product Showcase */}
        <ProductShowcaseSection />

        {/* 5. Deep-Dive: Interactive Quizzes & Arena Modes */}
        <QuizFocusSection />

        {/* 6. Deep-Dive: Structured Knowledge Discovery */}
        <KnowledgeDiscoverySection />

        {/* 7. Deep-Dive: Contextual AI (Where it actually helps) */}
        <AiContextualSection />

        {/* 8. Tailored Audiences: Role Switcher (Student / Teacher / Creator) */}
        <RoleSwitcherSection />

        {/* 9. Verified Educational Marketplace */}
        <MarketplacePreviewSection />

        {/* 10. Platform Architecture & Truthful Highlights */}
        <PlatformTruthSection />

        {/* 11. Grounded Final CTA */}
        <FinalCtaSection />
      </main>

      {/* Semantic Footer */}
      <LandingFooter />
    </div>
  );
}

