"use client";

import { getFirebaseAuth } from "@/lib/firebase.client";

export async function sellerRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("İşletme oturumu gerekli.");
  const token = await user.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "İşlem tamamlanamadı.");
  return data as T;
}

export async function sellerUpload(file: File): Promise<string> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("İşletme oturumu gerekli.");
  const token = await user.getIdToken();
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/seller/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Görsel yüklenemedi.");
  return String(data.url || "");
}
