/**
 * Yeni pazaryeri kurulurken eski Firestore kataloğunu müşteri yüzünden gizler.
 * Yeni ürünler hazır olduğunda NEXT_PUBLIC_CATALOG_RESET_MODE=false yapılabilir.
 */
export const CATALOG_RESET_MODE =
  process.env.NEXT_PUBLIC_CATALOG_RESET_MODE !== "false";
