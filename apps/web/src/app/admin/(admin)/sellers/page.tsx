"use client";

import { useCallback, useEffect, useState } from "react";
import PermissionGate from "@/components/admin/PermissionGate";
import { getFirebaseAuth } from "@/lib/firebase.client";
import s from "./sellers.module.css";

type Seller = { id:string; email?:string; storeName?:string; legalName?:string; category?:string; city?:string; phone?:string; businessType?:string; status?:string; submittedAt?:string };

export default function AdminSellersPage() {
  const [items, setItems] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const request = useCallback(async (method="GET", body?:unknown) => {
    const user = getFirebaseAuth().currentUser;
    if (!user) throw new Error("Admin oturumu gerekli.");
    const token = await user.getIdToken();
    const response = await fetch("/api/admin/sellers", { method, headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" }, body:body ? JSON.stringify(body) : undefined });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "İşlem başarısız.");
    return data;
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const data = await request(); setItems(data.items || []); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [request]);

  useEffect(() => { void load(); }, [load]);

  async function decide(uid:string, status:string) {
    setBusy(uid); setError("");
    try { await request("PATCH", { uid, status }); setItems((list)=>list.map((item)=>item.id===uid ? {...item,status} : item)); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(""); }
  }

  const pending = items.filter((item)=>item.status === "pending").length;
  return <PermissionGate permission="users_admin"><div className={s.page}>
    <header><div><span>PAZAR. SELLER OPERATIONS</span><h1>Satıcı Başvuruları</h1><p>Mağazaları incele, güvenli biçimde yetkilendir ve satıcı ağını yönet.</p></div><div className={s.metric}><small>BEKLEYEN</small><strong>{pending}</strong></div></header>
    {error ? <div className={s.error}>{error}</div> : null}
    <div className={s.toolbar}><b>{items.length} başvuru</b><button onClick={load}>Yenile</button></div>
    <section className={s.list}>{loading ? <div className={s.empty}>Başvurular yükleniyor…</div> : items.length===0 ? <div className={s.empty}>Henüz satıcı başvurusu yok.</div> : items.map((item)=><article key={item.id}>
      <div className={s.identity}><span className={s[item.status || "pending"]}>{item.status==="approved" ? "AKTİF" : item.status==="rejected" ? "RED" : "BEKLİYOR"}</span><h2>{item.storeName || "İsimsiz mağaza"}</h2><p>{item.legalName} · {item.businessType==="company" ? "Şirket" : "Bireysel"}</p></div>
      <div className={s.details}><span><small>KATEGORİ</small>{item.category || "—"}</span><span><small>KONUM</small>{item.city || "—"}</span><span><small>İLETİŞİM</small>{item.email}<br/>{item.phone}</span><span><small>BAŞVURU</small>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("tr-TR") : "—"}</span></div>
      <div className={s.actions}><button disabled={busy===item.id} onClick={()=>decide(item.id,"approved")}>Onayla</button><button disabled={busy===item.id} onClick={()=>decide(item.id,"rejected")}>Reddet</button><button disabled={busy===item.id} onClick={()=>decide(item.id,"pending")}>Beklemeye al</button></div>
    </article>)}</section>
  </div></PermissionGate>;
}
