import React from 'react';
import { Pause } from 'lucide-react';

interface CircularCountdownTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  isPaused?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  showLabels?: boolean;
  subtitle?: string;
}

export const CircularCountdownTimer: React.FC<CircularCountdownTimerProps> = ({
  remainingSeconds,
  totalSeconds,
  isPaused = false,
  size = 'md',
  className = '',
  showLabels = true,
  subtitle,
}) => {
  // Ensure safe numbers
  const safeTotal = Math.max(1, totalSeconds || 30);
  const safeRemaining = Math.max(0, remainingSeconds);
  const fraction = Math.max(0, Math.min(1, safeRemaining / safeTotal));

  // Determine size configuration
  const config = {
    sm: {
      dimension: 52,
      strokeWidth: 4.5,
      center: 26,
      radius: 20,
      textSize: 'text-base',
      unitSize: 'text-[9px]',
      badgeSize: 'text-[8px]',
      iconSize: 'w-2.5 h-2.5',
    },
    md: {
      dimension: 76,
      strokeWidth: 6,
      center: 38,
      radius: 30,
      textSize: 'text-2xl',
      unitSize: 'text-[10px]',
      badgeSize: 'text-[9px]',
      iconSize: 'w-3 h-3',
    },
    lg: {
      dimension: 96,
      strokeWidth: 7,
      center: 48,
      radius: 39,
      textSize: 'text-3xl',
      unitSize: 'text-xs',
      badgeSize: 'text-[10px]',
      iconSize: 'w-3.5 h-3.5',
    },
    hero: {
      dimension: 120,
      strokeWidth: 8,
      center: 60,
      radius: 49,
      textSize: 'text-4xl',
      unitSize: 'text-xs',
      badgeSize: 'text-[11px]',
      iconSize: 'w-4 h-4',
    },
  }[size];

  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference * (1 - fraction);

  // Status & Color states
  const isUrgent = safeRemaining <= 5;
  const isWarning = !isUrgent && (safeRemaining <= 10 || fraction <= 0.35);

  let strokeColor1 = '#6366f1'; // Indigo-500
  let strokeColor2 = '#3b82f6'; // Blue-500
  let textColorClass = 'text-indigo-600 dark:text-indigo-400';
  let glowClass = '';

  if (isUrgent) {
    strokeColor1 = '#f43f5e'; // Rose-500
    strokeColor2 = '#ef4444'; // Red-500
    textColorClass = 'text-rose-500 dark:text-rose-400';
    glowClass = 'drop-shadow-[0_0_10px_rgba(244,63,94,0.55)]';
  } else if (isWarning) {
    strokeColor1 = '#f59e0b'; // Amber-500
    strokeColor2 = '#ea580c'; // Orange-600
    textColorClass = 'text-amber-500 dark:text-amber-400';
    glowClass = 'drop-shadow-[0_0_6px_rgba(245,158,11,0.35)]';
  }

  const gradientId = `timer-gradient-${size}-${isUrgent ? 'urgent' : isWarning ? 'warning' : 'normal'}`;

  return (
    <div
      id="circular-countdown-timer-container"
      className={`relative inline-flex flex-col items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: config.dimension, height: config.dimension }}
    >
      <svg
        className={`w-full h-full -rotate-90 origin-center transition-all ${glowClass}`}
        viewBox={`0 0 ${config.dimension} ${config.dimension}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={strokeColor1} />
            <stop offset="100%" stopColor={strokeColor2} />
          </linearGradient>
        </defs>

        {/* Background Track Circle */}
        <circle
          cx={config.center}
          cy={config.center}
          r={config.radius}
          fill="none"
          strokeWidth={config.strokeWidth}
          className="stroke-slate-200/80 dark:stroke-slate-800"
        />

        {/* Foreground Progress Circle */}
        <circle
          cx={config.center}
          cy={config.center}
          r={config.radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: isPaused
              ? 'none'
              : 'stroke-dashoffset 0.9s linear, stroke 0.3s ease',
          }}
        />
      </svg>

      {/* Center Numerical Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <div className="flex items-baseline justify-center leading-none">
          <span
            className={`font-black font-mono tracking-tighter ${config.textSize} ${textColorClass} ${
              isUrgent && safeRemaining > 0 ? 'animate-pulse' : ''
            }`}
          >
            {safeRemaining}
          </span>
          {showLabels && (
            <span className={`font-black text-slate-400 dark:text-slate-500 ml-0.5 ${config.unitSize}`}>
              s
            </span>
          )}
        </div>

        {/* Paused or Status Micro-indicator */}
        {isPaused ? (
          <div className="flex items-center gap-0.5 mt-0.5 px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-black tracking-widest uppercase text-[8px]">
            <Pause className={config.iconSize} />
            <span className="hidden sm:inline">PAUSED</span>
          </div>
        ) : subtitle ? (
          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
};
