// PAZAR. destek verisi eski mobil uygulamanın dinlediği `support_threads`
// koleksiyonundan fiziksel olarak ayrı tutulur. Yalnızca workspace alanıyla
// filtrelemek yeterli değildir; eski Cloud Function koleksiyon seviyesinde tetiklenir.
export const MARKETPLACE_SUPPORT_COLLECTION = "pazar_support_threads";
export const MARKETPLACE_SUPPORT_WORKSPACE = "pazar_marketplace_v1";
export const MARKETPLACE_CHAT_SETTINGS_DOC = "pazar_chat_widget";

export function marketplaceAccountThreadId(uid: string) {
  return `pazar_account_${String(uid || "").trim()}`;
}
