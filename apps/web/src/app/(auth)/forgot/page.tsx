"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPasswordResetCodeClient } from "@/lib/passwordResetClient";
import styles from "@/styles/authPage.module.css";

function humanizeError(err: any) {
  const raw = String(err?.message || err || "").toLowerCase();
  if (raw.includes("45")) return "Çok hızlı tekrar denendi. 45 saniye bekle.";
  return "Kod gönderilemedi. Lütfen tekrar dene.";
}

export default function ForgotPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    setBusy(true);
    setMsg(null);

    try {
      await sendPasswordResetCodeClient(cleanEmail);

      router.push(
        `/reset-password?email=${encodeURIComponent(cleanEmail)}&sent=1`
      );
    } catch (e: any) {
      setMsg(humanizeError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.wrap}>
      <section className={styles.shell}>
        <aside className={styles.left}>
          <div className={styles.brandRow}>
            <div className={styles.mark}>P.</div>
            <div>
              <div className={styles.brandTitle}>PAZAR.</div>
              <div className={styles.brandSub}>Güvenli hesap deneyimi</div>
            </div>
          </div>

          <div className={styles.kicker}>Hesap kurtarma</div>
          <h1 className={styles.heroTitle}>Tekrar eriş.</h1>

          <div className={styles.breadcrumb}>
            <Link href="/">Anasayfa</Link>
            <span>›</span>
            <span>Şifremi unuttum</span>
          </div>

          <div className={styles.infoStack}>
            <div className={styles.infoCard}>
              <div className={styles.infoCardTitle}>Güvenli doğrulama</div>
              <div className={styles.infoCardText}>
                E-postana göndereceğimiz tek kullanımlık kodla hesabına yeniden eriş.
              </div>
            </div>
            <div className={styles.infoMiniGrid}>
              <div className={styles.infoMini}><strong>6 haneli kod</strong><span>Tek kullanımlık</span></div>
              <div className={styles.infoMini}><strong>Hızlı dönüş</strong><span>Dakikalar içinde</span></div>
            </div>
          </div>
        </aside>

        <section className={styles.right}>
          <div className={styles.card}>
            <header className={styles.cardHead}>
              <div className={styles.cardBadge}>Şifre Sıfırlama</div>
              <h1 className={styles.cardTitle}>Kod Gönder</h1>
              <p className={styles.cardDesc}>
                E-posta adresini gir, sana 6 haneli sıfırlama kodu gönderelim.
              </p>
            </header>

            {msg ? <div className={styles.alert}>{msg}</div> : null}

            <form onSubmit={onSubmit} className={styles.form}>
              <label className={styles.label}>
                <span>E-posta</span>
                <input
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                  required
                />
              </label>

              <div className={styles.actions}>
                <button className={styles.primaryBtn} type="submit" disabled={busy || !email.trim()}>
                  {busy ? "Gönderiliyor..." : "Kod Gönder"}
                </button>

                <Link className={styles.secondaryBtn} href="/login">
                  Vazgeç
                </Link>
              </div>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
