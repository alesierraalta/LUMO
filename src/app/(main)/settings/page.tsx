import Link from 'next/link';
import React from 'react';

export const metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Settings</h1>
      <nav style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Link href="/settings/profile">Profile</Link>
        <Link href="/settings/users">Users</Link>
      </nav>
    </div>
  );
}
