import React from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  GraduationCap,
  Users,
  Presentation,
  CheckCircle2,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { TeachingAssistant } from '../types';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentRole: 'faculty' | 'student';
  onChangeRole: (role: 'faculty' | 'student') => void;
  isOffline: boolean;
  onToggleOfflineMode: () => void;
  isClassroomConnected: boolean;
  onOpenClassroomModal: () => void;
  activeRoomPin?: string | null;
  onReturnToLobby?: () => void;
  activeTa?: TeachingAssistant | null;
  onOpenTaAuthModal?: () => void;
  onLogoutTa?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  soundEnabled,
  onToggleSound,
  currentRole,
  onChangeRole,
  isOffline,
  onToggleOfflineMode,
  isClassroomConnected,
  onOpenClassroomModal,
  activeRoomPin,
  onReturnToLobby,
  activeTa,
  onOpenTaAuthModal,
  onLogoutTa,
}) => {
  return (
    <header
      id="app-navbar"
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-200 ${
        darkMode
          ? 'bg-slate-900/90 border-slate-800 text-slate-100'
          : 'bg-white/90 border-slate-200 text-slate-800'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <button
            id="brand-home-btn"
            onClick={onReturnToLobby}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Presentation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Live Classroom Quiz
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  AI-Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Real-Time Interactive Assessment & Grade Sync
              </p>
            </div>
          </button>
        </div>

        {/* Role Switcher & Nav Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active PIN Tag if in session */}
          {activeRoomPin && (
            <div className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black font-mono shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE PIN: {activeRoomPin}
            </div>
          )}

          {/* Active TA Badge if logged in */}
          {activeTa && (
            <div
              id="active-ta-badge"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs shadow-sm"
            >
              <span className="text-base">{activeTa.avatar}</span>
              <div className="leading-tight">
                <p className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                  <span>TA: {activeTa.name}</span>
                </p>
                <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                  {activeTa.rollNo || 'Teaching Assistant'}
                </p>
              </div>
              {onLogoutTa && (
                <button
                  id="ta-logout-btn"
                  onClick={onLogoutTa}
                  title="Log out from Teaching Assistant access"
                  className="ml-1 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Role Switcher Tabs */}
          <div
            id="role-switch-container"
            className={`p-1 rounded-2xl flex items-center gap-1 border ${
              darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              id="faculty-role-btn"
              onClick={() => {
                sound.playClick();
                if (!activeTa) {
                  onOpenTaAuthModal?.();
                } else {
                  onChangeRole('faculty');
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                currentRole === 'faculty'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
              title={activeTa ? `Signed in as TA: ${activeTa.name}` : 'Requires Teaching Assistant Access'}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Teacher Host</span>
              <span className="sm:hidden">Teacher</span>
              {!activeTa && (
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100 font-mono font-black">
                  TA Only
                </span>
              )}
            </button>
            <button
              id="student-role-btn"
              onClick={() => {
                sound.playClick();
                onChangeRole('student');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                currentRole === 'student'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Student View</span>
              <span className="sm:hidden">Student</span>
            </button>
          </div>

          {/* Google Classroom Button */}
          <button
            id="classroom-sync-btn"
            onClick={() => {
              sound.playClick();
              onOpenClassroomModal();
            }}
            title="Google Classroom Integration"
            className={`hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black border transition-colors ${
              isClassroomConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shadow-sm'
                : darkMode
                ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                isClassroomConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
              }`}
            />
            <span>{isClassroomConnected ? 'Classroom Linked' : 'Link Classroom'}</span>
          </button>

          {/* Offline Mode Toggle */}
          <button
            id="offline-mode-toggle-btn"
            onClick={() => {
              sound.playClick();
              onToggleOfflineMode();
            }}
            title={isOffline ? 'Offline Mode Active (Cached Quizzes)' : 'Online Real-Time Mode'}
            className={`p-2.5 rounded-2xl border text-xs font-medium transition-colors ${
              isOffline
                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700 shadow-sm'
                : darkMode
                ? 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            {isOffline ? <WifiOff className="w-4 h-4 text-amber-500" /> : <Wifi className="w-4 h-4" />}
          </button>

          {/* Sound FX Toggle */}
          <button
            id="sound-fx-toggle-btn"
            onClick={() => {
              onToggleSound();
              sound.playClick();
            }}
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
            className={`p-2.5 rounded-2xl border transition-colors ${
              darkMode
                ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Dark Mode Toggle */}
          <button
            id="dark-mode-toggle-btn"
            onClick={() => {
              sound.playClick();
              onToggleDarkMode();
            }}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode (Eye Strain Reduction)'}
            className={`p-2.5 rounded-2xl border transition-colors ${
              darkMode
                ? 'bg-slate-800/80 text-amber-400 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
