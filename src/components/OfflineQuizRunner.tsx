import React, { useState } from 'react';
import {
  WifiOff,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Download,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { Quiz, Question } from '../types';
import { getStoredQuizzes, saveOfflineAttempt } from '../utils/storage';
import { sound } from '../utils/audio';

interface OfflineQuizRunnerProps {
  onBack: () => void;
  darkMode: boolean;
}

export const OfflineQuizRunner: React.FC<OfflineQuizRunnerProps> = ({
  onBack,
  darkMode,
}) => {
  const quizzes = getStoredQuizzes();
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(quizzes[0] || null);
  const [studentName, setStudentName] = useState<string>('Remote Student');
  const [studentId, setStudentId] = useState<string>('25MCMI28');
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ [qId: string]: number }>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const currentQ: Question | undefined = selectedQuiz?.questions[currentQIndex];

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return;
    sound.playSubmit();
    setSelectedOption(idx);
  };

  const handleNextQuestion = () => {
    if (!currentQ || selectedOption === null) return;
    sound.playClick();

    const newAnswers = { ...answers, [currentQ.id]: selectedOption };
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (selectedQuiz && currentQIndex + 1 < selectedQuiz.questions.length) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      // Complete quiz
      setIsCompleted(true);
      sound.playFanfare();

      // Calculate final score
      let correct = 0;
      selectedQuiz?.questions.forEach((q) => {
        if (newAnswers[q.id] === q.correctAnswerIndex) correct += 1;
      });
      const total = selectedQuiz?.questions.length || 1;
      const score = correct * 100;
      const totalPts = total * 100;

      saveOfflineAttempt({
        quizId: selectedQuiz?.id || 'offline',
        quizTitle: selectedQuiz?.title || 'Offline Assessment',
        studentName,
        studentId,
        completedAt: new Date().toISOString(),
        score,
        totalPoints: totalPts,
        percentage: (correct / total) * 100,
        answers: newAnswers,
      });
    }
  };

  // Score stats
  let correctCount = 0;
  if (selectedQuiz && isCompleted) {
    selectedQuiz.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswerIndex) correctCount += 1;
    });
  }

  const optionColors = [
    { bg: 'hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20', label: 'A' },
    { bg: 'hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20', label: 'B' },
    { bg: 'hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20', label: 'C' },
    { bg: 'hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20', label: 'D' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <WifiOff className="w-3.5 h-3.5" />
              Offline Remote Assessment Mode
            </div>
            <h1 className="text-xl font-black mt-1">Self-Paced Practice & Remote Testing</h1>
          </div>
        </div>
      </div>

      {/* Screen 1: Quiz Selection & Setup */}
      {!isStarted && !isCompleted && (
        <div
          className={`p-6 rounded-3xl border shadow-xl space-y-5 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="space-y-1">
            <h2 className="text-lg font-bold">Select Cached Assessment</h2>
            <p className="text-xs text-slate-500">
              All quizzes below are saved locally in your browser storage for offline execution.
            </p>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {quizzes.map((q) => (
              <div
                key={q.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedQuiz(q);
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedQuiz?.id === q.id
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{q.title}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {q.questions.length} Questions
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{q.description}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">Your Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  if (setupError) setSetupError(null);
                }}
                className="w-full mt-1 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>University Roll No. (8 Digits)</span>
                <span className="text-[10px] font-mono text-indigo-500 font-bold">e.g. 25MCMI28</span>
              </label>
              <input
                type="text"
                maxLength={8}
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
                  if (setupError) setSetupError(null);
                }}
                placeholder="25MCMI28"
                className="w-full mt-1 text-xs font-mono font-black uppercase tracking-wider rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
              />
            </div>
          </div>

          {setupError && (
            <p className="text-xs font-bold text-red-600 dark:text-red-400">{setupError}</p>
          )}

          <button
            onClick={() => {
              const cleanRoll = studentId.trim().toUpperCase();
              if (cleanRoll.length !== 8) {
                setSetupError('Please enter a valid 8-character University Roll Number (e.g. 25MCMI28, 25MCMT41).');
                return;
              }
              sound.playClick();
              setIsStarted(true);
              setCurrentQIndex(0);
              setAnswers({});
            }}
            disabled={!selectedQuiz}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>Start Offline Test</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Screen 2: Active Question Answering */}
      {isStarted && !isCompleted && currentQ && selectedQuiz && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>
              Question {currentQIndex + 1} of {selectedQuiz.questions.length}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {currentQ.topicTag || selectedQuiz.subject}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-center leading-snug">
            {currentQ.text}
          </h2>

          <div className="space-y-2.5">
            {currentQ.options.map((optText, optIdx) => {
              const isSelected = selectedOption === optIdx;
              const col = optionColors[optIdx] || optionColors[0];
              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-semibold text-sm flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-400'
                      : `border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 ${col.bg}`
                  }`}
                >
                  <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-xs">
                    {col.label}
                  </span>
                  <span>{optText}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleNextQuestion}
              disabled={selectedOption === null}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 shadow-sm flex items-center gap-1.5"
            >
              <span>
                {currentQIndex + 1 < selectedQuiz.questions.length ? 'Next Question' : 'Finish Test'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 3: Completed Offline Scorecard */}
      {isCompleted && selectedQuiz && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-xl text-center space-y-6 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black">Offline Assessment Complete!</h2>
            <p className="text-xs text-slate-500 mt-1">Saved locally to your device</p>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex justify-around text-center">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Accuracy</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {Math.round((correctCount / selectedQuiz.questions.length) * 100)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Correct</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {correctCount} / {selectedQuiz.questions.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Score</p>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-200">
                {correctCount * 100} pts
              </p>
            </div>
          </div>

          {/* Question Breakdown */}
          <div className="space-y-2 text-left text-xs max-h-60 overflow-y-auto">
            {selectedQuiz.questions.map((q, idx) => {
              const myAns = answers[q.id];
              const isCorrect = myAns === q.correctAnswerIndex;
              return (
                <div
                  key={q.id}
                  className={`p-3 rounded-xl border ${
                    isCorrect
                      ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      Q{idx + 1}. {q.text}
                    </span>
                    {isCorrect ? (
                      <span className="text-emerald-600 font-black">✓ Correct</span>
                    ) : (
                      <span className="text-rose-600 font-black">✗ Missed</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{q.explanation}</p>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                sound.playClick();
                setIsStarted(false);
                setIsCompleted(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake Another Quiz
            </button>
            <button
              onClick={onBack}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
