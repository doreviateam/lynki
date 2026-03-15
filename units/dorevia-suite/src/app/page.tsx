import { Background } from "@/components/background";
import { BenefitsSection } from "@/components/blocks/benefits-section";
import { DifferentiationSection } from "@/components/blocks/differentiation-section";
import { Hero } from "@/components/blocks/hero";
import { HowItWorks } from "@/components/blocks/how-it-works";
import { ProblemSection } from "@/components/blocks/problem-section";
import { PromiseSection } from "@/components/blocks/promise-section";
import { ReassuranceStrip } from "@/components/blocks/reassurance-strip";
import { VoyezDoreviaSection } from "@/components/blocks/voyez-dorevia-section";

export default function Home() {
  return (
    <>
      <Background className="via-muted to-muted/80">
        <Hero />
        <ReassuranceStrip />
        <ProblemSection />
        <PromiseSection />
        <BenefitsSection />
        <DifferentiationSection />
        <HowItWorks />
        <VoyezDoreviaSection />
      </Background>
    </>
  );
}
