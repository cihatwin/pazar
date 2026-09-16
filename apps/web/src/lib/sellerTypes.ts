export type SellerProductStatus = "draft" | "pending_review" | "approved" | "rejected" | "archived";

export type SellerProduct = {
  id: string;
  ownerUid: string;
  storeName: string;
  title: string;
  description: string;
  category: string;
  brand: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  images: string[];
  status: SellerProductStatus;
  moderationNote?: string;
  source?: "seller_panel" | "admin_import" | "mobile_draft" | string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export const sellerProductStatusLabel: Record<SellerProductStatus, string> = {
  draft: "Taslak",
  pending_review: "İncelemede",
  approved: "Yayında",
  rejected: "Düzeltme gerekli",
  archived: "Arşivlendi",
};
