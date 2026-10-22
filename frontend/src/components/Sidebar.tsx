import React from 'react';
import {
  LayoutDashboard,
  BellRing,
  LineChart,
  Settings,
  Cpu,
  X,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Adapted from 21st.dev @21st/glass-sidebar
 * Translucent dark-teal sidebar tailored for prawn farmers with active glow indicators.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { unreadAlertCount, connection, currentUser } = useApp();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: BellRing,
      badge: unreadAlertCount > 0 ? String(unreadAlertCount) : null,
      badgeColor: 'bg-red-500 text-white animate-pulse',
    },
    {
      id: 'trends',
      label: 'Trends & History',
      icon: LineChart,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Pond Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-16 z-40 md:z-10 h-[calc(100vh-4rem)] bg-slate-950/90 backdrop-blur-xl border-r border-teal-800/30 shadow-2xl flex flex-col justify-between transition-all duration-300 ease-in-out text-slate-100 ${
          isOpenMobile ? 'left-0 w-64' : '-left-64 md:left-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Top Navigation */}
        <div className="p-3">
          {/* Mobile Close Button */}
          <div className="flex md:hidden items-center justify-between px-2 pb-2 mb-3 border-b border-teal-900/40">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-cyan-400 fill-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">AquaCare</span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500/25 to-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-glow-cyan'
                      : 'text-slate-300 hover:bg-slate-900/60 hover:text-white border border-transparent'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-cyan-400' : 'text-slate-400'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${item.badgeColor || ''}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isCollapsed && item.badge && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-950 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Farmer Pond Overview & Collapse Toggle */}
        <div className="p-3 border-t border-teal-900/30 bg-slate-950/80">
          {!isCollapsed ? (
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-teal-800/30 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 truncate">
                  {currentUser?.pond_ids?.[0] ? 'Prawn Pond #1' : 'AquaCare Pond'}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                  {connection.status === 'CONNECTED' ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Wifi className="w-3 h-3" /> Live
                    </span>
                  ) : connection.status === 'STALE' ? (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Clock className="w-3 h-3" /> Stale
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-400">
                      <WifiOff className="w-3 h-3" /> Offline
                    </span>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Prawn Habitat: <em>Macrobrachium</em>
              </p>
              <button
                onClick={() => handleNavClick('settings')}
                className="w-full text-left text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold pt-1 border-t border-teal-900/40 block"
              >
                View device & pond specs &rarr;
              </button>
            </div>
          ) : (
            <div className="flex justify-center py-2" title="ESP32 Edge Device Status">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
          )}

          {/* Desktop Collapse Trigger */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-full mt-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors text-xs gap-1.5"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="font-medium">Collapse menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
