"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase.client";
import s from "./liveGoldRates.module.css";

type RateItem = {
  code: string;
  label: string;
  icon: string;
  sell: number;
  buy: number;
};

const RATE_KEYS = [
  { code: "GRAM_ALTIN", label: "Gram Altın", icon: "🪙" },
  { code: "HAS_ALTIN", label: "Has Altın", icon: "✨" },
  { code: "CEYREK_ALTIN", label: "Çeyrek Altın", icon: "🥇" },
  { code: "YARIM_ALTIN", label: "Yarım Altın", icon: "🏅" },
  { code: "TAM_ALTIN", label: "Tam Altın", icon: "🎖️" },
  { code: "CUMHURIYET_ALTINI", label: "Cumhuriyet", icon: "🏛️" },
];

function toNum(v: any): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null) return 0;
  let str = String(v).trim().replace(/\s/g, "");
  if (str.includes(".") && str.includes(",")) str = str.replace(/\./g, "").replace(",", ".");
  else if (str.includes(",")) str = str.replace(",", ".");
  const n = Number(str);
  return Number.isFinite(n) ? n : 0;
}

function fmtPrice(n: number): string {
  if (n <= 0) return "—";
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function extractRate(items: any, code: string): { sell: number; buy: number } {
  if (!items) return { sell: 0, buy: 0 };

  const normCode = code.toUpperCase().replace(/\s+/g, "_");

  let node: any = null;

  if (typeof items === "object" && !Array.isArray(items)) {
    node =
      items[normCode] ??
      items[normCode.toLowerCase()] ??
      items[normCode.replace(/_/g, "")] ??
      items[normCode.replace(/_/g, "").toLowerCase()];
  } else if (Array.isArray(items)) {
    node = items.find(
      (x: any) =>
        String(x?.code || "")
          .toUpperCase()
          .replace(/\s+/g, "_") === normCode
    );
  }

  if (!node) return { sell: 0, buy: 0 };
  if (typeof node === "number") return { sell: node, buy: 0 };

  return {
    sell: toNum(node?.sell ?? node?.Sell ?? node?.satis ?? node?.value ?? 0),
    buy: toNum(node?.buy ?? node?.Buy ?? node?.alis ?? 0),
  };
}

export default function LiveGoldRates() {
  const db = useMemo(() => getFirebaseDb(), []);
  const [rates, setRates] = useState<RateItem[]>([]);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "rates", "latest"),
      (snap) => {
        if (!snap.exists()) {
          setLoading(false);
          return;
        }

        const data = snap.data() as any;
        const items = data?.items;

        const parsed: RateItem[] = RATE_KEYS.map((rk) => {
          const r = extractRate(items, rk.code);
          return {
            code: rk.code,
            label: rk.label,
            icon: rk.icon,
            sell: r.sell,
            buy: r.buy,
          };
        }).filter((r) => r.sell > 0);

        setRates(parsed);
        setProvider(String(data?.provider || ""));

        const fa = data?.fetchedAt;
        if (fa) {
          if (typeof fa?.toMillis === "function") setFetchedAt(fa.toMillis());
          else if (typeof fa?.seconds === "number") setFetchedAt(fa.seconds * 1000);
        }

        setLoading(false);
      },
      (err) => {
        console.error("LiveGoldRates error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [db]);

  if (loading) {
    return (
      <section className={s.section}>
        <div className={s.inner}>
          <div className={s.shimmerRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={s.shimmerCard} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!rates.length) return null;

  return (
    <section className={s.section} aria-label="Canlı Altın Fiyatları">
      <div className={s.inner}>
        {/* Başlık */}
        <div className={s.head}>
          <div className={s.headLeft}>
            <div className={s.kicker}>CANLI FİYATLAR</div>
            <h2 className={s.h2}>Altın Fiyatları</h2>
          </div>
          <div className={s.headRight}>
            {fetchedAt > 0 && (
              <div className={s.updatedAt}>
                <span className={s.liveDot} />
                Son güncelleme:{" "}
                <b>{new Date(fetchedAt).toLocaleString("tr-TR")}</b>
              </div>
            )}
            {provider && <div className={s.providerTag}>Kaynak: {provider}</div>}
          </div>
        </div>

        {/* Kur Kartları */}
        <div className={s.grid}>
          {rates.map((r) => (
            <div key={r.code} className={s.card}>
              <div className={s.cardIcon}>{r.icon}</div>
              <div className={s.cardInfo}>
                <div className={s.cardLabel}>{r.label}</div>
                <div className={s.cardSell}>₺{fmtPrice(r.sell)}</div>
                {r.buy > 0 && (
                  <div className={s.cardBuy}>
                    Alış: ₺{fmtPrice(r.buy)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
