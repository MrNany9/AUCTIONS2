import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "מכרזי נגרות בישראל",
  description: "אתר מרכז למכרזי נגרות ועץ בישראל",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={cn(inter.className, "bg-background")}>
        {children}
      </body>
    </html>
  );
}
