import { useState, useCallback } from "react";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import WhatIsPantacal from "@/components/WhatIsPantacal";
import ProductSection, { VariantData } from "@/components/ProductSection";
import BenefitsScroller from "@/components/BenefitsScroller";
import IngredientsSection from "@/components/IngredientsSection";
import BottomBanner from "@/components/BottomBanner";
import FAQSection from "@/components/FAQSection";
import ReviewsSection from "@/components/ReviewsSection";
import YouTubeSection from "@/components/YouTubeSection";
import StickyBuyBar from "@/components/StickyBuyBar";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  const [productState, setProductState] = useState({ variantIndex: 0, quantity: 1 });
  const [variants, setVariants] = useState<VariantData[]>([]);

  const handleProductStateChange = useCallback((state: { variantIndex: number; quantity: number }) => {
    setProductState(state);
  }, []);

  const handleVariantsLoaded = useCallback((v: VariantData[]) => {
    setVariants(v);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroBanner />
        <WhatIsPantacal />
        <ProductSection onStateChange={handleProductStateChange} onVariantsLoaded={handleVariantsLoaded} />
        <BenefitsScroller />
        <IngredientsSection />
        <BottomBanner />
        <FAQSection />
        <YouTubeSection />
        <ReviewsSection />
      </main>
      <footer className="bg-muted py-6 text-center text-sm text-muted-foreground pb-20 md:pb-6">
        <p>Nutrix Health Care</p>
      </footer>
      <StickyBuyBar variantIndex={productState.variantIndex} quantity={productState.quantity} variants={variants.length > 0 ? variants : undefined} />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
