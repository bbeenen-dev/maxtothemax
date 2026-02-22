import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <section className="admin-container">
      {/* Je kunt hier eventueel een specifieke admin-sidebar toevoegen */}
      {children}
    </section>
  );
}