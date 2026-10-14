import React from 'react';
import { Search, Eye, UserX, Vote, Sparkles } from 'lucide-react';
import { EVENT_CONFIG } from '../../shared/eventConfig.js';

interface IllustrationProps {
  onRegisterClick?: () => void;
  onExploreClick?: () => void;
}

export const AmongUsIllustration: React.FC<IllustrationProps> = ({ onRegisterClick, onExploreClick }) => {
  return (
    <div className="w-full relative select-none">
      {/* ---------------------------------------------------- */}
      {/* 1. HERO BANNER TITLE & BADGES (DIRECTLY FROM POSTER) */}
      {/* ---------------------------------------------------- */}
      <div className="text-center space-y-3 mb-6">
        {/* Organizer Header matching poster: ADG X MOSAIC */}
        <div className="flex flex-col items-center justify-center gap-1.5">
          <div className="font-arcade text-lg sm:text-2xl tracking-[0.25em] text-[#fdfbf7] flex items-center justify-center gap-2">
            <span>A D G</span>
            <span className="text-[#ff2a4b] font-bold text-xl sm:text-2xl drop-shadow-[0_0_8px_rgba(255,42,75,0.7)]">✕</span>
            <span>M O S A I C</span>
          </div>
          <div className="text-[10px] sm:text-xs font-arcade tracking-[0.2em] text-[#94a3b8] uppercase">
            AI DEVELOPERS GROUP PRESENTS
          </div>
        </div>

        {/* Big Stylized Poster Title D E C E P T I O N */}
        <div className="relative py-2">
          {/* Poster Tagline Above Title */}
          <div className="text-xs sm:text-sm md:text-base font-arcade tracking-[0.18em] text-[#cbd5e1] mb-2 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            ONE OF YOU ISN'T WHO THEY SEEM.
          </div>

          <h1 className="font-pixel text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-wider sm:tracking-widest text-[#fdfbf7] drop-shadow-[3px_3px_0px_#ff2a4b] sm:drop-shadow-[5px_5px_0px_#ff2a4b] uppercase drop-shadow-[0_0_25px_rgba(255,42,75,0.35)]">
            DECEPTION
          </h1>

          {/* Subtitle directly from poster: TRUST NO ONE. */}
          <div className="mt-3">
            <span className="font-arcade text-sm sm:text-lg tracking-[0.3em] font-bold text-[#ff2a4b] drop-shadow-[0_0_10px_rgba(255,42,75,0.6)] animate-pulse">
              TRUST NO ONE.
            </span>
          </div>
        </div>

        {/* Date, Room & Action Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-1">
          <span className="bg-[#131b2e] text-[#fdfbf7] font-pixel text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-[#ff2a4b] shadow-[2px_2px_0_0_#ff2a4b]">
            📅 {EVENT_CONFIG.eventDateDisplay}
          </span>
          <span className="bg-[#131b2e] text-[#fdfbf7] font-arcade text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-[#22314d] shadow-[2px_2px_0_0_#04060a]">
            📍 {EVENT_CONFIG.venue}
          </span>
          <span className="bg-[#ff2a4b] text-white font-arcade text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-[#ff2a4b] shadow-[2px_2px_0_0_#04060a] font-bold">
            👁️ COMPLETE TASKS. VOTE.
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. THE AMONG US MEETING TABLE (VECTOR SVG ILLUSTRATION) */}
      {/* ---------------------------------------------------- */}
      <div className="relative max-w-4xl mx-auto my-6 px-2">
        <svg
          viewBox="0 0 900 480"
          className="w-full h-auto filter drop-shadow-[4px_6px_0px_rgba(17,24,39,0.9)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Table Radial Gradient */}
            <radialGradient id="tableGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00C4DF" />
              <stop offset="60%" stopColor="#008EA2" />
              <stop offset="100%" stopColor="#005B69" />
            </radialGradient>
            <filter id="retroShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="#111827" />
            </filter>
            {/* Clip path for inner table oval disk */}
            <clipPath id="innerTableDisk">
              <ellipse cx="450" cy="315" rx="140" ry="40" />
            </clipPath>
          </defs>

          {/* BACKGROUND AMONG US CHARACTERS AROUND TABLE */}

          {/* Player 1: Green Camo / Military on far left */}
          <g transform="translate(60, 150)">
            <ellipse cx="40" cy="90" rx="36" ry="60" fill="#7CB342" stroke="#111827" strokeWidth="5" />
            <ellipse cx="60" cy="70" rx="22" ry="14" fill="#B2EBF2" stroke="#111827" strokeWidth="4" />
            <path d="M 10 50 Q 40 30 75 50" fill="none" stroke="#558B2F" strokeWidth="10" />
            <ellipse cx="30" cy="130" rx="14" ry="10" fill="#33691E" stroke="#111827" strokeWidth="3" />
          </g>

          {/* Player 2: Orange with Clipboard */}
          <g transform="translate(140, 130)">
            <ellipse cx="45" cy="95" rx="38" ry="65" fill="#FB8C00" stroke="#111827" strokeWidth="5" />
            <ellipse cx="65" cy="75" rx="24" ry="15" fill="#80DEEA" stroke="#111827" strokeWidth="4" />
            {/* Clipboard */}
            <rect x="70" y="80" width="30" height="42" rx="3" fill="#D7CCC8" stroke="#111827" strokeWidth="4" />
            <rect x="78" y="75" width="14" height="7" rx="2" fill="#795548" stroke="#111827" strokeWidth="2" />
            <line x1="75" y1="92" x2="94" y2="92" stroke="#111827" strokeWidth="2" />
            <line x1="75" y1="102" x2="94" y2="102" stroke="#111827" strokeWidth="2" />
          </g>

          {/* Player 3: Cyan with flower accessory */}
          <g transform="translate(250, 115)">
            <ellipse cx="45" cy="100" rx="40" ry="68" fill="#00BCD4" stroke="#111827" strokeWidth="5" />
            <ellipse cx="65" cy="80" rx="26" ry="16" fill="#E0F7FA" stroke="#111827" strokeWidth="4" />
            {/* Pink Flower */}
            <circle cx="28" cy="40" r="10" fill="#E5005A" stroke="#111827" strokeWidth="3" />
            <circle cx="28" cy="40" r="4" fill="#F4C430" />
          </g>

          {/* Player 4: THE RED CAPTAIN (CENTER SUSPECT) */}
          <g transform="translate(365, 80)">
            {/* Body */}
            <ellipse cx="65" cy="130" rx="55" ry="90" fill="#D32F2F" stroke="#111827" strokeWidth="6" />
            {/* Big Visor */}
            <ellipse cx="90" cy="105" rx="36" ry="22" fill="#80DEEA" stroke="#111827" strokeWidth="5" />
            <ellipse cx="96" cy="100" rx="14" ry="7" fill="#FFFFFF" opacity="0.8" />
            {/* Military Captain Hat */}
            <path d="M 25 75 Q 65 30 115 75 Z" fill="#880E4F" stroke="#111827" strokeWidth="5" />
            <rect x="20" y="72" width="100" height="12" rx="3" fill="#111827" />
            <ellipse cx="70" cy="55" rx="12" ry="8" fill="#F4C430" stroke="#111827" strokeWidth="3" />
            {/* Golden Epaulettes */}
            <path d="M 20 120 L 45 120 L 40 135 L 15 135 Z" fill="#F4C430" stroke="#111827" strokeWidth="3" />
          </g>

          {/* Player 5: White Nurse Crewmate */}
          <g transform="translate(485, 110)">
            <ellipse cx="45" cy="100" rx="40" ry="68" fill="#ECEFF1" stroke="#111827" strokeWidth="5" />
            <ellipse cx="65" cy="80" rx="26" ry="16" fill="#80DEEA" stroke="#111827" strokeWidth="4" />
            {/* Nurse Mask & Cap */}
            <rect x="42" y="75" width="48" height="28" rx="4" fill="#CFD8DC" stroke="#111827" strokeWidth="3" />
            <path d="M 30 45 L 75 45 L 70 30 L 35 30 Z" fill="#FFFFFF" stroke="#111827" strokeWidth="3" />
            <path d="M 52 33 L 52 41 M 48 37 L 56 37" stroke="#E5005A" strokeWidth="3" />
          </g>

          {/* Player 6: Chef Crewmate with Tall Toque */}
          <g transform="translate(565, 125)">
            <ellipse cx="45" cy="95" rx="38" ry="65" fill="#CFD8DC" stroke="#111827" strokeWidth="5" />
            <ellipse cx="65" cy="75" rx="24" ry="15" fill="#80DEEA" stroke="#111827" strokeWidth="4" />
            {/* Chef Hat */}
            <path d="M 30 45 C 20 15 75 15 65 45 Z" fill="#FFFFFF" stroke="#111827" strokeWidth="4" />
            <rect x="28" y="42" width="40" height="12" fill="#ECEFF1" stroke="#111827" strokeWidth="3" />
            {/* Chef Buttons */}
            <circle cx="45" cy="120" r="3" fill="#111827" />
            <circle cx="45" cy="132" r="3" fill="#111827" />
          </g>

          {/* Player 7: Suited Crewmate with Tie */}
          <g transform="translate(650, 135)">
            <ellipse cx="45" cy="95" rx="38" ry="65" fill="#90A4AE" stroke="#111827" strokeWidth="5" />
            <ellipse cx="65" cy="75" rx="24" ry="15" fill="#80DEEA" stroke="#111827" strokeWidth="4" />
            {/* Suit Lapels & Tie */}
            <polygon points="35,100 55,100 45,135" fill="#111827" />
            <polygon points="42,100 48,100 45,125" fill="#D32F2F" />
          </g>

          {/* Player 8: Green Hoodie on Right */}
          <g transform="translate(735, 150)">
            <ellipse cx="40" cy="90" rx="36" ry="60" fill="#2E7D32" stroke="#111827" strokeWidth="5" />
            <ellipse cx="58" cy="70" rx="22" ry="14" fill="#80DEEA" stroke="#111827" strokeWidth="4" />
            {/* White Hoodie Drawstrings */}
            <line x1="38" y1="90" x2="38" y2="120" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="46" y1="90" x2="46" y2="120" stroke="#FFFFFF" strokeWidth="3" />
          </g>

          {/* ---------------------------------------------------- */}
          {/* THE MAIN EMERGENCY MEETING TABLE (CENTRAL DISK) */}
          {/* ---------------------------------------------------- */}
          {/* Table Pedestal / Base */}
          <ellipse cx="450" cy="330" rx="320" ry="110" fill="#003B46" stroke="#111827" strokeWidth="6" />
          <path d="M 130 330 Q 450 420 770 330 L 750 370 Q 450 470 150 370 Z" fill="#002229" stroke="#111827" strokeWidth="6" />

          {/* Main Table Surface */}
          <ellipse cx="450" cy="315" rx="310" ry="95" fill="url(#tableGlow)" stroke="#111827" strokeWidth="7" />

          {/* Table Center Ring */}
          <ellipse cx="450" cy="315" rx="190" ry="55" fill="#008EA2" stroke="#111827" strokeWidth="4" />
          <ellipse cx="450" cy="315" rx="140" ry="40" fill="#002b33" stroke="#111827" strokeWidth="3" />

          {/* Table Center Pedestal Official ADG Logo (Fitted to inner circle with exact oval perspective angle) */}
          <g clipPath="url(#innerTableDisk)">
            <image 
              href="/adg-logo-full.png" 
              x="310" 
              y="275" 
              width="280" 
              height="80" 
              preserveAspectRatio="none"
            />
          </g>
          {/* Inner circle rim stroke */}
          <ellipse cx="450" cy="315" rx="140" ry="40" fill="none" stroke="#111827" strokeWidth="3.5" />
        </svg>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. THE 4 PILLARS (EXACT CARDS FROM THE POSTER) */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto my-8">
        {/* Card 1: Tasks (Red) */}
        <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] p-5 text-center flex flex-col items-center hover:translate-y-[-2px] transition-transform">
          <div className="w-16 h-16 bg-[#ff2a4b] border-2 border-[#ff2a4b] shadow-[0_0_12px_rgba(255,42,75,0.4)] flex items-center justify-center text-white mb-3">
            <Search className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h4 className="font-pixel text-xs sm:text-sm text-[#ff2a4b] tracking-wider mb-2">
            COMPLETE TASKS
          </h4>
          <p className="text-xs text-[#94a3b8] font-body">
            Execute technical and physical lab tasks across Room 028 before the timer runs out.
          </p>
        </div>

        {/* Card 2: Observation (Cyan) */}
        <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] p-5 text-center flex flex-col items-center hover:translate-y-[-2px] transition-transform">
          <div className="w-16 h-16 bg-[#00AFC6] border-2 border-[#00AFC6] shadow-[0_0_12px_rgba(0,175,198,0.4)] flex items-center justify-center text-white mb-3">
            <Eye className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h4 className="font-pixel text-xs sm:text-sm text-[#00AFC6] tracking-wider mb-2">
            WATCH CLOSELY
          </h4>
          <p className="text-xs text-[#94a3b8] font-body">
            Track player movements, note who fakes station work, and spot suspicious routes.
          </p>
        </div>

        {/* Card 3: Suspicious Player / Imposter (Amber) */}
        <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] p-5 text-center flex flex-col items-center hover:translate-y-[-2px] transition-transform">
          <div className="w-16 h-16 bg-[#d97706] border-2 border-[#d97706] shadow-[0_0_12px_rgba(217,119,6,0.4)] flex items-center justify-center text-white mb-3">
            <UserX className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h4 className="font-pixel text-xs sm:text-sm text-[#fbbf24] tracking-wider mb-2">
            FIND THE IMPOSTER
          </h4>
          <p className="text-xs text-[#94a3b8] font-body">
            Piece together clues, cross-check alibis, and unmask the saboteur sabotaging your team.
          </p>
        </div>

        {/* Card 4: Vote (Green) */}
        <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] p-5 text-center flex flex-col items-center hover:translate-y-[-2px] transition-transform">
          <div className="w-16 h-16 bg-[#10b981] border-2 border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.4)] flex items-center justify-center text-white mb-3">
            <Vote className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h4 className="font-pixel text-xs sm:text-sm text-[#10b981] tracking-wider mb-2">
            VOTE
          </h4>
          <p className="text-xs text-[#94a3b8] font-body">
            Convene emergency meetings at the main desk and eject the saboteur before time expires.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. POSTER MOTIFS: TRUST NO ONE & VENUE 028 */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 my-6">
        <div className="w-full sm:w-auto text-center bg-[#ff2a4b]/15 text-[#ff2a4b] font-pixel text-xs sm:text-base px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-[#ff2a4b] shadow-[0_0_15px_rgba(255,42,75,0.25)] tracking-normal sm:tracking-widest uppercase">
          🚨 TRUST NO ONE.
        </div>
        <div className="w-full sm:w-auto text-center bg-[#131b2e] text-[#fdfbf7] font-pixel text-[11px] sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 border-2 border-[#22314d] shadow-[3px_3px_0_0_#04060a] tracking-normal sm:tracking-wider font-bold">
          📍 VENUE: {EVENT_CONFIG.venue}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mt-6">
        {onRegisterClick && (
          <button
            onClick={onRegisterClick}
            className="w-full sm:w-auto bg-[#ff2a4b] hover:bg-[#e50914] text-white font-arcade text-xs sm:text-base px-6 sm:px-8 py-3.5 border-2 border-[#ff2a4b] shadow-[0_0_20px_rgba(255,42,75,0.45)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>REGISTER YOUR SQUAD (5–6 PLAYERS)</span>
          </button>
        )}
        {onExploreClick && (
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto bg-[#131b2e] hover:bg-[#1a243e] text-[#fdfbf7] font-arcade text-xs sm:text-base px-5 sm:px-6 py-3.5 border-2 border-[#22314d] shadow-[3px_3px_0_0_#04060a] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] text-center transition-all cursor-pointer"
          >
            EXPLORE GAME RULES
          </button>
        )}
      </div>
    </div>
  );
};

export default AmongUsIllustration;
