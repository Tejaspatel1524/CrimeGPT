import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#070B14]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className="transition-all duration-200 min-h-screen flex flex-col"
        style={{ marginLeft: collapsed ? 68 : 260 }}
      >
        <Header />
        <main className="flex-1 p-6 max-w-[1920px] w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
