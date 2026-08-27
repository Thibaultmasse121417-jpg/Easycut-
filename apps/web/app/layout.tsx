import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RealtyStudio — vidéos et fiches de vente générées par IA",
  description:
    "Transformez les photos de vos biens en vidéo, descriptif et fiche prête à publier, au nom de votre agence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-neutral-50 text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
