import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const benefits = [
  { src: "/images/benefit-1.webp", alt: "Makes Bones Stronger and Durable" },
  { src: "/images/benefit-2.webp", alt: "Helps Your Body Use Calcium Better" },
  { src: "/images/benefit-3.webp", alt: "Supports Strong, Active Muscles" },
];

const BenefitsScroller = () => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);

  const prev = () => setCurrent((c) => (c === 0 ? benefits.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === benefits.length - 1 ? 0 : c + 1));

  return (
    <section className="py-8 bg-card">
      <div className="container mx-auto px-4">
        <div
          className="relative w-full"
          onTouchStart={e => { touchStartX.current = e.changedTouches[0].screenX; }}
          onTouchEnd={e => {
            const diff = touchStartX.current - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 30) diff > 0 ? next() : prev();
          }}
        >
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-background shadow-md"
            aria-label="Previous benefit"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          {/* All images stacked, instant swap */}
          <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] md:aspect-[16/9] overflow-hidden rounded-xl bg-background">
            {benefits.map((b, i) => (
              <img
                key={i}
                src={b.src}
                alt={b.alt}
                loading="eager"
                decoding="async"
                className={`absolute inset-0 w-full h-full object-contain ${i === current ? "opacity-100 z-[1]" : "opacity-0 z-0"}`}
                style={{ willChange: "opacity" }}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-background shadow-md"
            aria-label="Next benefit"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {benefits.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full ${
                  i === current ? "bg-primary" : "bg-border"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsScroller;
