import React, { useState, useRef, useEffect } from 'react';
import {
  Droplet,
  Bell,
  CheckCircle2,
  AlertTriangle,
  User as UserIcon,
  RefreshCw,
  LogOut,
  Settings as SettingsIcon,
  Menu,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusPill } from './StatusPill';

interface NavbarProps {
  onToggleSidebar?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/**
 * Adapted from 21st.dev @21st/notification-menu & @21st/navbar-header
 * Clean, glass top navigation for farmers with water-drop brand mark, live connection indicator,
 * notification bell, and farmer profile.
 */
export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, activeTab: _activeTab, setActiveTab }) => {
  const {
    connection,
    lastUpdated,
    unreadAlertCount,
    alerts,
    ackAlert,
    currentUser,
    logout,
    refreshLive,
    isLiveLoading,
  } = useApp();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const alertMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (alertMenuRef.current && !alertMenuRef.current.contains(e.target as Node)) {
        setIsAlertOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format last updated relative text
  const formatTimeAgo = () => {
    if (!lastUpdated) return 'Syncing...';
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <header className="bg-slate-950/85 backdrop-blur-xl border-b border-teal-800/40 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Brand with Water Drop */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 shadow-glow-cyan group-hover:scale-105 transition-transform">
              <Droplet className="w-5 h-5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">AquaCare</span>
                <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-xs">
                  Live Farm
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block italic">
                Pond #1 &bull; <em>Macrobrachium rosenbergii</em>
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Connection Indicator */}
        <div className="flex items-center gap-2">
          <StatusPill status={connection.status} size="sm" />
          <button
            onClick={() => refreshLive()}
            disabled={isLiveLoading}
            className="text-slate-400 hover:text-cyan-400 p-1.5 rounded-xl hover:bg-slate-900 transition-colors flex items-center gap-1.5 text-xs"
            title={`Last sync: ${formatTimeAgo()}. Click to refresh.`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline text-slate-400 text-[11px]">{formatTimeAgo()}</span>
          </button>
        </div>

        {/* Right: Notification Bell & Farmer Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* In-app Notification Bell Dropdown */}
          <div className="relative" ref={alertMenuRef}>
            <button
              onClick={() => setIsAlertOpen(!isAlertOpen)}
              className="relative p-2 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-900 focus:outline-none transition-colors border border-transparent hover:border-teal-800/40"
              aria-label="Alerts Notification"
            >
              <Bell className="w-5 h-5" />
              {unreadAlertCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-sm animate-pulse">
                  {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel (Frosted Glass) */}
            {isAlertOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel shadow-2xl py-3 text-slate-900 z-50">
                <div className="px-4 pb-2 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Pond Notifications</span>
                    {unreadAlertCount > 0 && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                        {unreadAlertCount} unread
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setIsAlertOpen(false);
                      setActiveTab('alerts');
                    }}
                    className="text-xs text-cyan-700 hover:text-cyan-900 font-bold"
                  >
                    View All
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {alerts.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      <span>All water conditions are currently safe. No active alerts.</span>
                    </div>
                  ) : (
                    alerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 text-xs transition-colors hover:bg-white/60 flex items-start justify-between gap-2 ${
                          !alert.acknowledged ? 'bg-amber-50/60 font-medium' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                alert.severity === 'CRITICAL'
                                  ? 'bg-red-100 text-red-800'
                                  : alert.severity === 'HIGH'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {alert.severity}
                            </span>
                            <span className="font-bold text-slate-800">{alert.rule_name}</span>
                          </div>
                          <p className="text-slate-600 leading-snug">{alert.explanation}</p>
                          <p className="text-[11px] text-cyan-800 font-bold">
                            Action: {alert.recommended_action}
                          </p>
                        </div>
                        {!alert.acknowledged && (
                          <button
                            onClick={() => ackAlert(alert.id)}
                            className="text-[11px] text-cyan-700 hover:text-cyan-900 font-bold whitespace-nowrap p-1"
                          >
                            Ack
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 pt-2 border-t border-slate-200/80 bg-slate-50/70 rounded-b-2xl flex items-center justify-between text-[11px] text-slate-500">
                  <span>Pond: {currentUser?.pond_ids?.[0] || 'pond-01'}</span>
                  <span>Alert cooldown: 10m</span>
                </div>
              </div>
            )}
          </div>

          {/* Farmer Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-900 focus:outline-none transition-colors border border-transparent hover:border-teal-800/40"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-teal-800 flex items-center justify-center text-cyan-200 border border-teal-700/60 shadow-inner">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden md:block text-left text-xs">
                <p className="font-bold text-slate-200 leading-tight">
                  {currentUser?.full_name || 'Ramesh Kumar'}
                </p>
                <p className="text-[10px] text-cyan-400 uppercase font-black tracking-wider">
                  Farmer • Pond #1
                </p>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel shadow-2xl py-2 text-slate-900 z-50">
                <div className="px-4 py-2 border-b border-slate-200">
                  <p className="font-bold text-sm text-slate-900">{currentUser?.full_name}</p>
                  <p className="text-xs text-slate-500">{currentUser?.email}</p>
                  <p className="text-xs text-cyan-800 font-medium mt-1">
                    Assigned: {currentUser?.pond_ids?.join(', ') || 'Pond 1'}
                  </p>
                </div>

                <div className="p-1 border-b border-slate-200">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setActiveTab('settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4 text-slate-500" />
                    <span>Pond & Farm Settings</span>
                  </button>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
