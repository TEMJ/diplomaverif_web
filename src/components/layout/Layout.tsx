import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <header className="fixed top-0 left-0 right-0 z-50 h-16">
        <Navbar />
      </header>
      <div className="fixed top-16 left-0 bottom-0 z-40 w-64 overflow-hidden">
        <Sidebar />
      </div>
      <main className="fixed top-16 left-64 right-0 bottom-0 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
};
