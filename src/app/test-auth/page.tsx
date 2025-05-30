import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development-only';

export default async function TestAuthPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token');

  let tokenInfo = null;
  let decodedToken = null;

  if (authToken) {
    try {
      decodedToken = jwt.verify(authToken.value, JWT_SECRET);
      tokenInfo = 'Valid token';
    } catch (error) {
      tokenInfo = 'Invalid token';
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      <div className="space-y-4">
        <div>
          <strong>Auth Token Cookie:</strong> {authToken ? 'Present' : 'Not found'}
        </div>
        {authToken && (
          <div>
            <strong>Token Value (first 50 chars):</strong> {authToken.value.substring(0, 50)}...
          </div>
        )}
        <div>
          <strong>Token Status:</strong> {tokenInfo || 'No token'}
        </div>
        {decodedToken && (
          <div>
            <strong>Decoded Token:</strong>
            <pre className="bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(decodedToken, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 