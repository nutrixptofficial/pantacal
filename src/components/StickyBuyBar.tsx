import { useNavigate } from "react-router-dom";

interface StickyBuyBarProps {
  variantIndex?: number;
  quantity?: number;
  variants?: { name: string; price: number; img: string }[];
}

const fallbackVariants = [
  { name: "Pack 1 (30 Tablets)", price: 1120, img: "/images/bottle.webp" },
  { name: "Bone Support Bundle", price: 3000, img: "/images/bundle.webp" },
  { name: "Winter Bundle", price: 2470, img: "/images/bundle-01.webp" },
];

const StickyBuyBar = ({ variantIndex = 0, quantity = 1, variants }: StickyBuyBarProps) => {
  const navigate = useNavigate();
  const v = (variants || fallbackVariants)[variantIndex] || fallbackVariants[0];
  const total = v.price * quantity;

  const handleBuyNow = () => {
    navigate("/checkout", {
      state: {
        variant: v.name,
        quantity,
        unitPrice: v.price,
        price: `Rs.${total.toLocaleString()}`,
      },
    });
  };

  return (
    <div className="sticky-buy-bar">
      <div>
        <p className="text-xs text-muted-foreground">{v.name} × {quantity}</p>
        <p className="font-bold text-brand-price">Rs.{total.toLocaleString()}</p>
      </div>
      <button onClick={handleBuyNow} className="buy-now-btn text-sm py-2 px-6">Buy Now</button>
    </div>
  );
};

export default StickyBuyBar;
