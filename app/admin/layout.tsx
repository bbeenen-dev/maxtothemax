// app/admin/layout.tsx
import React from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root">
      {/* Een kleine admin-topbar */}
      <div className="bg-blue-600 py-2 px-6 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Admin Mode</span>
        <Link href="/" className="text-[10px] font-black uppercase bg-black/20 hover:bg-black/40 px-3 py-1 rounded text-white transition-all">
          Verlaat Admin &rarr;
        </Link>
      </div>
      {children}
    </div>
  );
}