"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { login } from "@/lib/authClient";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase.client";
import styles from "../seller.module.css";

export default function SellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canSubmit = useMemo(() => email.includes("@") && password.length >= 6 && !busy, [email, password, busy]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true); setError("");
    try {
      const credential = await login(email.trim(), password, true);
      const sellerRecord = await getDoc(doc(getFirebaseDb(), "users", credential.user.uid));
      if (!sellerRecord.exists() || !sellerRecord.data()?.sellerOnboarding?.status) {
        await signOut(getFirebaseAuth());
        throw new Error("not_a_seller_account");
      }
      router.push("/satici/panel");
    } catch {
      setError("Satıcı hesabına giriş yapılamadı. E-posta ve şifreni kontrol et.");
    } finally { setBusy(false); }
  }

  return (
    <section className={styles.sellerLoginPage}>
      <div className={styles.loginIntro}>
        <span>PAZAR. SELLER ACCESS</span>
        <h1>Mağazana<br />geri dön.</h1>
        <p>Ürünlerini, siparişlerini ve mağaza operasyonunu yönetmek için satıcı hesabınla giriş yap.</p>
        <div><i /> Yalnızca satıcı hesapları için güvenli erişim</div>
      </div>
      <div className={styles.loginCard}>
        <span>SATICI GİRİŞİ</span><h2>Tekrar hoş geldin.</h2><p>Müşteri hesabı değil, satıcı hesabı bilgilerini kullan.</p>
        <form onSubmit={submit}>
          <label className={styles.field}><span>Satıcı e-postası</span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="magaza@markan.com" /></label>
          <label className={styles.field}><span>Şifre</span><input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" /></label>
          <div className={styles.loginMeta}><label><input type="checkbox" defaultChecked /> Beni hatırla</label><Link href="/forgot">Şifremi unuttum</Link></div>
          {error && <div className={styles.wizardError}>{error}</div>}
          <button className={styles.loginSubmit} disabled={!canSubmit}>{busy ? "Giriş yapılıyor..." : "Satıcı alanına gir →"}</button>
        </form>
        <div className={styles.loginJoin}>Henüz satıcı değil misin? <Link href="/satici/basvuru">Mağazanı oluştur</Link></div>
      </div>
    </section>
  );
}
