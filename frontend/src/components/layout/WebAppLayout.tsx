import React from 'react';

interface WebAppLayoutProps {
  children: React.ReactNode;
}

export default function WebAppLayout({ children }: WebAppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900">
      {children}
    </div>
  );
} 