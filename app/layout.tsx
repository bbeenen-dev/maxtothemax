import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import { Navbar } from "@/components/navbar"; // Importeer je nieuwe Navbar
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "F1 Prediction Dashboard",
  description: "Manage and predict F1 races",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased bg-[#0b0e14]`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // We zetten hem op dark omdat je F1 app een dark-vibe heeft
          enableSystem
          disableTransitionOnChange
        >
          {/* De Navbar staat hier, zodat hij altijd boven de content blijft "plakken" */}
          <Navbar />

          <Suspense fallback={<div className="p-6 text-white text-center">Laden...</div>}>
            <main>
              {children}
            </main>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}