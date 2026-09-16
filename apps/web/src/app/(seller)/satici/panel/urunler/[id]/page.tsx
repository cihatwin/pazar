"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Loader2, Save, ShieldCheck, X } from "lucide-react";
import { useSellerPanel } from "@/components/seller/SellerPanelShell";
import { sellerRequest, sellerUpload } from "@/lib/sellerClient";
import type { SellerProduct } from "@/lib/sellerTypes";
import styles from "../products.module.css";

const categories = ["Moda", "Teknoloji", "Ev & Yaşam", "Kozmetik", "Spor", "Anne & Çocuk", "Takı & Aksesuar", "Diğer"];
type Form = { title:string; description:string; category:string; brand:string; sku:string; price:string; compareAtPrice:string; stock:string; images:string[] };
const emptyForm: Form = { title:"", description:"", category:"", brand:"", sku:"", price:"", compareAtPrice:"", stock:"0", images:[] };

export default function EditSellerProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { approved } = useSellerPanel();
  const [form, setForm] = useState<Form>(emptyForm);
  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!approved || !params.id) { setLoading(false); return; }
    let alive = true;
    sellerRequest<{ item: SellerProduct }>(`/api/seller/products/${params.id}`)
      .then(({ item }) => {
        if (!alive) return;
        setProduct(item);
        setForm({ title:item.title || "", description:item.description || "", category:item.category || "", brand:item.brand || "", sku:item.sku || "", price:String(item.price ?? ""), compareAtPrice:item.compareAtPrice == null ? "" : String(item.compareAtPrice), stock:String(item.stock ?? 0), images:item.images || [] });
      })
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [approved, params.id]);

  function set<K extends keyof Form>(key: K, value: Form[K]) { setForm((current) => ({ ...current, [key]: value })); }

  async function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).slice(0, 8 - form.images.length);
    if (!files.length) return;
    setUploading(true); setError("");
    try { const urls:string[]=[]; for (const file of files) urls.push(await sellerUpload(file)); set("images", [...form.images, ...urls]); }
    catch (e) { setError((e as Error).message); }
    finally { setUploading(false); event.target.value = ""; }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (form.title.trim().length < 3 || form.description.trim().length < 20 || !form.category || !form.sku.trim() || Number(form.price) <= 0) { setError("Zorunlu alanları ve en az 20 karakterlik ürün açıklamasını tamamla."); return; }
    setBusy(true); setError("");
    try {
      await sellerRequest(`/api/seller/products/${params.id}`, { method:"PATCH", body:JSON.stringify({ action:"update", ...form, price:Number(form.price), compareAtPrice:form.compareAtPrice ? Number(form.compareAtPrice) : null, stock:Number(form.stock) }) });
      router.push("/satici/panel/urunler"); router.refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  if (loading) return <div className={styles.state}><Loader2 className={styles.spin}/><b>Ürün bilgileri hazırlanıyor</b></div>;
  if (!product) return <div className={styles.state}><b>Ürün bulunamadı</b><p>{error || "Bu kayda erişim yetkin olmayabilir."}</p><Link href="/satici/panel/urunler">Ürünlere dön</Link></div>;
  const editable = product.status === "draft" || product.status === "rejected";

  return <div className={styles.wizardPage}>
    <aside className={styles.wizardAside}><span>ÜRÜN MERKEZİ • DÜZENLEME</span><h1>Kaydı güncelle.</h1><p>Bilgileri ve görselleri yenile. Kaydettiğinde ürün taslakta kalır; listeden yeniden incelemeye gönderebilirsin.</p><div className={styles.quality}><ShieldCheck/><span><b>{editable ? "Düzenlemeye açık" : "Salt okunur"}</b><small>{product.status === "rejected" ? "Admin notunu kontrol et" : "Güvenli işletme kataloğu"}</small></span></div>{product.moderationNote ? <div className={styles.editNote}><b>Süper Admin notu</b><p>{product.moderationNote}</p></div> : null}<Link className={styles.backLink} href="/satici/panel/urunler"><ArrowLeft size={15}/> Ürün listesine dön</Link></aside>
    <form className={styles.wizardCard} onSubmit={save}><header><span>ÜRÜN BİLGİLERİ</span><h2>{product.title}</h2><p>Fiyat, stok, açıklama ve görselleri tek ekrandan yönet.</p></header>
      <fieldset className={styles.editFieldset} disabled={!editable || busy}><div className={styles.formGrid}>
        <label className={styles.full}><span>Ürün adı *</span><input value={form.title} onChange={(e)=>set("title",e.target.value)} maxLength={140}/></label>
        <label><span>Kategori *</span><select value={form.category} onChange={(e)=>set("category",e.target.value)}><option value="">Kategori seç</option>{categories.map((item)=><option key={item}>{item}</option>)}</select></label>
        <label><span>Marka</span><input value={form.brand} onChange={(e)=>set("brand",e.target.value)}/></label>
        <label className={styles.full}><span>Açıklama *</span><textarea value={form.description} onChange={(e)=>set("description",e.target.value)} maxLength={4000}/><small>{form.description.length}/4000</small></label>
        <label><span>SKU *</span><input value={form.sku} onChange={(e)=>set("sku",e.target.value.toUpperCase())}/></label><label><span>Stok *</span><input type="number" min="0" value={form.stock} onChange={(e)=>set("stock",e.target.value)}/></label>
        <label><span>Satış fiyatı (₺) *</span><input type="number" min="0" step="0.01" value={form.price} onChange={(e)=>set("price",e.target.value)}/></label><label><span>Karşılaştırma fiyatı (₺)</span><input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e)=>set("compareAtPrice",e.target.value)}/></label>
      </div><div className={styles.uploadArea}><label><ImagePlus/><b>{uploading ? "Yükleniyor…" : "Yeni görsel ekle"}</b><small>JPG, PNG veya WEBP · en fazla 8 MB</small><input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={addImages} disabled={uploading}/></label><div className={styles.previews}>{form.images.map((url,index)=><figure key={`${url}-${index}`}><img src={url} alt=""/><button type="button" onClick={()=>set("images",form.images.filter((_,i)=>i!==index))}><X size={14}/></button>{index===0?<span>KAPAK</span>:null}</figure>)}</div></div></fieldset>
      {error ? <div className={styles.error}>{error}</div> : null}<footer><Link className={styles.cancelLink} href="/satici/panel/urunler">Vazgeç</Link><button type="submit" className={styles.next} disabled={!editable || busy || uploading}>{busy?<Loader2 className={styles.spin}/>:<Save size={16}/>} Değişiklikleri kaydet</button></footer>
    </form>
  </div>;
}
