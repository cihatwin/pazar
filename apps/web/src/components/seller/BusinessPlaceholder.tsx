import Link from "next/link";
import styles from "@/app/(seller)/satici/panel/businessAdmin.module.css";

export default function BusinessPlaceholder({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <section className={styles.placeholder}><span>{eyebrow}</span><h1>{title}</h1><p>{text}</p><Link href="/satici/panel">İşletme merkezine dön →</Link></section>;
}
