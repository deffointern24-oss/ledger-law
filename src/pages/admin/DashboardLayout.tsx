// src/pages/admin/DashboardLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
