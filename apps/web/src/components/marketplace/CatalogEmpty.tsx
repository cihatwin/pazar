import Link from "next/link";
import { PackageOpen } from "lucide-react";
import styles from "./CatalogEmpty.module.css";

type Props = { title?: string; text?: string; showHomeLink?: boolean };

export default function CatalogEmpty({
  title = "Mağaza hazırlanıyor",
  text = "Yeni ürünler ve yeni satıcılar için temiz bir başlangıç yapıyoruz. Katalog çok yakında burada olacak.",
  showHomeLink = true,
}: Props) {
  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <div className={styles.icon} aria-hidden="true"><PackageOpen size={30} strokeWidth={2.2} /></div>
        <p className={styles.eyebrow}>Yeni katalog</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.text}>{text}</p>
        {showHomeLink ? <Link className={styles.link} href="/">Ana sayfaya dön</Link> : null}
      </section>
    </main>
  );
}
