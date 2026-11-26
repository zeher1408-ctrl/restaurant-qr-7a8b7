import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "D.CC Kitchen - Restaurant QR & Service",
  description: "Live order tracking, digital guest menu, staff floor map, and kitchen display system.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F8F9FF] text-[#0F172A] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
