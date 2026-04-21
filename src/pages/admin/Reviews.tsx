import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Star, Eye, EyeOff, Trash2, Search, CheckCircle2 } from "lucide-react";

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  text: string;
  verified: boolean;
  visible: boolean;
  images: string[];
  created_at: string;
}

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterVisible, setFilterVisible] = useState<string>("all");

  const fetchReviews = async () => {
    setLoading(true);
    let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (search) query = query.ilike("reviewer_name", `%${search}%`);
    const { data } = await query;
    let results = (data || []).map(r => ({ ...r, images: r.images || [], visible: (r as any).visible !== false }));
    if (filterVisible === "visible") results = results.filter(r => r.visible);
    if (filterVisible === "hidden") results = results.filter(r => !r.visible);
    setReviews(results);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [search, filterVisible]);

  const toggleVisibility = async (id: string, current: boolean) => {
    await supabase.from("reviews").update({ visible: !current } as any).eq("id", id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, visible: !current } : r));
    toast({ title: !current ? "Review shown" : "Review hidden" });
  };

  const toggleVerified = async (id: string, current: boolean) => {
    await supabase.from("reviews").update({ verified: !current }).eq("id", id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, verified: !current } : r));
    toast({ title: !current ? "Marked verified" : "Unmarked verified" });
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    setReviews(prev => prev.filter(r => r.id !== id));
    toast({ title: "Review deleted" });
  };

  const visibleCount = reviews.filter(r => r.visible).length;
  const hiddenCount = reviews.filter(r => !r.visible).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-sm text-muted-foreground">{reviews.length} total reviews · {visibleCount} visible · {hiddenCount} hidden</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {[{ v: "all", l: "All" }, { v: "visible", l: "Visible" }, { v: "hidden", l: "Hidden" }].map(f => (
            <button
              key={f.v}
              onClick={() => setFilterVisible(f.v)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterVisible === f.v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">No reviews found</div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <Card key={r.id} className={`border ${!r.visible ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                      {r.reviewer_name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{r.reviewer_name}</span>
                        {r.verified && <Badge variant="outline" className="text-[10px] bg-accent/10 text-accent border-accent/20">✓ Verified</Badge>}
                        {!r.visible && <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Hidden</Badge>}
                      </div>
                      <div className="flex gap-0.5 my-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-border"}`} />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{r.text}</p>
                      {r.images.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {r.images.map((img, j) => (
                            <img key={j} src={img} alt="" className="w-12 h-12 rounded-lg object-cover border border-border" />
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleVerified(r.id, r.verified)} title={r.verified ? "Unverify" : "Verify"}>
                      <CheckCircle2 className={`h-4 w-4 ${r.verified ? "text-accent" : "text-muted-foreground"}`} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleVisibility(r.id, r.visible)} title={r.visible ? "Hide" : "Show"}>
                      {r.visible ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteReview(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
