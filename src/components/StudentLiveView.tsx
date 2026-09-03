import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Flame,
  Clock,
  Trophy,
  Lightbulb,
  Award,
  Zap,
  Check,
} from 'lucide-react';
import { LiveRoom, StudentParticipant } from '../types';
import { sound } from '../utils/audio';
import { CircularCountdownTimer } from './CircularCountdownTimer';

interface StudentLiveViewProps {
  room: LiveRoom;
  participantId: string;
  onSubmitAnswer: (optionIndex: number, timeSpentMs: number) => void;
  darkMode: boolean;
}

export const StudentLiveView: React.FC<StudentLiveViewProps> = ({
  room,
  participantId,
  onSubmitAnswer,
  darkMode,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submittedAt, setSubmittedAt] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const participant: StudentParticipant | undefined = room.participants[participantId];
  const currentQ = room.quiz.questions[room.currentQuestionIndex];
  const myAnswer = currentQ && participant ? participant.answers[currentQ.id] : undefined;

  // Reset selected option on new question
  useEffect(() => {
    setSelectedOption(null);
    setSubmittedAt(null);
    setQuestionStartTime(Date.now());
  }, [room.currentQuestionIndex]);

  const handleSelectOption = (index: number) => {
    if (selectedOption !== null || myAnswer !== undefined || room.phase !== 'question') {
      return;
    }
    sound.playSubmit();
    setSelectedOption(index);
    setSubmittedAt(Date.now());
    const timeSpent = Math.max(500, Date.now() - questionStartTime);
    onSubmitAnswer(index, timeSpent);
  };

  const optionColors = [
    {
      bg: 'bg-rose-500 hover:bg-rose-600 active:scale-95 text-white',
      border: 'border-rose-400',
      label: 'A',
    },
    {
      bg: 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white',
      border: 'border-blue-400',
      label: 'B',
    },
    {
      bg: 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white',
      border: 'border-amber-400',
      label: 'C',
    },
    {
      bg: 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white',
      border: 'border-emerald-400',
      label: 'D',
    },
  ];

  // Calculate my rank
  const sortedParticipants = (Object.values(room.participants) as StudentParticipant[]).sort((a, b) => b.score - a.score);
  const myRank = sortedParticipants.findIndex((p) => p.id === participantId) + 1;

  // Calculate quiz progress
  const totalQuestions = room.quiz?.questions?.length || 0;
  const isCurrentAnswered = selectedOption !== null || myAnswer !== undefined;
  const completedQuestions = room.phase === 'lobby'
    ? 0
    : Math.min(
        totalQuestions,
        room.currentQuestionIndex + (room.phase === 'percentages' || room.phase === 'leaderboard' || isCurrentAnswered ? 1 : 0)
      );
  const progressPercent = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

  return (
    <div
      id="student-live-container"
      className={`min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 sm:p-6 transition-colors ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Student Status Bar Bento */}
      <div
        id="student-live-header"
        className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-2xl shadow-inner">
              {participant?.avatar || '🎓'}
            </div>
            <div>
              <p className="font-black text-sm leading-tight text-slate-900 dark:text-slate-100">{participant?.name || 'Student'}</p>
              <p className="text-[11px] text-slate-400 font-mono font-bold">PIN: {room.pin}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Streak Flame */}
            {participant && participant.streak > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 text-xs font-black animate-pulse border border-orange-200 dark:border-orange-800">
                <Flame className="w-3.5 h-3.5 fill-current text-orange-500" />
                <span>{participant.streak}x Streak</span>
              </div>
            )}

            {/* Current Score Pill */}
            <div className="px-3.5 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-right">
              <p className="text-[9px] uppercase font-extrabold text-indigo-400">Score</p>
              <p className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-300">
                {participant?.score || 0} pts
              </p>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar Section */}
        <div id="student-quiz-progress-section" className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-300">Quiz Progress</span>
              {room.phase !== 'lobby' && totalQuestions > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                  Question {Math.min(room.currentQuestionIndex + 1, totalQuestions)} of {totalQuestions}
                </span>
              )}
            </div>
            <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">
              {completedQuestions} of {totalQuestions} completed ({progressPercent}%)
            </span>
          </div>

          {/* Progress Track & Fill */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
            <div
              id="student-progress-bar-fill"
              role="progressbar"
              aria-valuenow={completedQuestions}
              aria-valuemin={0}
              aria-valuemax={totalQuestions}
              aria-label="Quiz question completion progress"
              className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Teacher Hint Popup */}
      {room.activeHint && (
        <div className="my-2 p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-3 animate-bounce shadow-sm">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Teacher Live Hint: {room.activeHint}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. LOBBY: Waiting for instructor */}
      {/* ========================================================================= */}
      {room.phase === 'lobby' && (
        <div className="my-auto text-center max-w-md mx-auto w-full space-y-6 animate-in fade-in">
          <div className="bento-card p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center text-4xl shadow-sm border border-indigo-100 dark:border-indigo-800">
              {participant?.avatar || '🚀'}
            </div>
            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Connected
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 pt-2">You're in the Classroom!</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Waiting for the instructor to launch the presentation...
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-xs font-medium">
              <p className="font-black text-indigo-600 dark:text-indigo-400">{room.quizTitle}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Keep this tab open. Option buttons will pop up automatically as each question appears.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. QUESTION ACTIVE: Tap your answer */}
      {/* ========================================================================= */}
      {room.phase === 'question' && currentQ && (
        <div className="my-auto max-w-md mx-auto w-full space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span className="px-3.5 py-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
              Q{room.currentQuestionIndex + 1} of {room.quiz.questions.length}
            </span>
            <div className="flex items-center gap-2">
              <CircularCountdownTimer
                remainingSeconds={room.timerRemainingSeconds}
                totalSeconds={currentQ.timeLimitSeconds || 30}
                isPaused={room.isTimerPaused}
                size="sm"
              />
            </div>
          </div>

          {/* Question Text Preview for tablets/mobiles */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center font-black text-sm sm:text-base leading-snug shadow-sm">
            {currentQ.text}
          </div>

          {/* Answer Submission State */}
          {selectedOption !== null || myAnswer !== undefined ? (
            <div className="p-8 rounded-3xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 text-center space-y-3 animate-in zoom-in-95 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-indigo-950 dark:text-indigo-100">Answer Locked In!</h3>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                Hold tight! Results will appear once timer completes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentQ.options.map((optText, optIdx) => {
                const col = optionColors[optIdx] || optionColors[0];
                return (
                  <button
                    key={optIdx}
                    id={`student-option-${optIdx}`}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`p-5 rounded-3xl font-black text-base shadow-md flex items-center justify-center gap-3 transition-all duration-150 bento-card ${col.bg}`}
                  >
                    <span className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center text-sm font-black">
                      {col.label}
                    </span>
                    <span className="truncate">{optText}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PERCENTAGES / REVEAL: Instant Feedback */}
      {/* ========================================================================= */}
      {room.phase === 'percentages' && currentQ && (
        <div className="my-auto max-w-md mx-auto w-full text-center space-y-4 animate-in zoom-in-95">
          {myAnswer?.isCorrect ? (
            <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-3 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-black text-emerald-950 dark:text-emerald-100">Correct!</h3>
              <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                +{myAnswer.pointsEarned} Points Earned
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-3 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-rose-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-rose-500/30">
                <XCircle className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-black text-rose-950 dark:text-rose-100">Incorrect</h3>
              <p className="text-xs font-medium text-rose-700 dark:text-rose-300">
                Correct answer was Option {String.fromCharCode(65 + currentQ.correctAnswerIndex)}: {currentQ.options[currentQ.correctAnswerIndex]}
              </p>
            </div>
          )}

          {/* Explanation Bento */}
          <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-left space-y-1.5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Concept Review</p>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {currentQ.explanation}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. LEADERBOARD: Student Rank Standing */}
      {/* ========================================================================= */}
      {room.phase === 'leaderboard' && (
        <div className="my-auto max-w-sm mx-auto w-full text-center space-y-5 animate-in fade-in">
          <div className="p-7 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-500/20 space-y-4">
            <Trophy className="w-11 h-11 mx-auto text-amber-300" />
            <div>
              <p className="text-xs uppercase tracking-widest text-indigo-200 font-extrabold">Your Standing</p>
              <h2 className="text-4xl font-black">#{myRank > 0 ? myRank : '1'}</h2>
              <p className="text-xs text-indigo-100 mt-1">out of {sortedParticipants.length} students</p>
            </div>
            <div className="pt-3 border-t border-indigo-400/40 flex justify-around text-xs font-bold">
              <div>
                <p className="text-indigo-200 text-[10px] uppercase">Total Score</p>
                <p className="text-base font-black">{participant?.score || 0} pts</p>
              </div>
              <div>
                <p className="text-indigo-200 text-[10px] uppercase">Streak</p>
                <p className="text-base font-black">{participant?.streak || 0} 🔥</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium">Next question starting soon...</p>
        </div>
      )}

      {/* Bottom Footer Note */}
      <div className="text-center text-[10px] text-slate-400 py-1 font-medium">
        Live Classroom Quiz • Real-Time Synchronized
      </div>
    </div>
  );
};
