import type { Metadata } from "next";
import SellerWizard from "./SellerWizard";

export const metadata: Metadata = {
  title: "Satıcı Başvurusu | PAZAR.",
  description: "PAZAR. satıcı hesabını oluştur ve mağazanı satışa hazırla.",
};

export default function SellerApplicationPage() {
  return <SellerWizard />;
}
