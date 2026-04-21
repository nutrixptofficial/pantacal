import { useState, useEffect, useRef, useCallback } from "react";
import { Star, Camera, ChevronLeft, ChevronRight, Send, X, ImagePlus, ZoomIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  text: string;
  verified: boolean;
  images: string[];
  created_at: string;
  visible?: boolean;
}

const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} style={{ width: size, height: size }} className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-border"} />
    ))}
  </div>
);

const InteractiveStarRating = ({ rating, onRate, size = 28 }: { rating: number; onRate: (r: number) => void; size?: number }) => (
  <div className="flex gap-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <button key={i} type="button" onClick={() => onRate(i + 1)} className="hover:scale-110 transition-transform">
        <Star style={{ width: size, height: size }} className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-border hover:text-yellow-300"} />
      </button>
    ))}
  </div>
);

const seedReviews: Review[] = [
  { id: "s1", reviewer_name: "Madiha Farooq", rating: 5, text: "affordable price mein itne saare nutrients mil rahe hain, calcium d3 k2 sab ek jagah. worth it", verified: true, images: [], created_at: "2026-03-10T00:00:00Z" },
  { id: "s2", reviewer_name: "Kamran Yousaf", rating: 5, text: "Meri wife ko joint pain tha, maine order kiya unke liye. 3 hafton mein clearly better hai wo ab", verified: true, images: [], created_at: "2026-03-10T00:00:00Z" },
  { id: "s3", reviewer_name: "Asghar Ali", rating: 5, text: "tried a few calcium supplements before but this one actually works, no stomach issues either", verified: true, images: [], created_at: "2026-03-10T00:00:00Z" },
  { id: "s4", reviewer_name: "Shahnaz Begum", rating: 5, text: "Roz khane ke saath leti hoon, kamar dard pehle se kafi kam hai. Acha product hai", verified: true, images: [], created_at: "2026-03-10T00:00:00Z" },
  { id: "s5", reviewer_name: "Rubina", rating: 4, text: "Kamar dard se bohat pareshan thi, doctor ne calcium supplement lene ko kaha. Pantacal try ki aur 3 hafte mein fark feel hua", verified: true, images: [], created_at: "2026-03-10T00:00:00Z" },
  { id: "s6", reviewer_name: "Huma Shafiq", rating: 5, text: "Maine apne abbu ke liye order kiya tha, Mashallah 1 mahine mein hi better feel ho raha hai", verified: true, images: [], created_at: "2026-03-09T00:00:00Z" },
];

/* ─── Lightbox component ─── */
const ImageLightbox = ({ images, currentIndex, onClose, onNavigate }: {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (idx: number) => void;
}) => (
  <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={onClose}>
    <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
      <X className="w-6 h-6" />
    </button>
    <div className="relative max-w-[90vw] max-h-[90vh] flex items-center" onClick={e => e.stopPropagation()}>
      {images.length > 1 && (
        <button onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)} className="absolute -left-12 md:left-2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      <img src={images[currentIndex]} alt="" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
      {images.length > 1 && (
        <button onClick={() => onNavigate((currentIndex + 1) % images.length)} className="absolute -right-12 md:right-2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
    {images.length > 1 && (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button key={i} onClick={e => { e.stopPropagation(); onNavigate(i); }} className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentIndex ? "bg-white scale-125" : "bg-white/40"}`} />
        ))}
      </div>
    )}
  </div>
);

const ReviewsSection = () => {
  const [reviews, setReviews] = useState<Review[]>(seedReviews);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState("");
  const [formImages, setFormImages] = useState<File[]>([]);
  const [formImagePreviews, setFormImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase.from("reviews").select("*").eq("visible", true).order("created_at", { ascending: false });
      if (data && data.length > 0) {
        setReviews(data.map(r => ({ ...r, images: r.images || [] })));
      }
    };
    fetchReviews();
  }, []);

  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    autoSlideRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % reviews.length);
    }, 4000);
  }, [reviews.length]);

  useEffect(() => {
    if (lightbox) {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
      return;
    }
    startAutoSlide();
    return () => { if (autoSlideRef.current) clearInterval(autoSlideRef.current); };
  }, [startAutoSlide, lightbox]);

  const goToSlide = (idx: number) => { setCurrentSlide(idx); startAutoSlide(); };
  const nextSlide = () => goToSlide((currentSlide + 1) % reviews.length);
  const prevSlide = () => goToSlide((currentSlide - 1 + reviews.length) % reviews.length);

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 3 - formImages.length);
    const previews = newFiles.map(f => URL.createObjectURL(f));
    setFormImages(prev => [...prev, ...newFiles]);
    setFormImagePreviews(prev => [...prev, ...previews]);
  };

  const removeFormImage = (idx: number) => {
    URL.revokeObjectURL(formImagePreviews[idx]);
    setFormImages(prev => prev.filter((_, i) => i !== idx));
    setFormImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formText.trim()) {
      toast({ title: "Please fill in your name and review", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of formImages) {
        const ext = file.name.split(".").pop();
        const path = `reviews/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "3600" });
        if (upErr) {
          console.warn("Image upload failed:", upErr.message);
        } else {
          uploadedUrls.push(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`);
        }
      }

      const { error } = await supabase.from("reviews").insert({
        reviewer_name: formName.trim(),
        rating: formRating,
        text: formText.trim(),
        verified: false,
        images: uploadedUrls,
      });

      if (error) {
        console.error("Review insert error:", error);
        toast({ title: "Error submitting review", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Review submitted!", description: "Thank you for your feedback. It will appear after approval." });
        setFormName(""); setFormText(""); setFormRating(5);
        setFormImages([]); setFormImagePreviews([]);
        setShowForm(false);
      }
    } catch (err: any) {
      console.error("Review submit catch:", err);
      toast({ title: "Error", description: err?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    stars: star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  const reviewImages = reviews.flatMap(r => (r.images || []).map(img => img)).filter(Boolean);
  const allImageUrls = reviewImages.slice(0, 16);

  return (
    <section className="py-10 md:py-16 bg-card" id="reviews">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="section-heading mb-6">Customer Reviews</h2>

        {/* Rating summary */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-6 p-5 bg-section-light rounded-xl border border-border">
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold text-foreground">{avgRating.toFixed(1)}</div>
            <StarRating rating={Math.round(avgRating)} size={20} />
            <p className="text-sm text-muted-foreground mt-1">Based on {totalReviews} reviews</p>
          </div>
          <div className="flex-1 w-full space-y-1.5">
            {ratingCounts.map(r => (
              <div key={r.stars} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-right text-muted-foreground">{r.stars}★</span>
                <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: totalReviews > 0 ? `${(r.count / totalReviews) * 100}%` : "0%" }} />
                </div>
                <span className="w-8 text-muted-foreground text-xs">({r.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Photo strip — scrollable, click to zoom */}
        {allImageUrls.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {allImageUrls.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightbox({ images: allImageUrls, index: i })}
                className="relative group w-16 h-16 md:w-20 md:h-20 rounded-lg border border-border overflow-hidden flex-shrink-0"
              >
                <img src={img} alt={`Review photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Write a review button */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-2">
            <Camera className="w-4 h-4" /> Write a Review
          </Button>
          <span className="text-xs text-muted-foreground">{totalReviews} reviews</span>
        </div>

        {/* Review Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Write Your Review</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Your Rating</label>
                <InteractiveStarRating rating={formRating} onRate={setFormRating} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Your Name *</label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Enter your name" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Your Review *</label>
                <textarea
                  value={formText}
                  onChange={e => setFormText(e.target.value)}
                  placeholder="Share your experience with Pantacal..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Add Photos (optional, max 3)</label>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageSelect(e.target.files)} />
                <div className="flex gap-2 flex-wrap">
                  {formImagePreviews.map((src, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg border border-border overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeFormImage(i)} className="absolute top-0 right-0 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {formImages.length < 3 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors">
                      <ImagePlus className="w-5 h-5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full gap-2">
                <Send className="h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Carousel */}
        {reviews.length > 0 && (
          <div
            className="relative"
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 30) diff > 0 ? nextSlide() : prevSlide();
            }}
          >
            <div className="overflow-hidden rounded-xl border border-border bg-background relative" style={{ minHeight: "140px" }}>
              {reviews.map((r, i) => (
                <div
                  key={r.id}
                  className={`w-full p-5 ${i === currentSlide ? "relative z-[1] opacity-100" : "absolute inset-0 z-0 opacity-0 pointer-events-none"}`}
                  style={{ willChange: "opacity" }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                      {r.reviewer_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{r.reviewer_name}</span>
                        {r.verified && (
                          <span className="text-[10px] bg-accent/10 text-accent font-medium px-1.5 py-0.5 rounded">✓ Verified</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={r.rating} size={14} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.text}</p>
                  {r.images && r.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {r.images.map((img, j) => (
                        <button
                          key={j}
                          onClick={() => setLightbox({ images: r.images, index: j })}
                          className="relative group w-14 h-14 rounded-lg border border-border overflow-hidden"
                        >
                          <img src={img} alt="Review" className="w-full h-full object-cover" loading="lazy" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center">
                            <ZoomIn className="w-3 h-3 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Nav arrows */}
            <button onClick={prevSlide} className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center shadow-sm hover:bg-background">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={nextSlide} className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center shadow-sm hover:bg-background">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>

            {/* Dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? "bg-primary w-5" : "bg-border"}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          currentIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(idx) => setLightbox(prev => prev ? { ...prev, index: idx } : null)}
        />
      )}
    </section>
  );
};

export default ReviewsSection;
