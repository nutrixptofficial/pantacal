import { useState } from "react";
import { Play, X } from "lucide-react";

const videos = [
  {
    id: "ZQL_qfNrxzE",
    title: "Stronger bones, better absorption and daily support starts",
    views: "7",
    date: "Jan 2026",
    isShort: true,
  },
  {
    id: "txbvX9i8uMg",
    title: "Pantacal is a powerful combination of 5 essential nutrients",
    views: "3",
    date: "Jan 2026",
    isShort: true,
  },
  {
    id: "n1Zd8l4tcbY",
    title: "How Pantacal is Different from Other Bone Health Multivitamins",
    views: "6.4K",
    date: "Aug 2025",
    isShort: true,
  },
  {
    id: "XITIkv9wgrc",
    title: "Nutrix Health Care's Pantacal - Pakistan's No. 1 | Nida Mumtaz",
    views: "3.4K",
    date: "Jul 2025",
    isShort: true,
  },
  {
    id: "elzLSajO3SA",
    title: "Because Every Supermom Needs Strong Bones | Pantacal",
    views: "40.8K",
    date: "Jul 2025",
    isShort: true,
  },
  {
    id: "ODOBFWMhoXQ",
    title: "Regular workouts but experiencing body aches and weak bones?",
    views: "709",
    date: "Jul 2025",
    isShort: true,
  },
  {
    id: "gDDNiP1S6as",
    title: "Pantacal Pakistan's No 1 Bone Health Supplement - Dr Humaira",
    views: "1.6K",
    date: "Apr 2025",
    isShort: true,
  },
];

const YouTubeSection = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  return (
    <section className="py-10 md:py-16 bg-section-light">
      <div className="container mx-auto px-4">
        <h2 className="section-heading mb-2">
          Watch us <em className="text-primary">in action</em>
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          Straight from our YouTube channel
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
          {videos.map((video) => (
            <div key={video.id} className="group relative">
              {playingId === video.id ? (
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-foreground">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
                    title={video.title}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                  <button
                    onClick={() => setPlayingId(null)}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPlayingId(video.id)}
                  className="relative aspect-[9/16] rounded-xl overflow-hidden w-full bg-muted"
                >
                  <img
                    src={`https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                    </div>
                  </div>
                  {/* Shorts badge */}
                  {video.isShort && (
                    <span className="absolute top-2 left-2 bg-destructive text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                      SHORTS
                    </span>
                  )}
                </button>
              )}
              <div className="mt-2">
                <p className="text-xs text-foreground font-medium line-clamp-2 leading-tight">
                  {video.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {video.views} views · {video.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default YouTubeSection;
