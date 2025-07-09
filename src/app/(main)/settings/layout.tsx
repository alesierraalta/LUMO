import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Settings - LUMO',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '2rem' }}>
      <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <Link href="/settings/profile">Profile</Link>
        <Link href="/settings/users">Users</Link>
      </nav>
      <div>{children}</div>
    </div>
  );
}
