"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="sticky top-0 z-[100] w-full bg-[#0b0e14]/80 backdrop-blur-md border-b border-white/10 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center gap-2 md:gap-4">
        
        <div className="w-10">
          {!isHome && (
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white font-bold"
            >
              ←
            </button>
          )}
        </div>

        <Link 
          href="/" 
          className={`p-2 px-4 rounded-xl transition-all text-xs font-bold uppercase ${
            pathname === "/" 
              ? "text-white bg-red-600" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          Home
        </Link>

        <Link 
          href="/races" 
          className={`p-2 px-4 rounded-xl transition-all text-xs font-bold uppercase ${
            pathname === "/races" 
              ? "text-white bg-red-600" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          Kalender
        </Link>

        <div className="ml-auto pr-2">
          <span className="text-xs font-black italic uppercase tracking-tighter text-red-600">
            Max<span className="text-white">2</span>TheMax
          </span>
        </div>
      </div>
    </nav>
  );
}