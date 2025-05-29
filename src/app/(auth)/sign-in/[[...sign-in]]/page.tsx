"use client";

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to LUMO Inventory
        </h1>
        <p className="text-gray-600">
          Sign in to access your inventory management system
        </p>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <SignIn 
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
              card: "shadow-none",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
            },
          }}
        />
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Don't have an account?{' '}
          <a 
            href="/sign-up" 
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up here
          </a>
        </p>
      </div>
      
      {/* Real Clerk Status Indicator */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Real Clerk Authentication Active</span>
        </div>
      </div>
    </div>
  );
} 