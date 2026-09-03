import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Users,
  Play,
  Pause,
  Clock,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Award,
  Sparkles,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Flame,
  AlertCircle,
  PlusCircle,
  BarChart3,
  Bot,
  Lightbulb,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { LiveRoom, Question, StudentParticipant } from '../types';
import { sound } from '../utils/audio';
import { CircularCountdownTimer } from './CircularCountdownTimer';

interface PresenterLiveViewProps {
  room: LiveRoom;
  onUpdatePhase: (phase: LiveRoom['phase'], questionIndex?: number) => void;
  onOverrideAction: (action: string, payload?: any) => void;
  onPopulateBots: (count: number) => void;
  onSimulateAnswers: () => void;
  onEndSession: () => void;
  darkMode: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const PresenterLiveView: React.FC<PresenterLiveViewProps> = ({
  room,
  onUpdatePhase,
  onOverrideAction,
  onPopulateBots,
  onSimulateAnswers,
  onEndSession,
  darkMode,
  soundEnabled,
  onToggleSound,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [broadcastHintText, setBroadcastHintText] = useState<string>('');
  const [showHintModal, setShowHintModal] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const participantsList = Object.values(room.participants) as StudentParticipant[];
  const currentQ: Question | undefined = room.quiz.questions[room.currentQuestionIndex];
  const totalQuestions = room.quiz.questions.length;

  // Generate QR Code for live room
  useEffect(() => {
    if (typeof window !== 'undefined' && room.pin) {
      try {
        const joinUrl = `${window.location.origin}/?pin=${room.pin}`;
        QRCode.toDataURL(joinUrl, {
          width: 220,
          margin: 1,
          color: {
            dark: '#1e1b4b',
            light: '#ffffff',
          },
        })
          .then((url) => setQrCodeDataUrl(url))
          .catch((err) => console.error(err));
      } catch (err) {
        console.warn('QR code generation failed', err);
      }
    }
  }, [room.pin]);

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen?.().catch?.(() => {});
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.().catch?.(() => {});
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not allowed in iframe sandbox
    }
  };

  // Keyboard Shortcuts for Teacher Slides Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleAdvanceFlow();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePreviousSlide();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        onOverrideAction('toggle_pause');
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [room.phase, room.currentQuestionIndex, totalQuestions]);

  // Advance the structured flow:
  // Lobby -> Q1 (question) -> Percentages (percentages) -> Leaderboard (leaderboard) -> Q2 ... -> Final Results
  const handleAdvanceFlow = () => {
    sound.playClick();
    if (room.phase === 'lobby') {
      onUpdatePhase('question', 0);
      setTimeout(() => onSimulateAnswers(), 1200);
    } else if (room.phase === 'question') {
      sound.playCorrect();
      onUpdatePhase('percentages');
    } else if (room.phase === 'percentages') {
      sound.playClick();
      onUpdatePhase('leaderboard');
    } else if (room.phase === 'leaderboard') {
      if (room.currentQuestionIndex + 1 < totalQuestions) {
        sound.playClick();
        onUpdatePhase('question', room.currentQuestionIndex + 1);
        setTimeout(() => onSimulateAnswers(), 1200);
      } else {
        sound.playFanfare();
        onUpdatePhase('final_results');
      }
    }
  };

  const handlePreviousSlide = () => {
    sound.playClick();
    if (room.phase === 'leaderboard') {
      onUpdatePhase('percentages');
    } else if (room.phase === 'percentages') {
      onUpdatePhase('question');
    } else if (room.phase === 'question' && room.currentQuestionIndex > 0) {
      onUpdatePhase('leaderboard', room.currentQuestionIndex - 1);
    }
  };

  // Calculate answer statistics for the active question
  const answeredCount = participantsList.filter(
    (p) => currentQ && p.answers[currentQ.id] !== undefined
  ).length;

  const optionCounts = [0, 0, 0, 0];
  if (currentQ) {
    participantsList.forEach((p) => {
      const ans = p.answers[currentQ.id];
      if (ans && ans.selectedOptionIndex >= 0 && ans.selectedOptionIndex < 4) {
        optionCounts[ans.selectedOptionIndex] += 1;
      }
    });
  }

  const totalAnswered = Math.max(1, answeredCount);
  const optionPercentages = optionCounts.map((count) =>
    answeredCount > 0 ? Math.round((count / totalAnswered) * 100) : 0
  );

  // Sorted leaderboard ranking
  const sortedParticipants = [...participantsList].sort((a, b) => b.score - a.score);

  const optionColors = [
    {
      bg: 'bg-rose-500 hover:bg-rose-600',
      border: 'border-rose-400',
      light: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      label: 'A',
    },
    {
      bg: 'bg-blue-600 hover:bg-blue-700',
      border: 'border-blue-400',
      light: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      label: 'B',
    },
    {
      bg: 'bg-amber-500 hover:bg-amber-600',
      border: 'border-amber-400',
      light: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      label: 'C',
    },
    {
      bg: 'bg-emerald-600 hover:bg-emerald-700',
      border: 'border-emerald-400',
      light: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      label: 'D',
    },
  ];

  return (
    <div
      ref={containerRef}
      id="presenter-live-container"
      className={`min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 sm:p-6 lg:p-8 transition-colors ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Presenter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-indigo-600 text-white font-mono font-black text-sm shadow-md shadow-indigo-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            PIN: {room.pin}
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 line-clamp-1">{room.quizTitle}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {room.phase === 'lobby'
                ? 'Lobby: Students scanning QR code & entering PIN'
                : `Slide ${room.currentQuestionIndex + 1} of ${totalQuestions} • ${room.phase.toUpperCase()}`}
            </p>
          </div>
        </div>

        {/* Live Metrics & Presenter Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Hint Banner */}
          {room.activeHint && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 text-xs font-bold animate-pulse border border-amber-300 dark:border-amber-700">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Hint: {room.activeHint}</span>
            </div>
          )}

          {/* Student Count Badge */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-black shadow-sm">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>{participantsList.length} Students</span>
          </div>

          {/* Fullscreen Button */}
          <button
            id="fullscreen-toggle-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen Presentation"
            className="p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. LOBBY VIEW: QR Code + Joining Students Bento Roster */}
      {/* ========================================================================= */}
      {room.phase === 'lobby' && (
        <div className="my-auto max-w-6xl mx-auto w-full py-6 space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Left Bento: Giant PIN + QR Code (Spans 5 cols) */}
            <div
              className={`md:col-span-5 bento-card p-8 rounded-3xl border flex flex-col items-center justify-between text-center space-y-6 ${
                darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Instant Classroom Access
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                  Point camera at QR code or enter code on browser
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white shadow-md border border-slate-200/80 dark:border-slate-800">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Scan to Join Quiz"
                    className="w-44 h-44 sm:w-52 sm:h-52 mx-auto rounded-xl"
                  />
                ) : (
                  <div className="w-44 h-44 bg-slate-100 animate-pulse rounded-xl" />
                )}
              </div>

              <div className="space-y-1 w-full pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Class Game PIN
                </p>
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-indigo-600 dark:text-indigo-400">
                  {room.pin}
                </div>
              </div>
            </div>

            {/* Right Bento: Joined Student Roster & Instant Bots Trigger (Spans 7 cols) */}
            <div
              className={`md:col-span-7 bento-card p-7 rounded-3xl border flex flex-col justify-between space-y-5 ${
                darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                      Live Classroom Waiting Room
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {participantsList.length} students connected and ready
                    </p>
                  </div>

                  {/* Instant Bot Simulator Button */}
                  <button
                    id="add-simulated-students-btn"
                    onClick={() => {
                      sound.playClick();
                      onPopulateBots(8);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Add Demo Class (+8)</span>
                  </button>
                </div>

                {/* Joined Roster Grid */}
                <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 min-h-[220px] max-h-[280px] overflow-y-auto">
                  {participantsList.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                      <Users className="w-9 h-9 opacity-30 animate-pulse text-indigo-500" />
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        Waiting for first student to connect...
                      </p>
                      <p className="text-xs">Or click "Add Demo Class" to simulate instant live responses.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {participantsList.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-in zoom-in-95 duration-200"
                        >
                          <span className="text-xl">{p.avatar}</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Start Quiz Action */}
              <button
                id="start-live-quiz-btn"
                onClick={handleAdvanceFlow}
                className="w-full py-4 rounded-2xl text-base font-black text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start Live Quiz Presentation (Q1)</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. QUESTION ACTIVE VIEW: Bento Question Prompt + Countdown + Option Cells */}
      {/* ========================================================================= */}
      {room.phase === 'question' && currentQ && (
        <div className="my-auto max-w-5xl mx-auto w-full py-4 space-y-6 animate-in fade-in duration-300">
          {/* Question Header & Live Answer Counter Bento Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="px-3.5 py-1.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-black text-xs sm:text-sm border border-indigo-200 dark:border-indigo-800">
                Question {room.currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700">
                {currentQ.topicTag || 'Core Concept'}
              </span>
            </div>

            {/* Live Telemetry & Circular Progress Countdown Timer */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Live Responses
                </p>
                <p className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {answeredCount} / {participantsList.length} ({Math.round((answeredCount / Math.max(1, participantsList.length)) * 100)}%)
                </p>
              </div>

              {/* Progress-based Visual Countdown Timer */}
              <div
                id="question-circular-timer-bento"
                className={`p-2.5 rounded-3xl border ${
                  darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
                } flex items-center justify-center`}
              >
                <CircularCountdownTimer
                  remainingSeconds={room.timerRemainingSeconds}
                  totalSeconds={currentQ.timeLimitSeconds || 30}
                  isPaused={room.isTimerPaused}
                  size="md"
                />
              </div>
            </div>
          </div>

          {/* Big Question Prompt Bento Hero */}
          <div
            className={`p-7 sm:p-10 rounded-3xl border ${
              darkMode
                ? 'bg-slate-900/90 border-slate-800 shadow-2xl text-slate-100'
                : 'bg-white border-slate-200/90 shadow-xl text-slate-900'
            }`}
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black leading-snug tracking-tight text-center">
              {currentQ.text}
            </h2>
          </div>

          {/* 4 Interactive Option Bento Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQ.options.map((optText, optIdx) => {
              const col = optionColors[optIdx] || optionColors[0];
              return (
                <div
                  key={optIdx}
                  className={`p-5 rounded-3xl border-2 flex items-center gap-4 transition-all shadow-sm bento-card ${col.light}`}
                >
                  <div
                    className={`w-11 h-11 rounded-2xl text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md ${col.bg}`}
                  >
                    {col.label}
                  </div>
                  <div className="font-extrabold text-sm sm:text-base leading-snug">
                    {optText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LIVE PERCENTAGES & CONCEPT REVIEW VIEW */}
      {/* ========================================================================= */}
      {room.phase === 'percentages' && currentQ && (
        <div className="my-auto max-w-5xl mx-auto w-full py-4 space-y-6 animate-in fade-in duration-300">
          <div className="text-center space-y-1">
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Live Classroom Answer Distribution
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-200">
              {currentQ.text}
            </h2>
          </div>

          {/* Percentage Distribution Bars */}
          <div className="space-y-3">
            {currentQ.options.map((optText, optIdx) => {
              const isCorrect = currentQ.correctAnswerIndex === optIdx;
              const percent = optionPercentages[optIdx] || 0;
              const count = optionCounts[optIdx] || 0;
              const col = optionColors[optIdx];

              return (
                <div
                  key={optIdx}
                  className={`p-4 rounded-3xl border-2 transition-all ${
                    isCorrect
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-md'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-xl text-white font-black text-xs flex items-center justify-center shadow-sm ${col.bg}`}
                      >
                        {col.label}
                      </span>
                      <span className="font-bold text-sm sm:text-base">
                        {optText}
                      </span>
                      {isCorrect && (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct Answer
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-black text-lg text-indigo-600 dark:text-indigo-400">
                        {percent}%
                      </span>
                      <span className="text-xs text-slate-400 ml-1.5">({count} votes)</span>
                    </div>
                  </div>

                  {/* Progress fill bar */}
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isCorrect ? 'bg-emerald-500' : 'bg-indigo-500/70'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Pedagogical Concept Explanation Bento Card */}
          <div className="p-6 rounded-3xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-black text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Pedagogical Review & Misconception Breakdown</span>
            </div>
            <p className="text-xs sm:text-sm text-indigo-950 dark:text-indigo-100 leading-relaxed font-medium">
              {currentQ.explanation}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. LEADERBOARD VIEW: Top 3 Bento Podium & Standings Matrix */}
      {/* ========================================================================= */}
      {room.phase === 'leaderboard' && (
        <div className="my-auto max-w-4xl mx-auto w-full py-4 space-y-6 animate-in zoom-in-95 duration-300">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-extrabold border border-amber-300 dark:border-amber-700">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Round {room.currentQuestionIndex + 1} Standings
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Classroom Leaderboard
            </h2>
          </div>

          {/* Bento Podium for Top 3 */}
          {sortedParticipants.length >= 2 && (
            <div className="flex items-end justify-center gap-3 sm:gap-6 pt-4 pb-2">
              {/* 2nd Place (Silver) */}
              {sortedParticipants[1] && (
                <div className="flex flex-col items-center text-center space-y-2">
                  <span className="text-3xl">{sortedParticipants[1].avatar}</span>
                  <p className="text-xs font-bold truncate max-w-[90px]">{sortedParticipants[1].name}</p>
                  <p className="text-xs font-black text-slate-500">{sortedParticipants[1].score} pts</p>
                  <div className="w-22 sm:w-28 h-24 sm:h-32 rounded-t-3xl bg-gradient-to-t from-slate-400 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center font-black text-2xl text-slate-800 dark:text-slate-100 shadow-md">
                    2
                  </div>
                </div>
              )}

              {/* 1st Place (Gold) */}
              {sortedParticipants[0] && (
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="relative">
                    <span className="text-4xl">{sortedParticipants[0].avatar}</span>
                    <span className="absolute -top-3 -right-2 text-xl animate-bounce">👑</span>
                  </div>
                  <p className="text-sm font-black truncate max-w-[120px] text-amber-600 dark:text-amber-400">
                    {sortedParticipants[0].name}
                  </p>
                  <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {sortedParticipants[0].score} pts
                  </p>
                  <div className="w-26 sm:w-36 h-36 sm:h-44 rounded-t-3xl bg-gradient-to-t from-amber-500 to-yellow-400 flex items-center justify-center font-black text-4xl text-amber-950 shadow-xl">
                    1
                  </div>
                </div>
              )}

              {/* 3rd Place (Bronze) */}
              {sortedParticipants[2] && (
                <div className="flex flex-col items-center text-center space-y-2">
                  <span className="text-3xl">{sortedParticipants[2].avatar}</span>
                  <p className="text-xs font-bold truncate max-w-[90px]">{sortedParticipants[2].name}</p>
                  <p className="text-xs font-black text-slate-500">{sortedParticipants[2].score} pts</p>
                  <div className="w-22 sm:w-28 h-18 sm:h-24 rounded-t-3xl bg-gradient-to-t from-amber-700 to-amber-600 dark:from-amber-800 dark:to-amber-700 flex items-center justify-center font-black text-2xl text-amber-100 shadow-md">
                    3
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Top 10 List Table Bento */}
          <div className="p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-2 shadow-sm">
            {sortedParticipants.slice(0, 8).map((p, rankIdx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs font-medium"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 font-black text-slate-400">#{rankIdx + 1}</span>
                  <span className="text-xl">{p.avatar}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                  {p.streak >= 2 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 font-extrabold text-[10px]">
                      <Flame className="w-3 h-3 text-orange-500 fill-current" />
                      {p.streak} Streak
                    </span>
                  )}
                </div>
                <div className="font-black text-indigo-600 dark:text-indigo-400">
                  {p.score} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM SLIDE & FACULTY OVERRIDE TOOLBAR */}
      {/* ========================================================================= */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Faculty Override Actions */}
        <div className="flex items-center gap-2">
          {/* Pause / Resume */}
          <button
            id="pause-timer-btn"
            onClick={() => {
              sound.playClick();
              onOverrideAction('toggle_pause');
            }}
            title="Pause/Resume Countdown (P)"
            className="px-3.5 py-2 rounded-2xl text-xs font-bold border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {room.isTimerPaused ? (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-500 fill-current" />
                <span>Resume Timer</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-500" />
                <span>Pause (P)</span>
              </>
            )}
          </button>

          {/* Add 10s */}
          <button
            id="add-time-override-btn"
            onClick={() => {
              sound.playClick();
              onOverrideAction('add_time', { seconds: 10 });
            }}
            title="Extend timer by 10 seconds"
            className="px-3.5 py-2 rounded-2xl text-xs font-bold border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>+10s</span>
          </button>

          {/* Broadcast Hint Modal Trigger */}
          <button
            id="broadcast-hint-btn"
            onClick={() => {
              sound.playClick();
              setShowHintModal(true);
            }}
            title="Broadcast a live hint to all student screens"
            className="px-3.5 py-2 rounded-2xl text-xs font-bold border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Broadcast Hint</span>
          </button>

          {/* Class Bonus Points */}
          <button
            id="class-bonus-btn"
            onClick={() => {
              sound.playCorrect();
              onOverrideAction('award_class_bonus', { points: 50 });
            }}
            title="Award +50 bonus participation points to all students"
            className="px-3.5 py-2 rounded-2xl text-xs font-bold border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">+50 Class Bonus</span>
          </button>
        </div>

        {/* Right: Slide Advance Navigator */}
        <div className="flex items-center gap-2.5">
          {room.phase !== 'lobby' && (
            <button
              id="slide-prev-btn"
              onClick={handlePreviousSlide}
              className="p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Previous Step (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <button
            id="slide-next-flow-btn"
            onClick={handleAdvanceFlow}
            className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <span>
              {room.phase === 'lobby'
                ? 'Begin Quiz (Q1)'
                : room.phase === 'question'
                ? 'Reveal Live Answers'
                : room.phase === 'percentages'
                ? 'Show Leaderboard'
                : room.currentQuestionIndex + 1 < totalQuestions
                ? `Next Question (Q${room.currentQuestionIndex + 2})`
                : 'View Final Results & Analytics'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Broadcast Hint Dialog */}
      {showHintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div
            className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-base">Broadcast Live Hint to Students</h3>
            </div>
            <p className="text-xs text-slate-500">
              This prompt will immediately pop up on all joined student phone/tablet screens.
            </p>
            <textarea
              rows={3}
              value={broadcastHintText}
              onChange={(e) => setBroadcastHintText(e.target.value)}
              placeholder="e.g. Remember to check whether the tree is self-balancing before calculating height!"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowHintModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  sound.playSubmit();
                  onOverrideAction('broadcast_hint', { hint: broadcastHintText });
                  setShowHintModal(false);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
              >
                Send Hint to Classroom
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
