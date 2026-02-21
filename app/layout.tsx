import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import { Navbar } from "@/components/navbar"; 
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Max2TheMax | F1 Predictions",
  description: "Voorspel de F1 races",
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
      <body 
        className={`${geistSans.className} antialiased bg-[#0b0e14] min-h-screen`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {/* De Navbar MOET in Suspense omdat deze client-side hooks (useRouter) gebruikt */}
          <Suspense fallback={<div className="h-16 w-full bg-[#0b0e14] border-b border-white/5" />}>
            <Navbar />
          </Suspense>

          <main className="pt-2">
            <Suspense fallback={
              <div className="p-12 text-white text-center font-bold italic uppercase tracking-widest opacity-20">
                Laden...
              </div>
            }>
              {children}
            </Suspense>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}