import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Play,
  Download,
  Clock,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  Check,
  CheckCircle2,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { Quiz, Question } from '../types';
import { exportQuizAsJsonFile, saveQuizToStorage } from '../utils/storage';
import { sound } from '../utils/audio';

interface QuizEditorProps {
  initialQuiz: Quiz;
  onSave: (quiz: Quiz) => void;
  onLaunchLive: (quiz: Quiz) => void;
  onBack: () => void;
  darkMode: boolean;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({
  initialQuiz,
  onSave,
  onLaunchLive,
  onBack,
  darkMode,
}) => {
  const [quiz, setQuiz] = useState<Quiz>({ ...initialQuiz });
  const [activeQIndex, setActiveQIndex] = useState<number>(0);
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentQ = quiz.questions[activeQIndex] || quiz.questions[0];

  const handleUpdateCurrentQuestion = (updated: Partial<Question>) => {
    const questions = [...quiz.questions];
    questions[activeQIndex] = { ...questions[activeQIndex], ...updated };
    setQuiz({ ...quiz, questions });
  };

  const handleAddQuestion = () => {
    sound.playClick();
    setErrorMessage(null);
    const newQuestion: Question = {
      id: `q-manual-${Date.now()}`,
      text: 'New Question: Enter concept or problem prompt here...',
      type: 'multiple-choice',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswerIndex: 0,
      explanation: 'Explanation explaining why option A is correct and common mistakes.',
      timeLimitSeconds: quiz.defaultTimeLimit || 30,
      points: 100,
      difficulty: 'Medium',
      topicTag: quiz.subject || 'General',
    };

    const newQuestions = [...quiz.questions, newQuestion];
    setQuiz({ ...quiz, questions: newQuestions, totalPoints: newQuestions.length * 100 });
    setActiveQIndex(newQuestions.length - 1);
  };

  const handleDeleteQuestion = (indexToDelete: number) => {
    if (quiz.questions.length <= 1) {
      setErrorMessage('A quiz must have at least 1 question.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    sound.playClick();
    setErrorMessage(null);
    const newQuestions = quiz.questions.filter((_, idx) => idx !== indexToDelete);
    setQuiz({ ...quiz, questions: newQuestions, totalPoints: newQuestions.length * 100 });
    setActiveQIndex(Math.max(0, indexToDelete - 1));
  };

  const handleSaveQuiz = () => {
    sound.playClick();
    saveQuizToStorage(quiz);
    onSave(quiz);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleOptionTextChange = (optIdx: number, val: string) => {
    const options = [...currentQ.options];
    options[optIdx] = val;
    handleUpdateCurrentQuestion({ options });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            id="editor-back-btn"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Quiz Builder & Slide Editor
              </span>
              {saveToast && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-in fade-in">
                  <CheckCircle2 className="w-3 h-3" /> Saved!
                </span>
              )}
              {errorMessage && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-in fade-in">
                  <AlertTriangle className="w-3 h-3" /> {errorMessage}
                </span>
              )}
            </div>
            <input
              id="quiz-title-input"
              type="text"
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              className="text-xl sm:text-2xl font-bold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none py-0.5 text-slate-900 dark:text-slate-100"
              placeholder="Quiz Title"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            id="export-offline-json-btn"
            onClick={() => {
              sound.playClick();
              exportQuizAsJsonFile(quiz);
            }}
            title="Download offline JSON file for remote learning"
            className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline Pack</span>
          </button>

          <button
            id="save-quiz-btn"
            onClick={handleSaveQuiz}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-indigo-500" />
            <span>Save</span>
          </button>

          <button
            id="launch-live-from-editor-btn"
            onClick={() => {
              sound.playCorrect();
              handleSaveQuiz();
              onLaunchLive(quiz);
            }}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Host Live Quiz</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Slide List / Question Navigation (Spans 4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quiz Slides ({quiz.questions.length})
            </span>
            <button
              id="add-question-slide-btn"
              onClick={handleAddQuestion}
              className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors border border-indigo-200 dark:border-indigo-800"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Slide
            </button>
          </div>

          <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
            {quiz.questions.map((q, idx) => (
              <div
                key={q.id}
                onClick={() => {
                  sound.playClick();
                  setActiveQIndex(idx);
                }}
                className={`bento-card p-4 rounded-2xl border cursor-pointer transition-all ${
                  activeQIndex === idx
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-sm'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-xl text-xs font-black flex items-center justify-center ${
                        activeQIndex === idx
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      {q.timeLimitSeconds}s
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQuestion(idx);
                    }}
                    title="Delete Question"
                    className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 line-clamp-2 leading-snug">
                  {q.text}
                </p>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-500 font-bold">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {q.difficulty || 'Medium'}
                  </span>
                  <span className="truncate">{q.topicTag || 'General'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Question Detail Editor (Spans 8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {currentQ ? (
            <div
              className={`bento-card p-7 sm:p-8 rounded-3xl border ${
                darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 shadow-sm text-slate-800'
              } space-y-6`}
            >
              {/* Question Meta Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-xs">
                    Slide #{activeQIndex + 1} of {quiz.questions.length}
                  </span>
                  <span className="text-xs font-bold text-slate-400">100 Points</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Timer */}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <select
                      id="current-q-timer-select"
                      value={currentQ.timeLimitSeconds}
                      onChange={(e) => handleUpdateCurrentQuestion({ timeLimitSeconds: Number(e.target.value) })}
                      className="text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5"
                    >
                      <option value={15}>15s</option>
                      <option value={20}>20s</option>
                      <option value={25}>25s</option>
                      <option value={30}>30s</option>
                      <option value={45}>45s</option>
                      <option value={60}>60s</option>
                      <option value={90}>90s</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div className="flex items-center gap-1.5">
                    <select
                      id="current-q-difficulty-select"
                      value={currentQ.difficulty || 'Medium'}
                      onChange={(e) =>
                        handleUpdateCurrentQuestion({
                          difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard',
                        })
                      }
                      className="text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Question Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Question Prompt (Slide Display)
                </label>
                <textarea
                  id="current-q-text-input"
                  rows={3}
                  value={currentQ.text}
                  onChange={(e) => handleUpdateCurrentQuestion({ text: e.target.value })}
                  placeholder="Enter the question or concept to display on the live classroom screen..."
                  className="w-full text-base font-bold rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Options Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Answer Options (Click Letter to Set Correct)
                  </label>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-black">
                    ✓ Option {String.fromCharCode(65 + currentQ.correctAnswerIndex)} is Correct
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentQ.options.map((opt, optIdx) => {
                    const isCorrect = currentQ.correctAnswerIndex === optIdx;
                    const letters = ['A', 'B', 'C', 'D'];
                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm'
                            : 'border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/60'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            handleUpdateCurrentQuestion({ correctAnswerIndex: optIdx });
                          }}
                          className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
                            isCorrect
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {isCorrect ? <Check className="w-4 h-4" /> : letters[optIdx]}
                        </button>

                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionTextChange(optIdx, e.target.value)}
                          placeholder={`Option ${letters[optIdx]}`}
                          className="flex-1 text-sm bg-transparent border-none focus:outline-none font-bold text-slate-800 dark:text-slate-200"
                        />

                        {isCorrect && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pedagogical Explanation */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Pedagogical Explanation & Concept Breakdown (Shown during Live Review)
                </label>
                <textarea
                  id="current-q-explanation-input"
                  rows={3}
                  value={currentQ.explanation}
                  onChange={(e) => handleUpdateCurrentQuestion({ explanation: e.target.value })}
                  placeholder="Explain why the answer is correct and clarify common misconceptions for students..."
                  className="w-full text-xs font-medium rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Topic Tag */}
              <div className="flex items-center gap-2 pt-1">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                <input
                  type="text"
                  value={currentQ.topicTag || ''}
                  onChange={(e) => handleUpdateCurrentQuestion({ topicTag: e.target.value })}
                  placeholder="Topic tag (e.g., Cellular Respiration, Big-O Notation)"
                  className="text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center border rounded-3xl bg-white dark:bg-slate-900">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="font-bold">No questions in this quiz.</p>
              <button
                onClick={handleAddQuestion}
                className="mt-3 px-4 py-2 rounded-2xl text-xs font-bold bg-indigo-600 text-white"
              >
                Add First Question
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
