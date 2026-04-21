import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, X, Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const fallbackThumbnails = [
  { src: "/images/bottle.webp", alt: "Pantacal Bottle" },
  { src: "/images/pantacal-1.webp", alt: "Pantacal Side View" },
  { src: "/images/pantacal-2.webp", alt: "Pantacal Back" },
  { src: "/images/pantacal-5.webp", alt: "Pantacal Details" },
  { src: "/images/pantacal-3.webp", alt: "Pantacal Info" },
  { src: "/images/pantacal-4.webp", alt: "Pantacal Label" },
  { src: "/images/bundle.webp", alt: "Bone Support Bundle" },
  { src: "/images/bundle-01.webp", alt: "Winter Bundle" },
];

const fallbackVariants = [
  { name: "Pack 1 (30 Tablets)", price: 1120, img: "/images/bottle.webp" },
  { name: "Bone Support Bundle", price: 3000, img: "/images/bundle.webp" },
  { name: "Winter Bundle", price: 2470, img: "/images/bundle-01.webp" },
];

const fallbackBenefits = [
  "Pantacal — Pakistan's trusted choice for bone strength.",
  "Advanced complex with Calcium, Vitamin D3, K2, Magnesium, and Zinc.",
  "Builds and maintains dense, strong bones and teeth.",
  "D3 & K2 maximize Calcium absorption into bones.",
  "Fortifies your body's natural immune defenses.",
  "Helps protect against bone loss and osteoporosis.",
  "Ideal for complete skeletal and muscular support.",
];

export interface VariantData {
  name: string;
  price: number;
  img: string;
}

interface ProductSectionProps {
  onStateChange?: (state: { variantIndex: number; quantity: number }) => void;
  onVariantsLoaded?: (variants: VariantData[]) => void;
}

const ProductSection = ({ onStateChange, onVariantsLoaded }: ProductSectionProps) => {
  const [thumbnails, setThumbnails] = useState(fallbackThumbnails);
  const [variants, setVariants] = useState<VariantData[]>(fallbackVariants);
  const [benefits, setBenefits] = useState(fallbackBenefits);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewStats, setReviewStats] = useState({ avg: 0, count: 0 });
  const navigate = useNavigate();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const initialDistance = useRef(0);
  const initialScale = useRef(1);
  const lastTouchCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const PRODUCT_ID = "00000000-0000-0000-0000-000000000001";
      const [imgRes, varRes, benRes, revRes] = await Promise.all([
        supabase.from("product_images").select("src, alt").eq("product_id", PRODUCT_ID).order("sort_order"),
        supabase.from("product_variants").select("name, price, image_url").eq("product_id", PRODUCT_ID).order("sort_order"),
        supabase.from("product_benefits").select("text").eq("product_id", PRODUCT_ID).order("sort_order"),
        supabase.from("reviews").select("rating"),
      ]);
      if (imgRes.data?.length) setThumbnails(imgRes.data.map(i => ({ src: i.src, alt: i.alt })));
      if (varRes.data?.length) {
        const v = varRes.data.map(vr => ({ name: vr.name, price: vr.price, img: vr.image_url }));
        setVariants(v);
        onVariantsLoaded?.(v);
      }
      if (benRes.data?.length) setBenefits(benRes.data.map(b => b.text));
      if (revRes.data?.length) {
        const avg = revRes.data.reduce((s, r) => s + r.rating, 0) / revRes.data.length;
        setReviewStats({ avg: Math.round(avg * 10) / 10, count: revRes.data.length });
      }
    };
    load();
  }, []);

  useEffect(() => {
    thumbnails.forEach(t => { const img = new Image(); img.src = t.src; });
  }, [thumbnails]);

  useEffect(() => {
    onStateChange?.({ variantIndex: selectedVariant, quantity });
  }, [selectedVariant, quantity, onStateChange]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbStripRef.current) {
      const activeBtn = thumbStripRef.current.children[selectedImage] as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [selectedImage]);

  const handleBuyNow = () => {
    const total = variants[selectedVariant].price * quantity;
    navigate("/checkout", {
      state: {
        variant: variants[selectedVariant].name,
        quantity,
        unitPrice: variants[selectedVariant].price,
        price: `Rs.${total.toLocaleString()}`,
      },
    });
  };

  const prevImage = () => { resetZoom(); setSelectedImage(p => (p === 0 ? thumbnails.length - 1 : p - 1)); };
  const nextImage = () => { resetZoom(); setSelectedImage(p => (p === thumbnails.length - 1 ? 0 : p + 1)); };

  const resetZoom = useCallback(() => { setScale(1); setTranslateX(0); setTranslateY(0); }, []);

  const getDistance = (t1: React.Touch, t2: React.Touch) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinching.current = true;
      initialDistance.current = getDistance(e.touches[0], e.touches[1]);
      initialScale.current = scale;
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      e.preventDefault();
    } else if (e.touches.length === 1 && scale <= 1) {
      touchStartX.current = e.changedTouches[0].screenX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = getDistance(e.touches[0], e.touches[1]);
      const newScale = Math.min(4, Math.max(1, initialScale.current * (dist / initialDistance.current)));
      setScale(newScale);

      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      setTranslateX(prev => prev + (center.x - lastTouchCenter.current.x));
      setTranslateY(prev => prev + (center.y - lastTouchCenter.current.y));
      lastTouchCenter.current = center;
      e.preventDefault();
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan when zoomed
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, opensLightbox = false) => {
    if (isPinching.current) {
      isPinching.current = false;
      if (scale <= 1.1) resetZoom();
      return;
    }
    if (scale > 1) return; // Don't swipe when zoomed
    touchEndX.current = e.changedTouches[0].screenX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 30) {
      diff > 0 ? nextImage() : prevImage();
    } else if (opensLightbox) {
      // Treat as tap → open lightbox
      resetZoom();
      setLightboxOpen(true);
    }
  };

  const scrollToReviews = () => {
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-8 md:py-12 bg-section-light" id="product">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div>
            <div
              ref={imageContainerRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, true)}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                resetZoom();
                setLightboxOpen(true);
              }}
              onDoubleClick={resetZoom}
              className="relative bg-card rounded-xl overflow-hidden mb-3 aspect-square select-none touch-pan-y cursor-zoom-in"
            >
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-background" aria-label="Previous image">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              {/* All images stacked, only selected visible — instant swap */}
              {thumbnails.map((thumb, i) => (
                <img
                  key={i}
                  src={thumb.src}
                  alt={thumb.alt}
                  loading="eager"
                  decoding="async"
                  className={`absolute inset-0 w-full h-full object-contain p-4 ${i === selectedImage ? "opacity-100 z-[1]" : "opacity-0 z-0"}`}
                  style={{
                    willChange: "opacity, transform",
                    transform: i === selectedImage ? `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)` : undefined,
                  }}
                />
              ))}
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-background" aria-label="Next image">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
              <button onClick={() => { resetZoom(); setLightboxOpen(true); }} className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-background" aria-label="Open fullscreen">
                <Maximize2 className="w-4 h-4 text-foreground" />
              </button>
              {scale > 1 && (
                <button onClick={resetZoom} className="absolute bottom-2 right-2 z-10 px-2 py-1 rounded-md bg-background/80 border border-border text-xs text-foreground">
                  Reset zoom
                </button>
              )}
            </div>
            {/* Thumbnail strip */}
            <div ref={thumbStripRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {thumbnails.map((thumb, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-14 h-14 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 ${
                    selectedImage === i ? "border-primary ring-2 ring-primary/30" : "border-border"
                  }`}
                >
                  <img src={thumb.src} alt={thumb.alt} loading="eager" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary mb-1">
              Pantacal (Pakistan's No. 1 Bone Health Tablets)
            </h2>
            <p className="text-muted-foreground mb-2">(750mg Tablet)</p>

            {reviewStats.count > 0 && (
              <button onClick={scrollToReviews} className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(reviewStats.avg) ? "fill-yellow-400 text-yellow-400" : "text-border"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {reviewStats.avg} ({reviewStats.count} reviews)
                </span>
              </button>
            )}

            <p className="text-2xl md:text-3xl font-bold text-brand-price mb-6">
              Rs.{(variants[selectedVariant].price * quantity).toLocaleString()}
            </p>

            <h3 className="font-semibold text-foreground mb-3">Benefits:</h3>
            <ul className="space-y-2 mb-6">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-brand-green mt-0.5">✓</span>
                  {b}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4 mb-6">
              <span className="font-medium text-foreground">Quantity:</span>
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 bg-muted hover:bg-border transition-colors text-foreground">−</button>
                <span className="px-4 py-2 text-foreground font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 bg-muted hover:bg-border transition-colors text-foreground">+</button>
              </div>
            </div>

            <p className="font-medium text-foreground mb-3">Select Your Variant</p>
            <div className="space-y-3 mb-6">
              {variants.map((v, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedVariant(i)}
                  className={`w-full flex items-center gap-4 p-3 rounded-lg border-2 transition-all ${
                    selectedVariant === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <img src={v.img} alt={v.name} className="w-14 h-14 object-contain rounded" />
                  <span className="font-medium text-foreground flex-1 text-left">{v.name}</span>
                  <span className="font-bold text-brand-price">Rs.{v.price.toLocaleString()}</span>
                </button>
              ))}
            </div>

            <button onClick={handleBuyNow} className="buy-now-btn w-full">Buy Now</button>
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={resetZoom}
        >
          <button
            onClick={() => { resetZoom(); setLightboxOpen(false); }}
            className="absolute top-4 right-4 z-[110] w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={prevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-[110] w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-[110] w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
          <div className="relative w-full h-full flex items-center justify-center select-none touch-pan-y">
            {thumbnails.map((thumb, i) => (
              <img
                key={i}
                src={thumb.src}
                alt={thumb.alt}
                loading="eager"
                decoding="async"
                className={`absolute inset-0 m-auto max-w-full max-h-full object-contain ${i === selectedImage ? "opacity-100 z-[1]" : "opacity-0 z-0"}`}
                style={{
                  willChange: "opacity, transform",
                  transform: i === selectedImage ? `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)` : undefined,
                }}
              />
            ))}
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[110] flex gap-1.5">
            {thumbnails.map((_, i) => (
              <button
                key={i}
                onClick={() => { resetZoom(); setSelectedImage(i); }}
                className={`w-2 h-2 rounded-full ${i === selectedImage ? "bg-white" : "bg-white/40"}`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductSection;
