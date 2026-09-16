"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3, Handshake, Headphones, MessageCircle, Send, ShieldCheck, Store } from "lucide-react";
import { useLocale } from "@/lib/useT";
import { getWhatsAppNumber, onWhatsAppNumberChange } from "@/lib/whatsapp";
import s from "./IletisimPage.module.css";

type Locale = "tr" | "en";
const tx = (loc: Locale, tr: string, en: string) => (loc === "en" ? en : tr);

export default function IletisimPage() {
  const loc = useLocale();
  const [waNumber, setWaNumber] = useState(getWhatsAppNumber);
  const [sent, setSent] = useState(false);
  useEffect(() => onWhatsAppNumberChange(setWaNumber), []);

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = String(form.get("topic") || tx(loc, "Destek talebi", "Support request"));
    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "");
    const message = String(form.get("message") || "");
    const body = `PAZAR. • ${subject}\n${tx(loc, "Ad Soyad", "Name")}: ${name}\nE-mail: ${email}\n\n${message}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(body)}`, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  const channels = [
    { icon: Headphones, tag: tx(loc, "MÜŞTERİ", "CUSTOMER"), title: tx(loc, "Sipariş ve hesap desteği", "Order and account support"), text: tx(loc, "Sipariş, ödeme, teslimat ve iade süreçlerinde hızlı yönlendirme.", "Fast guidance for orders, payments, delivery and returns."), href: "/hesabim", action: tx(loc, "Hesap merkezine git", "Go to account center") },
    { icon: Store, tag: tx(loc, "SATICI", "SELLER"), title: tx(loc, "Mağaza ve başvuru desteği", "Store and application support"), text: tx(loc, "Başvuru, mağaza kurulumu ve satıcı paneli için ayrı uzman akışı.", "A dedicated expert flow for applications, store setup and seller tools."), href: "/satici", action: tx(loc, "Satıcı dünyasını aç", "Open seller world") },
    { icon: Handshake, tag: tx(loc, "İŞ BİRLİĞİ", "PARTNERSHIP"), title: tx(loc, "Marka ve çözüm ortaklığı", "Brand and solution partnerships"), text: tx(loc, "Kampanya, entegrasyon ve kurumsal iş birliklerini birlikte tasarlayalım.", "Let’s design campaigns, integrations and business partnerships together."), href: "#talep", action: tx(loc, "Talep oluştur", "Create a request") },
  ];

  return (
    <main className={s.page} key={loc}>
      <section className={s.hero}>
        <div className={s.orbOne} /><div className={s.orbTwo} />
        <div className={s.heroInner}>
          <div className={s.heroCopy}>
            <div className={s.eyebrow}><span /> PAZAR. SUPPORT DESK</div>
            <h1>{tx(loc, "Doğru ekibe, doğrudan ulaş.", "Reach the right team, directly.")}</h1>
            <p>{tx(loc, "Müşteri ve satıcı ihtiyaçlarını birbirine karıştırmadan çözen, yeni nesil destek merkezi.", "A next-generation support center that keeps customer and seller needs in their own expert lanes.")}</p>
            <div className={s.heroActions}>
              <a className={s.primaryButton} href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp <ArrowUpRight size={16} /></a>
              <a className={s.secondaryButton} href="#talep">{tx(loc, "Destek talebi", "Support request")} <ArrowUpRight size={16} /></a>
            </div>
          </div>
          <div className={s.heroStatus}>
            <div className={s.statusTop}><div className={s.statusIcon}><ShieldCheck size={25} /></div><span className={s.live}><i /> {tx(loc, "Destek aktif", "Support online")}</span></div>
            <strong>{tx(loc, "Tek merkez, uzman ekipler", "One hub, specialist teams")}</strong>
            <p>{tx(loc, "Talebin konuya göre otomatik olarak doğru destek akışına yönlenir.", "Your request is routed automatically to the right support flow.")}</p>
            <div className={s.response}><Clock3 size={16} /><span>{tx(loc, "Hedef ilk yanıt", "Target first response")}</span><b>&lt; 30 dk</b></div>
          </div>
        </div>
      </section>

      <section className={s.channels} aria-label={tx(loc, "Destek kanalları", "Support channels")}>
        {channels.map(({ icon: Icon, ...channel }, index) => (
          <Link className={s.channelCard} href={channel.href} key={channel.tag} style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}>
            <div className={s.channelHead}><span className={s.channelIcon}><Icon size={21} /></span><small>{channel.tag}</small></div>
            <h2>{channel.title}</h2><p>{channel.text}</p><span className={s.channelLink}>{channel.action}<ArrowUpRight size={16} /></span>
          </Link>
        ))}
      </section>

      <section className={s.requestSection} id="talep">
        <div className={s.requestIntro}>
          <span className={s.sectionNumber}>01 — {tx(loc, "TALEP MERKEZİ", "REQUEST CENTER")}</span>
          <h2>{tx(loc, "Konuyu anlat, gerisini biz yönlendirelim.", "Tell us the issue. We’ll route the rest.")}</h2>
          <p>{tx(loc, "Sipariş numaran varsa mesajına ekle. Satıcı başvuruları için satıcı dünyasındaki özel akışı kullan.", "Include your order number if available. Seller applications use the dedicated flow in Seller World.")}</p>
          <div className={s.trustList}><span><ShieldCheck size={17} /> {tx(loc, "Güvenli iletişim", "Secure communication")}</span><span><Clock3 size={17} /> {tx(loc, "Hızlı yönlendirme", "Fast routing")}</span></div>
        </div>
        <form className={s.form} onSubmit={submitRequest}>
          <div className={s.formGrid}>
            <label><span>{tx(loc, "Ad soyad", "Full name")}</span><input name="name" required placeholder={tx(loc, "Adını yaz", "Your name")} /></label>
            <label><span>E-mail</span><input name="email" required type="email" placeholder="ornek@mail.com" /></label>
          </div>
          <label><span>{tx(loc, "Konu", "Topic")}</span><select name="topic" defaultValue=""><option value="" disabled>{tx(loc, "Konu seç", "Choose a topic")}</option><option>{tx(loc, "Sipariş desteği", "Order support")}</option><option>{tx(loc, "Ödeme ve iade", "Payment and returns")}</option><option>{tx(loc, "Satıcı desteği", "Seller support")}</option><option>{tx(loc, "İş birliği", "Partnership")}</option></select></label>
          <label><span>{tx(loc, "Mesajın", "Your message")}</span><textarea name="message" required rows={5} placeholder={tx(loc, "Nasıl yardımcı olabiliriz?", "How can we help?")} /></label>
          <div className={s.formBottom}><small>{sent ? tx(loc, "WhatsApp destek hattı açıldı.", "WhatsApp support has opened.") : tx(loc, "Bilgilerin yalnızca destek talebin için kullanılır.", "Your details are used only for this support request.")}</small><button type="submit"><Send size={16} /> {tx(loc, "Talebi gönder", "Send request")}</button></div>
        </form>
      </section>
    </main>
  );
}
