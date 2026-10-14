import React, { useState } from 'react';
import { ShieldAlert, Users, HelpCircle, FileText, CheckCircle2, Lock, Menu, X } from 'lucide-react';
import { EVENT_CONFIG } from '../../shared/eventConfig.js';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Students only. The organiser screens are reachable at ?admin / ?payments -
  // putting them in a participant's navigation only invites people to try the
  // door, and makes the site look like it was built for the organisers.
  const navItems: { id: string; label: string; icon?: React.ComponentType<any> }[] = [
    { id: 'home', label: 'Home' },
    { id: 'game', label: 'Game Info' },
    { id: 'rules', label: 'Rules' },
    { id: 'faq', label: 'FAQ' },
    { id: 'status', label: 'Check Status' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0b0f19] border-b-2 border-[#22314d] shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
      {/* Top Banner Stripe inspired by poster */}
      <div className="bg-[#070a13] border-b border-[#1a253c] text-white px-3 sm:px-4 py-1.5 flex justify-between items-center text-[10px] sm:text-xs font-arcade tracking-normal sm:tracking-wider">
        <div className="flex items-center gap-1.5 sm:gap-2 truncate mr-2">
          <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#ff2a4b] animate-pulse shrink-0 rounded-full shadow-[0_0_6px_#ff2a4b]"></span>
          <span className="truncate text-[#f1f5f9]">ADG PRESENTS</span>
          <span className="hidden sm:inline text-[#fbbf24]">• {EVENT_CONFIG.collaboration}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-[#00AFC6] shrink-0">
          <span className="hidden xs:inline text-[9px] sm:text-xs">{EVENT_CONFIG.eventDateDisplay}</span>
          <span className="bg-[#ff2a4b] text-white px-1.5 sm:px-2 py-0.5 rounded-none font-bold text-[9px] sm:text-[10px] shadow-[0_0_8px_rgba(255,42,75,0.4)]">
            {EVENT_CONFIG.venue}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none min-w-0"
        >
          {/* ADG Official Logo */}
          <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center relative group-hover:scale-105 transition-transform shrink-0">
            <img 
              src="/adg-logo-full.png" 
              alt="ADG Logo" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(0,175,198,0.3)]"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/adg-logo.png'; }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-arcade text-lg sm:text-2xl font-bold tracking-wider sm:tracking-widest text-[#fdfbf7] drop-shadow-[0_0_10px_rgba(255,42,75,0.3)]">
                DECEPTION
              </span>
              <span className="bg-[#ff2a4b] text-white text-[8px] sm:text-[10px] font-pixel px-1 sm:px-1.5 py-0.5 shadow-[0_0_6px_rgba(255,42,75,0.5)]">
                2026
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-[#94a3b8] tracking-wide font-display">
              Room 028 • SFIT
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 text-xs font-bold font-arcade tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#ff2a4b] text-white border-2 border-[#ff2a4b] shadow-[0_0_12px_rgba(255,42,75,0.4)]'
                    : 'bg-transparent text-[#cbd5e1] hover:text-white hover:bg-[#131b2e] hover:border-2 hover:border-[#22314d]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Primary CTA Register Button */}
          <button
            onClick={() => setActiveTab('register')}
            className="ml-2 bg-[#ff2a4b] hover:bg-[#e50914] text-white font-arcade text-xs px-4 py-2 border-2 border-[#ff2a4b] shadow-[0_0_15px_rgba(255,42,75,0.45)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5 animate-bounce-subtle cursor-pointer transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            REGISTER SQUAD
          </button>
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:hidden">
          <button
            onClick={() => setActiveTab('register')}
            className="bg-[#ff2a4b] text-white font-arcade text-[10px] sm:text-xs px-2.5 py-1.5 border-2 border-[#ff2a4b] shadow-[0_0_10px_rgba(255,42,75,0.4)] active:translate-y-[1px]"
          >
            REGISTER
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 sm:p-2 bg-[#131b2e] border-2 border-[#22314d] text-[#f1f5f9] active:translate-y-[1px]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0d1322] border-t-2 border-[#22314d] px-3 sm:px-4 py-3 sm:py-4 space-y-2 shadow-xl">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-3 font-arcade text-xs border-2 min-h-[44px] flex items-center justify-between ${
                activeTab === item.id
                  ? 'bg-[#ff2a4b] text-white border-[#ff2a4b] shadow-[0_0_10px_rgba(255,42,75,0.4)]'
                  : 'bg-[#131b2e] text-[#f1f5f9] border-[#22314d]'
              }`}
            >
              <span>{item.label}</span>
              {activeTab === item.id && <CheckCircle2 className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
