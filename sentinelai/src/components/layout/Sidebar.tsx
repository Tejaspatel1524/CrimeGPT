import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Brain, FileBarChart, MessageSquare,
  Settings, Shield, LogOut, Users, User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleConfig } from '@/config/roleConfig';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  
  // Get role-based configuration
  const roleConfig = getRoleConfig(user?.role || 'viewer');

  return (
    <aside
      style={{ width: collapsed ? '68px' : '280px' }}
      className="fixed top-0 left-0 h-screen z-40 bg-[#070B14] border-r border-[#223047] flex flex-col transition-all duration-200"
    >
      {/* Logo Section */}
      <div 
        style={{ 
          padding: collapsed ? '16px 12px' : '16px',
          borderBottom: '1px solid #223047',
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? '0' : '12px',
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}
      >
        <div 
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(0, 184, 255, 0.1)',
            border: '1px solid rgba(0, 184, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Shield style={{ width: '20px', height: '20px', color: '#00B8FF' }} />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 700, 
              color: '#F8FAFC',
              lineHeight: '1.2',
              letterSpacing: '-0.01em'
            }}>
              CrimeGPT
            </div>
            <div style={{ 
              fontSize: '9px', 
              fontWeight: 600, 
              color: '#98A2B3',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              lineHeight: '1.2',
              marginTop: '2px'
            }}>
              CYBER INTELLIGENCE
            </div>
          </div>
        )}
      </div>

      {/* Navigation - Role-based */}
      <nav 
        style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: collapsed ? '16px 8px' : '16px 12px'
        }}
      >
        {roleConfig.sidebar.map((group, groupIdx) => (
          <div key={groupIdx} style={{ marginTop: groupIdx > 0 ? '20px' : '0' }}>
            {/* Group Label */}
            {!collapsed && (
              <div style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#98A2B3',
                letterSpacing: '0.08em',
                marginBottom: '8px',
                paddingLeft: '12px'
              }}>
                {group.label}
              </div>
            )}
            
            {/* Navigation Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {group.items.map((item, itemIdx) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/cases' && location.pathname.startsWith('/cases'));

                return (
                  <NavLink 
                    key={`${groupIdx}-${itemIdx}`} 
                    to={item.path}
                    style={{ 
                      position: 'relative',
                      display: 'block',
                      textDecoration: 'none'
                    }}
                  >
                    {/* Active Indicator */}
                    {isActive && !collapsed && (
                      <div 
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '3px',
                          height: '28px',
                          background: '#00B8FF',
                          borderRadius: '0 2px 2px 0'
                        }}
                      />
                    )}
                    
                    {/* Item Content */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: collapsed ? '0' : '12px',
                        height: '40px',
                        padding: collapsed ? '0 12px' : '0 16px',
                        borderRadius: '10px',
                        background: isActive ? '#0B1220' : 'transparent',
                        color: isActive ? '#F8FAFC' : '#98A2B3',
                        transition: 'all 150ms ease',
                        cursor: 'pointer',
                        justifyContent: collapsed ? 'center' : 'flex-start'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(11, 18, 32, 0.5)';
                          e.currentTarget.style.color = '#F8FAFC';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#98A2B3';
                        }
                      }}
                    >
                      <item.icon 
                        style={{ 
                          width: '18px', 
                          height: '18px',
                          flexShrink: 0,
                          color: isActive ? '#00B8FF' : 'currentColor'
                        }} 
                      />
                      {!collapsed && (
                        <span style={{ 
                          fontSize: '13px',
                          fontWeight: isActive ? 500 : 400,
                          lineHeight: '1'
                        }}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Admin-only Administration Section */}
        {user?.role === 'admin' && (
          <div style={{ marginTop: '20px' }}>
            {!collapsed && (
              <div style={{ 
                fontSize: '10px', 
                fontWeight: 700, 
                color: '#98A2B3',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                paddingLeft: '16px',
                marginBottom: '8px'
              }}>
                ADMINISTRATION
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* User Management */}
              <NavLink 
                to="/users"
                style={{ 
                  position: 'relative',
                  display: 'block',
                  textDecoration: 'none'
                }}
              >
                {location.pathname === '/users' && !collapsed && (
                  <div 
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '28px',
                      background: '#00B8FF',
                      borderRadius: '0 2px 2px 0'
                    }}
                  />
                )}
                
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? '0' : '12px',
                    height: '40px',
                    padding: collapsed ? '0 12px' : '0 16px',
                    borderRadius: '10px',
                    background: location.pathname === '/users' ? '#0B1220' : 'transparent',
                    color: location.pathname === '/users' ? '#F8FAFC' : '#98A2B3',
                    transition: 'all 150ms ease',
                    cursor: 'pointer',
                    justifyContent: collapsed ? 'center' : 'flex-start'
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== '/users') {
                      e.currentTarget.style.background = 'rgba(11, 18, 32, 0.5)';
                      e.currentTarget.style.color = '#F8FAFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== '/users') {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#98A2B3';
                    }
                  }}
                >
                  <User 
                    style={{ 
                      width: '18px', 
                      height: '18px',
                      flexShrink: 0,
                      color: location.pathname === '/users' ? '#00B8FF' : 'currentColor'
                    }} 
                  />
                  {!collapsed && (
                    <span style={{ 
                      fontSize: '13px',
                      fontWeight: location.pathname === '/users' ? 500 : 400,
                      lineHeight: '1'
                    }}>
                      User Management
                    </span>
                  )}
                </div>
              </NavLink>
              
              {/* Team Management */}
              <NavLink 
                to="/team"
                style={{ 
                  position: 'relative',
                  display: 'block',
                  textDecoration: 'none'
                }}
              >
                {location.pathname === '/team' && !collapsed && (
                  <div 
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '28px',
                      background: '#00B8FF',
                      borderRadius: '0 2px 2px 0'
                    }}
                  />
                )}
                
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? '0' : '12px',
                    height: '40px',
                    padding: collapsed ? '0 12px' : '0 16px',
                    borderRadius: '10px',
                    background: location.pathname === '/team' ? '#0B1220' : 'transparent',
                    color: location.pathname === '/team' ? '#F8FAFC' : '#98A2B3',
                    transition: 'all 150ms ease',
                    cursor: 'pointer',
                    justifyContent: collapsed ? 'center' : 'flex-start'
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== '/team') {
                      e.currentTarget.style.background = 'rgba(11, 18, 32, 0.5)';
                      e.currentTarget.style.color = '#F8FAFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== '/team') {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#98A2B3';
                    }
                  }}
                >
                  <Users 
                    style={{ 
                      width: '18px', 
                      height: '18px',
                      flexShrink: 0,
                      color: location.pathname === '/team' ? '#00B8FF' : 'currentColor'
                    }} 
                  />
                  {!collapsed && (
                    <span style={{ 
                      fontSize: '13px',
                      fontWeight: location.pathname === '/team' ? 500 : 400,
                      lineHeight: '1'
                    }}>
                      Team Management
                    </span>
                  )}
                </div>
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div 
        style={{ 
          borderTop: '1px solid #223047',
          padding: '12px'
        }}
      >
        <NavLink
          to="/"
          onClick={() => localStorage.removeItem('token')}
          style={{ textDecoration: 'none' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? '0' : '12px',
              height: '40px',
              padding: collapsed ? '0 12px' : '0 16px',
              borderRadius: '10px',
              background: 'transparent',
              color: '#98A2B3',
              transition: 'all 150ms ease',
              cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 77, 109, 0.1)';
              e.currentTarget.style.color = '#FF4D6D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#98A2B3';
            }}
          >
            <LogOut style={{ width: '18px', height: '18px' }} />
            {!collapsed && (
              <span style={{ 
                fontSize: '13px',
                fontWeight: 500,
                lineHeight: '1'
              }}>
                Sign Out
              </span>
            )}
          </div>
        </NavLink>
      </div>
    </aside>
  );
}
