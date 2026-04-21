import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { variant, quantity, unitPrice, price } = (location.state as any) || {
    variant: "Pack 1 (30 Tablets)",
    quantity: 1,
    unitPrice: 1120,
    price: "Rs.1,120",
  };

  const totalPrice = unitPrice ? `Rs.${(unitPrice * quantity).toLocaleString()}` : price;
  const totalNum = unitPrice * quantity;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    else if (!/^[\d\s\-+()]{7,15}$/.test(form.phone)) errs.phone = "Invalid phone number";
    if (!form.city.trim()) errs.city = "City is required";
    if (!form.address.trim()) errs.address = "Address is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      // Save order to database
      const { error: dbError } = await supabase.from("orders").insert({
        variant_name: variant,
        quantity,
        unit_price: unitPrice,
        total_price: totalNum,
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        customer_phone: form.phone.trim(),
        customer_city: form.city.trim(),
        customer_address: form.address.trim(),
      });

      if (dbError) console.error("Order save error:", dbError);

      // Also send via WhatsApp
      const message = `🛒 *New Order*\n\n*Product:* ${variant}\n*Qty:* ${quantity}\n*Unit Price:* Rs.${unitPrice?.toLocaleString()}\n*Total:* ${totalPrice}\n\n*Customer:*\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nCity: ${form.city}\nAddress: ${form.address}\n\n*Shipping:* Free Shipping\n*Payment:* Cash on Delivery`;
      const waUrl = `https://wa.me/923153329901?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");

      toast({
        title: "Order Placed!",
        description: "Your order has been sent. We'll contact you shortly.",
      });

      setTimeout(() => {
        setSubmitting(false);
        navigate("/");
      }, 2000);
    } catch (err) {
      setSubmitting(false);
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border py-4 px-4">
        <div className="container mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          </button>
          <img src="/images/logo.png" alt="Pantacal" className="h-8" />
          <span className="text-lg font-semibold text-foreground">Checkout</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <h2 className="font-semibold text-foreground mb-3 text-lg">Order Summary</h2>
          <div className="flex items-center gap-4">
            <img src="/images/bottle.webp" alt="Pantacal" className="w-16 h-16 object-contain rounded-lg bg-muted p-1" />
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">{variant}</p>
              <p className="text-muted-foreground text-xs">Qty: {quantity}</p>
              {unitPrice && <p className="text-muted-foreground text-xs">Unit: Rs.{unitPrice.toLocaleString()}</p>}
            </div>
            <p className="font-bold text-primary text-lg">{totalPrice}</p>
          </div>
          <div className="border-t border-border mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-accent font-medium">Free</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-foreground">Total</span>
              <span className="text-primary">{totalPrice}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <h2 className="font-semibold text-foreground mb-4 text-lg">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" placeholder="Muhammad Ali" value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="mt-1" />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="ali@example.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" type="tel" placeholder="03XX XXXXXXX" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} className="mt-1" />
                {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <h2 className="font-semibold text-foreground mb-4 text-lg">Shipping Address</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input id="city" placeholder="Lahore" value={form.city} onChange={(e) => handleChange("city", e.target.value)} className="mt-1" />
                {errors.city && <p className="text-destructive text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <Label htmlFor="address">Full Address *</Label>
                <Input id="address" placeholder="House #, Street, Area" value={form.address} onChange={(e) => handleChange("address", e.target.value)} className="mt-1" />
                {errors.address && <p className="text-destructive text-xs mt-1">{errors.address}</p>}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            <div>
              <h2 className="font-semibold text-foreground mb-2 text-lg">Shipping Method</h2>
              <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-primary bg-primary/5">
                <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                </div>
                <span className="flex-1 font-medium text-foreground text-sm">Standard Shipping</span>
                <span className="text-accent font-semibold text-sm">FREE</span>
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-foreground mb-2 text-lg">Payment Method</h2>
              <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-primary bg-primary/5">
                <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                </div>
                <span className="flex-1 font-medium text-foreground text-sm">Cash on Delivery (COD)</span>
                <span className="text-muted-foreground text-xs">💵</span>
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="buy-now-btn w-full disabled:opacity-50">
            {submitting ? "Placing Order..." : "Order Now"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
