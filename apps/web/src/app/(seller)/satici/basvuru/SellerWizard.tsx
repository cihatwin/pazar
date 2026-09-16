"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { register } from "@/lib/authClient";
import { getFirebaseAuth } from "@/lib/firebase.client";
import styles from "../seller.module.css";

type FormState = {
  email: string;
  password: string;
  passwordAgain: string;
  businessType: "individual" | "company";
  legalName: string;
  taxId: string;
  city: string;
  phone: string;
  storeName: string;
  category: string;
  website: string;
  description: string;
  consent: boolean;
};

const initialForm: FormState = {
  email: "", password: "", passwordAgain: "", businessType: "company",
  legalName: "", taxId: "", city: "", phone: "", storeName: "",
  category: "", website: "", description: "", consent: false,
};

const steps = ["Hesap", "İşletme", "Mağaza", "Onay"];

function authError(error: unknown) {
  const original = String((error as { code?: string; message?: string })?.code || (error as Error)?.message || error);
  const raw = original.toLowerCase();
  if (original.includes("Başvuru") || original.includes("başvuru") || original.includes("satıcı hesabı")) return original;
  if (raw.includes("email-already-in-use")) return "Bu e-posta zaten kayıtlı. Satıcı girişi yapabilir veya başka e-posta kullanabilirsin.";
  if (raw.includes("weak-password")) return "Şifren en az 6 karakter olmalı.";
  if (raw.includes("invalid-email")) return "Geçerli bir e-posta adresi yazmalısın.";
  if (raw.includes("network")) return "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.";
  return "Başvuru tamamlanamadı. Bilgilerini kontrol edip tekrar dene.";
}

export default function SellerWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("pazar-seller-draft");
      if (saved) setForm((current) => ({ ...current, ...JSON.parse(saved), password: "", passwordAgain: "", consent: false }));
    } catch {}
  }, []);

  useEffect(() => {
    const safeDraft: Partial<FormState> = { ...form };
    delete safeDraft.password;
    delete safeDraft.passwordAgain;
    delete safeDraft.consent;
    try { window.localStorage.setItem("pazar-seller-draft", JSON.stringify(safeDraft)); } catch {}
  }, [form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function validate(currentStep = step) {
    if (currentStep === 0) {
      if (!form.email.includes("@")) return "Geçerli bir e-posta adresi yaz.";
      if (form.password.length < 6) return "Şifren en az 6 karakter olmalı.";
      if (form.password !== form.passwordAgain) return "Şifreler birbiriyle eşleşmiyor.";
    }
    if (currentStep === 1 && (!form.legalName.trim() || !form.phone.trim() || !form.city.trim())) return "İşletme adı, telefon ve şehir alanlarını tamamla.";
    if (currentStep === 1 && form.businessType === "company" && form.taxId.trim().length < 8) return "Şirket başvurusu için geçerli vergi numaranı yaz.";
    if (currentStep === 2 && (!form.storeName.trim() || !form.category)) return "Mağaza adı ve ana kategori zorunlu.";
    if (currentStep === 2 && form.description.trim().length < 20) return "Mağazanı en az 20 karakterle kısaca anlat.";
    if (currentStep === 3 && !form.consent) return "Başvuru koşullarını onaylamalısın.";
    return "";
  }

  function next() {
    const message = validate();
    if (message) return setError(message);
    setStep((value) => Math.min(3, value + 1));
  }

  async function submit() {
    const message = validate(3);
    if (message) return setError(message);
    setBusy(true); setError("");
    try {
      let applicationUser = getFirebaseAuth().currentUser;
      if (!applicationUser || applicationUser.email?.toLowerCase() !== form.email.trim().toLowerCase()) {
        const credential = await register(form.email.trim(), form.password, form.storeName.trim());
        applicationUser = credential.user;
      }
      const token = await applicationUser.getIdToken();
      const response = await fetch("/api/seller/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessType: form.businessType, legalName: form.legalName, taxId: form.taxId,
          city: form.city, phone: form.phone, storeName: form.storeName,
          category: form.category, website: form.website, description: form.description,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "seller_application_failed");
      window.localStorage.removeItem("pazar-seller-draft");
      setDone(true);
    } catch (requestError) {
      setError(authError(requestError));
    } finally { setBusy(false); }
  }

  if (done) return <div className={styles.wizardPage}><div className={`${styles.wizardCard} ${styles.success}`}><div><div className={styles.successMark}>✓</div><h2>Başvurun alındı.</h2><p>Satıcı hesabın oluşturuldu. Mağaza bilgilerin kontrol edildikten sonra yayın yetkisi e-posta ile paylaşılacak.</p><Link href="/satici/panel" className={styles.successLink}>Başvuru durumunu gör →</Link></div></div></div>;

  return (
    <div className={styles.wizardPage}>
      <div className={styles.wizardShell}>
        <aside className={styles.wizardAside}>
          <span>PAZAR. SELLER ONBOARDING</span><h1>Mağazanı<br />kur.</h1>
          <p>Bilgilerin otomatik kaydedilir. Başvurunu dört kısa adımda tamamla.</p>
          <div className={styles.stepNav}>{steps.map((label,index) => <div key={label} className={`${styles.stepItem} ${index === step ? styles.stepActive : ""} ${index < step ? styles.stepDone : ""}`}><i>{index < step ? "✓" : `0${index+1}`}</i><span>{label}</span></div>)}</div>
        </aside>

        <section className={styles.wizardCard}>
          <div className={styles.wizardProgress}><i style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>
          <header className={styles.wizardHead}>
            <span>ADIM 0{step + 1} / 04</span>
            <h2>{["Satıcı hesabını oluştur", "İşletmeni tanıyalım", "Mağazanı şekillendir", "Başvurunu kontrol et"][step]}</h2>
            <p>{["Bu hesap yalnızca satıcı alanında kullanılacak.", "Faturalandırma ve doğrulama için temel bilgilerini ekle.", "Müşterilerin göreceği mağaza kimliğini oluştur.", "Bilgilerini onayla; yetkilendirme kontrol sonrasında yapılır."][step]}</p>
          </header>

          {step === 0 && <div className={styles.formGrid}>
            <label className={`${styles.field} ${styles.fieldFull}`}><span>İş e-postası</span><input type="email" autoComplete="email" value={form.email} onChange={e=>update("email",e.target.value)} placeholder="magaza@markan.com" /></label>
            <label className={styles.field}><span>Şifre</span><input type="password" autoComplete="new-password" value={form.password} onChange={e=>update("password",e.target.value)} placeholder="En az 6 karakter" /></label>
            <label className={styles.field}><span>Şifre tekrar</span><input type="password" autoComplete="new-password" value={form.passwordAgain} onChange={e=>update("passwordAgain",e.target.value)} placeholder="Şifreni tekrar yaz" /></label>
          </div>}

          {step === 1 && <div className={styles.formGrid}>
            <div className={styles.choiceGrid}><button type="button" onClick={()=>update("businessType","company")} className={`${styles.choice} ${form.businessType === "company" ? styles.choiceActive : ""}`}><b>Şirket</b>Vergi mükellefi işletme</button><button type="button" onClick={()=>update("businessType","individual")} className={`${styles.choice} ${form.businessType === "individual" ? styles.choiceActive : ""}`}><b>Bireysel</b>Kendi adına satış</button></div>
            <label className={styles.field}><span>Yasal ad / unvan</span><input value={form.legalName} onChange={e=>update("legalName",e.target.value)} placeholder="İşletme veya ad soyad" /></label>
            <label className={styles.field}><span>Vergi / T.C. numarası</span><input inputMode="numeric" value={form.taxId} onChange={e=>update("taxId",e.target.value.replace(/\D/g,""))} placeholder={form.businessType === "company" ? "Vergi numarası" : "Opsiyonel"} /></label>
            <label className={styles.field}><span>Telefon</span><input type="tel" value={form.phone} onChange={e=>update("phone",e.target.value)} placeholder="05xx xxx xx xx" /></label>
            <label className={styles.field}><span>Şehir</span><input value={form.city} onChange={e=>update("city",e.target.value)} placeholder="İstanbul" /></label>
          </div>}

          {step === 2 && <div className={styles.formGrid}>
            <label className={styles.field}><span>Mağaza adı</span><input value={form.storeName} onChange={e=>update("storeName",e.target.value)} placeholder="Markanın görünen adı" /></label>
            <label className={styles.field}><span>Ana kategori</span><select value={form.category} onChange={e=>update("category",e.target.value)}><option value="">Kategori seç</option><option>Moda</option><option>Teknoloji</option><option>Ev & Yaşam</option><option>Kozmetik</option><option>Spor</option><option>Anne & Çocuk</option><option>Diğer</option></select></label>
            <label className={`${styles.field} ${styles.fieldFull}`}><span>Web sitesi / sosyal hesap (opsiyonel)</span><input value={form.website} onChange={e=>update("website",e.target.value)} placeholder="https://" /></label>
            <label className={`${styles.field} ${styles.fieldFull}`}><span>Mağaza hikâyesi</span><textarea value={form.description} onChange={e=>update("description",e.target.value)} placeholder="Ne satıyorsun, markanı özel yapan ne?" /></label>
          </div>}

          {step === 3 && <><div className={styles.reviewGrid}><div><small>Satıcı hesabı</small><strong>{form.email}</strong></div><div><small>İşletme</small><strong>{form.legalName}</strong></div><div><small>Mağaza</small><strong>{form.storeName}</strong></div><div><small>Kategori</small><strong>{form.category}</strong></div></div><label className={styles.consent}><input type="checkbox" checked={form.consent} onChange={e=>update("consent",e.target.checked)} /><span>Satıcı başvuru koşullarını, doğrulama sürecini ve mağazanın inceleme sonrasında etkinleştirileceğini kabul ediyorum.</span></label></>}

          {error && <div className={styles.wizardError}>{error}</div>}
          <div className={styles.wizardActions}>{step > 0 && <button type="button" className={styles.wizardButton} onClick={()=>{setStep(s=>s-1);setError("");}}>← Geri</button>}{step < 3 ? <button type="button" className={`${styles.wizardButton} ${styles.wizardButtonPrimary}`} onClick={next}>Devam et →</button> : <button type="button" className={`${styles.wizardButton} ${styles.wizardButtonPrimary}`} disabled={busy} onClick={submit}>{busy ? "Hesap oluşturuluyor..." : "Başvuruyu tamamla →"}</button>}</div>
        </section>
      </div>
    </div>
  );
}
