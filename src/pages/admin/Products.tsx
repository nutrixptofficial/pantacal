import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus, GripVertical, Upload, Image as ImageIcon, X, RotateCcw } from "lucide-react";

const PRODUCT_ID = "00000000-0000-0000-0000-000000000001";
const STORAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images`;

interface Variant { id: string; name: string; price: number; image_url: string; sort_order: number; }
interface Benefit { id: string; text: string; sort_order: number; }
interface ProductImage { id: string; src: string; alt: string; sort_order: number; }

const Products = () => {
  // Saved state (from DB)
  const [savedTitle, setSavedTitle] = useState("");
  const [savedSubtitle, setSavedSubtitle] = useState("");
  const [savedVariants, setSavedVariants] = useState<Variant[]>([]);
  const [savedBenefits, setSavedBenefits] = useState<Benefit[]>([]);
  const [savedImages, setSavedImages] = useState<ProductImage[]>([]);

  // Draft state (editable)
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [p, v, b, i] = await Promise.all([
      supabase.from("products").select("*").eq("id", PRODUCT_ID).single(),
      supabase.from("product_variants").select("*").eq("product_id", PRODUCT_ID).order("sort_order"),
      supabase.from("product_benefits").select("*").eq("product_id", PRODUCT_ID).order("sort_order"),
      supabase.from("product_images").select("*").eq("product_id", PRODUCT_ID).order("sort_order"),
    ]);
    const t = p.data?.title || ""; const st = p.data?.subtitle || "";
    const vd = v.data || []; const bd = b.data || []; const id = i.data || [];
    setSavedTitle(t); setSavedSubtitle(st);
    setSavedVariants(JSON.parse(JSON.stringify(vd)));
    setSavedBenefits(JSON.parse(JSON.stringify(bd)));
    setSavedImages(JSON.parse(JSON.stringify(id)));
    setTitle(t); setSubtitle(st);
    setVariants(vd); setBenefits(bd); setImages(id);
    setHasChanges(false);
  };

  useEffect(() => { load(); }, []);

  // Track changes
  useEffect(() => {
    const changed = title !== savedTitle || subtitle !== savedSubtitle ||
      JSON.stringify(variants) !== JSON.stringify(savedVariants) ||
      JSON.stringify(benefits) !== JSON.stringify(savedBenefits) ||
      JSON.stringify(images) !== JSON.stringify(savedImages);
    setHasChanges(changed);
  }, [title, subtitle, variants, benefits, images, savedTitle, savedSubtitle, savedVariants, savedBenefits, savedImages]);

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    return `${STORAGE_URL}/${path}`;
  };

  const handleGalleryFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      const newImages: ProductImage[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file, "gallery");
        newImages.push({ id: `new-${Date.now()}-${Math.random()}`, src: url, alt: file.name.replace(/\.[^/.]+$/, ""), sort_order: images.length + newImages.length });
      }
      setImages(prev => [...prev, ...newImages]);
      toast({ title: `${newImages.length} image(s) uploaded` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const handleVariantImage = async (file: File, index: number) => {
    setUploading(true);
    try {
      const url = await uploadFile(file, "variants");
      const arr = [...variants]; arr[index] = { ...arr[index], image_url: url }; setVariants(arr);
      toast({ title: "Variant image uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const handleCancel = () => {
    setTitle(savedTitle); setSubtitle(savedSubtitle);
    setVariants(JSON.parse(JSON.stringify(savedVariants)));
    setBenefits(JSON.parse(JSON.stringify(savedBenefits)));
    setImages(JSON.parse(JSON.stringify(savedImages)));
    setHasChanges(false);
    toast({ title: "Changes discarded" });
  };

  const saveProduct = async () => {
    setSaving(true);
    try {
      await supabase.from("products").update({ title, subtitle }).eq("id", PRODUCT_ID);

      // Delete removed variants/benefits/images
      const savedVIds = savedVariants.map(v => v.id);
      const currentVIds = variants.filter(v => !v.id.startsWith("new-")).map(v => v.id);
      const deletedVIds = savedVIds.filter(id => !currentVIds.includes(id));
      for (const id of deletedVIds) await supabase.from("product_variants").delete().eq("id", id);

      const savedBIds = savedBenefits.map(b => b.id);
      const currentBIds = benefits.filter(b => !b.id.startsWith("new-")).map(b => b.id);
      const deletedBIds = savedBIds.filter(id => !currentBIds.includes(id));
      for (const id of deletedBIds) await supabase.from("product_benefits").delete().eq("id", id);

      const savedIIds = savedImages.map(i => i.id);
      const currentIIds = images.filter(i => !i.id.startsWith("new-")).map(i => i.id);
      const deletedIIds = savedIIds.filter(id => !currentIIds.includes(id));
      for (const id of deletedIIds) await supabase.from("product_images").delete().eq("id", id);

      for (const v of variants) {
        if (v.id.startsWith("new-")) {
          await supabase.from("product_variants").insert({ product_id: PRODUCT_ID, name: v.name, price: v.price, image_url: v.image_url, sort_order: v.sort_order });
        } else {
          await supabase.from("product_variants").update({ name: v.name, price: v.price, image_url: v.image_url, sort_order: v.sort_order }).eq("id", v.id);
        }
      }

      for (const b of benefits) {
        if (b.id.startsWith("new-")) {
          await supabase.from("product_benefits").insert({ product_id: PRODUCT_ID, text: b.text, sort_order: b.sort_order });
        } else {
          await supabase.from("product_benefits").update({ text: b.text, sort_order: b.sort_order }).eq("id", b.id);
        }
      }

      for (const img of images) {
        if (img.id.startsWith("new-")) {
          await supabase.from("product_images").insert({ product_id: PRODUCT_ID, src: img.src, alt: img.alt, sort_order: img.sort_order });
        } else {
          await supabase.from("product_images").update({ src: img.src, alt: img.alt, sort_order: img.sort_order }).eq("id", img.id);
        }
      }

      toast({ title: "Saved!", description: "Product updated successfully." });
      await load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const removeVariant = (id: string) => setVariants(v => v.filter(x => x.id !== id));
  const removeBenefit = (id: string) => setBenefits(b => b.filter(x => x.id !== id));
  const removeImage = (id: string) => setImages(i => i.filter(x => x.id !== id));

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Management</h1>
          <p className="text-sm text-muted-foreground">Manage your product details, variants, and gallery</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <RotateCcw className="h-4 w-4 mr-1" /> Cancel
            </Button>
          )}
          <Button onClick={saveProduct} disabled={saving || uploading || !hasChanges} size="lg">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
          You have unsaved changes. Click "Save Changes" to apply them.
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Product Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Gallery Images */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Gallery Images</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">These appear in the product image slider.</p>
          </div>
          <div>
            <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleGalleryFiles(e.target.files)} />
            <Button size="sm" variant="outline" onClick={() => galleryInputRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4 mr-1" /> {uploading ? "Uploading..." : "Upload Images"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div onClick={() => galleryInputRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Click or drop images here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, i) => (
                <div key={img.id} className="relative group rounded-xl overflow-hidden border border-border bg-muted aspect-square">
                  <img src={img.src} alt={img.alt} className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => removeImage(img.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-1 left-1 right-1">
                    <Input placeholder="Alt text" value={img.alt} onChange={e => { const arr = [...images]; arr[i] = { ...arr[i], alt: e.target.value }; setImages(arr); }} className="text-xs h-7 bg-card/90 backdrop-blur-sm" />
                  </div>
                </div>
              ))}
              <div onClick={() => galleryInputRef.current?.click()} className="border-2 border-dashed border-border rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                <Plus className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-1">Add more</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Variants</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Product options with different pricing</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setVariants(v => [...v, { id: `new-${Date.now()}`, name: "", price: 0, image_url: "", sort_order: v.length }])}>
            <Plus className="h-4 w-4 mr-1" /> Add Variant
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {variants.map((v, i) => {
            const variantInputId = `variant-img-${v.id}`;
            return (
              <div key={v.id} className="flex gap-4 items-start p-4 border border-border rounded-xl bg-muted/30">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-3 flex-shrink-0 cursor-grab" />
                <div className="flex-shrink-0">
                  <input id={variantInputId} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleVariantImage(e.target.files[0], i); }} />
                  <div onClick={() => document.getElementById(variantInputId)?.click()} className="w-20 h-20 rounded-lg border-2 border-dashed border-border bg-card flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
                    {v.image_url ? <img src={v.image_url} alt={v.name} className="w-full h-full object-contain p-1" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input value={v.name} onChange={e => { const arr = [...variants]; arr[i] = { ...arr[i], name: e.target.value }; setVariants(arr); }} />
                  </div>
                  <div>
                    <Label className="text-xs">Price (Rs)</Label>
                    <Input type="number" value={v.price} onChange={e => { const arr = [...variants]; arr[i] = { ...arr[i], price: parseInt(e.target.value) || 0 }; setVariants(arr); }} />
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="text-destructive flex-shrink-0 mt-2" onClick={() => removeVariant(v.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Benefits</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Displayed as bullet points on the product page</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setBenefits(b => [...b, { id: `new-${Date.now()}`, text: "", sort_order: b.length }])}>
            <Plus className="h-4 w-4 mr-1" /> Add Benefit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {benefits.map((b, i) => (
            <div key={b.id} className="flex gap-3 items-center">
              <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 cursor-grab" />
              <span className="text-sm text-muted-foreground w-6 text-center">{i + 1}</span>
              <Input value={b.text} onChange={e => { const arr = [...benefits]; arr[i] = { ...arr[i], text: e.target.value }; setBenefits(arr); }} className="flex-1" placeholder="Enter benefit text..." />
              <Button size="icon" variant="ghost" className="text-destructive flex-shrink-0" onClick={() => removeBenefit(b.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
