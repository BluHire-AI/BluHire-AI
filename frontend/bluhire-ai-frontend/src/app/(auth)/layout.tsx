import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">BluHire-AI</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Intelligent HR Management System</p>
        </div>
        {children}
      </div>
    </div>
  );
}
