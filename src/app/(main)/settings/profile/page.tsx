import React from 'react';
import { getCurrentUser } from '@/lib/auth-client';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Profile</h1>
      {user ? (
        <div>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
