import React from 'react';
import { ShieldCheck, MapPin, Calendar, Heart, Terminal, Mail, HelpCircle } from 'lucide-react';
import { EVENT_CONFIG } from '../../shared/eventConfig.js';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="bg-[#070a13] text-white border-t-2 border-[#22314d] pt-12 pb-8 mt-16 relative overflow-hidden">
      {/* Decorative top accent line with poster colors */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ff2a4b] via-[#e50914] to-[#00AFC6] shadow-[0_0_10px_rgba(255,42,75,0.5)]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Event Identity */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img 
                  src="/adg-logo-full.png" 
                  alt="ADG Logo" 
                  className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(0,175,198,0.3)]"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/adg-logo.png'; }}
                />
              </div>
              <div>
                <h3 className="font-arcade text-2xl tracking-widest text-[#fdfbf7] drop-shadow-[0_0_8px_rgba(255,42,75,0.3)]">
                  {EVENT_CONFIG.name}
                </h3>
                <p className="text-xs font-arcade text-[#00AFC6]">
                  {EVENT_CONFIG.organizer} • {EVENT_CONFIG.collaboration}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-300 max-w-md font-body leading-relaxed">
              "<span className="tracking-[0.15em] text-[#ff2a4b] font-bold">{EVENT_CONFIG.tagline}</span>"<br></br> An intense live-action social deduction and engineering challenge held at St. Francis Institute of Technology. Complete physical lab tasks, track player alibis, and vote out the imposter before sabotage prevails.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1 bg-[#ff2a4b] text-white text-[11px] font-pixel px-2.5 py-1 border border-[#ff2a4b] shadow-[0_0_8px_rgba(255,42,75,0.3)]">
                <Calendar className="w-3 h-3" /> {EVENT_CONFIG.eventDateDisplay}
              </span>
              <span className="inline-flex items-center gap-1 bg-[#00AFC6] text-white text-[11px] font-pixel px-2.5 py-1 border border-[#00AFC6] font-bold">
                <MapPin className="w-3 h-3" /> {EVENT_CONFIG.venue}
              </span>
              <span className="inline-flex items-center gap-1 bg-[#d97706] text-white text-[11px] font-pixel px-2.5 py-1 border border-[#d97706] font-bold">
                {EVENT_CONFIG.warningQuote}
              </span>
            </div>
          </div>

          {/* Column 2: Navigation & Registration */}
          <div className="space-y-3">
            <h4 className="font-arcade text-sm text-[#F4C430] uppercase tracking-wider border-b border-gray-700 pb-1">
              Event Portal
            </h4>
            <ul className="space-y-2 text-xs font-arcade">
              <li>
                <button onClick={() => {
                  setActiveTab('home');
                  window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                  });
                }} 
                className="hover:text-[#00AFC6] transition-colors">
                  &gt; Home Overview
                </button>
              </li>
              <li>
                <button onClick={() => {
                  setActiveTab('game');
                  window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                  });
                }} 
                className="hover:text-[#00AFC6] transition-colors">
                  &gt; How The Game Works
                </button>
              </li>
              <li>
                <button onClick={() => {
                  setActiveTab('rules');
                  window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                  });
                }} 
                className="hover:text-[#00AFC6] transition-colors">
                  &gt; Official Rules & Ethics
                </button>
              </li>
              <li>
                <button onClick={() => {
                  setActiveTab('faq');
                  window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                  });
                }} 
                className="hover:text-[#00AFC6] transition-colors">
                  &gt; Frequently Asked Questions
                </button>
              </li>
              <li>
                <button onClick={() => {
                  setActiveTab('register');
                  window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                  });}
                } 
                className="hover:text-[#E5005A] text-[#F7E8B5] transition-colors">
                  &gt; Register Squad (5-6 Players)
                </button>
              </li>
              <li>
                <button onClick={() => {
                  setActiveTab('status');
                  window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                  });
                }} 
                className="hover:text-[#00AFC6] transition-colors">
                  &gt; Check Status / Download Pass
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Event Helpdesk & Support */}
          <div className="space-y-3">
            <h4 className="font-arcade text-sm text-[#00AFC6] uppercase tracking-wider border-b border-gray-700 pb-1">
              Event Helpdesk
            </h4>
            <p className="text-xs text-gray-300 font-body">
              Need assistance with team registration, payments, or verification? Contact the ADG coordination desk:
            </p>

            <div className="space-y-2 text-xs font-body pt-1">
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-4 h-4 text-[#F4C430] shrink-0" />
                <span className="font-mono text-[11px]"><a href="mailto:sfit.aidg@gmail.com">sfit.aidg@gmail.com</a></span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4 text-[#E5005A] shrink-0" />
                <span>Room 028, SFIT</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setActiveTab('status');
                  window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                  });
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#F4C430] text-[#111827] font-arcade text-xs px-3 py-2.5 border-2 border-white hover:bg-white transition-all shadow-[2px_2px_0_0_#000]"
              >
                CHECK SQUAD STATUS &gt;
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 font-display">
          <p>© 2026 AI Developers Group (ADG). All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            <span className="text-[#F7E8B5] font-bold">St. Francis Institute of Technology</span> • Room 028
          </p>
          {/* Organisers need a way in that does not mean remembering a URL, but it
              should not sit in a participant's main navigation either. */}
          <p className="mt-2 sm:mt-0 flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab('payments');
                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                  });
              }}
              className="text-gray-600 hover:text-[#F4C430] transition-colors"
            >
              Payment Desk
            </button>
            <button
              onClick={() =>  {
                setActiveTab('admin');
                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                  });
              }}
              className="text-gray-600 hover:text-[#F4C430] transition-colors"
            >
              Organiser Login
            </button>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
