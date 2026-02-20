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
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* De Navbar moet in Suspense staan omdat het 'usePathname' gebruikt. 
            Dit voorkomt de "Uncached data was accessed outside of <Suspense>" error bij de deploy.
          */}
          <Suspense fallback={<div className="h-16 w-full bg-[#0b0e14] border-b border-white/10" />}>
            <Navbar />
          </Suspense>

          <Suspense fallback={<div className="p-12 text-white text-center font-bold italic uppercase tracking-widest opacity-50">Laden...</div>}>
            <main>
              {children}
            </main>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}