import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  Play,
  Edit3,
  Plus,
  Trash2,
  Download,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  FileText,
  Flame,
  ArrowRight,
  Presentation,
  Share2,
  Layers,
  Zap,
  WifiOff,
  BarChart3,
} from 'lucide-react';
import { Quiz, TeachingAssistant } from '../types';
import { exportQuizAsJsonFile } from '../utils/storage';
import { sound } from '../utils/audio';

interface FacultyDashboardProps {
  quizzes: Quiz[];
  onOpenUploadModal: () => void;
  onLaunchLiveQuiz: (quiz: Quiz) => void;
  onEditQuiz: (quiz: Quiz) => void;
  onCreateNewManual: () => void;
  onDeleteQuiz: (quizId: string) => void;
  onOpenClassroomModal: () => void;
  onGenerateFromTopic: (topic: string, subject: string) => Promise<void>;
  isGeneratingTopic: boolean;
  darkMode: boolean;
  activeTa?: TeachingAssistant | null;
  onOpenTaAuthModal?: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  quizzes,
  onOpenUploadModal,
  onLaunchLiveQuiz,
  onEditQuiz,
  onCreateNewManual,
  onDeleteQuiz,
  onOpenClassroomModal,
  onGenerateFromTopic,
  isGeneratingTopic,
  darkMode,
  activeTa,
  onOpenTaAuthModal,
}) => {
  const [topicPrompt, setTopicPrompt] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('Computer Science');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleTopicGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicPrompt.trim() || isGeneratingTopic) return;
    sound.playClick();
    await onGenerateFromTopic(topicPrompt.trim(), selectedSubject);
    setTopicPrompt('');
  };

  const totalQuestions = quizzes.reduce((acc, q) => acc + q.questions.length, 0);
  const filteredQuizzes = quizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.subject && q.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Bento Grid Header & Status Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
              Instructor Control Center
            </span>
            {activeTa && (
              <span
                id="faculty-active-ta-tag"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              >
                <span>{activeTa.avatar}</span>
                <span>TA: {activeTa.name} {activeTa.rollNo ? `(${activeTa.rollNo})` : ''}</span>
                {onOpenTaAuthModal && (
                  <button
                    onClick={onOpenTaAuthModal}
                    className="ml-1 text-[10px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold"
                  >
                    Switch TA
                  </button>
                )}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            Interactive Classroom Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Host live question slides, analyze real-time student polls, and sync grades to Google Classroom.
          </p>
        </div>

        {/* Quick Bento Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Quizzes</p>
              <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">
                {quizzes.length} Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Questions</p>
              <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">
                {totalQuestions} Banked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Gradebook</p>
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                Synced
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRIMARY BENTO GRID: Action Hub */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Bento Cell 1: AI Document Parser (Hero Card - Spans 7 cols on desktop) */}
        <div
          id="upload-doc-cta-card"
          onClick={() => {
            sound.playClick();
            onOpenUploadModal();
          }}
          className="md:col-span-7 bento-card relative overflow-hidden rounded-3xl p-7 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white shadow-xl shadow-indigo-500/20 hover:shadow-2xl cursor-pointer flex flex-col justify-between group border border-indigo-500/30"
        >
          {/* Subtle background glow/circle */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-indigo-100 backdrop-blur-sm border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Gemini 3.7 Vision + Document Parser
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                Upload Quiz Document or Exam Sheet
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-xl">
                Feed PDF exams, textbook photos, scanned diagrams, or syllabus notes. Our AI engine automatically detects question prompts, formulates pedagogical distractor options, and builds interactive slides with custom timers.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-6 flex items-center justify-between border-t border-white/15 mt-4">
            <div className="flex items-center gap-3 text-xs text-indigo-200 font-medium">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> PDF / Images
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Auto-Distractors
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Concept Reviews
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-black text-white px-3.5 py-1.5 rounded-xl bg-white/20 group-hover:bg-white/30 backdrop-blur-sm transition-all group-hover:translate-x-1">
              <span>Parse Document</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Bento Cell 2: Generate from Topic (Spans 5 cols on desktop) */}
        <div
          className={`md:col-span-5 bento-card p-6 rounded-3xl border flex flex-col justify-between ${
            darkMode
              ? 'bg-slate-900/90 border-slate-800 text-slate-100'
              : 'bg-white border-slate-200 shadow-sm text-slate-800'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center shadow-sm">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">AI Topic Generator</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Instant Quiz Builder</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Flash Gen
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Type any academic topic or lesson concept to automatically synthesize 5 multiple-choice questions.
            </p>

            <form onSubmit={handleTopicGenerateSubmit} className="space-y-2.5 pt-1">
              <div>
                <input
                  id="topic-prompt-input"
                  type="text"
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                  placeholder="e.g. Binary Search Trees, AP Bio Photosynthesis, Newton's Laws"
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-1/2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 dark:text-slate-300"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Biology">Biology</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="History">History</option>
                </select>

                <button
                  id="generate-topic-btn"
                  type="submit"
                  disabled={!topicPrompt.trim() || isGeneratingTopic}
                  className="w-1/2 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingTopic ? 'Synthesizing...' : 'Create Slides'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Includes Concept Explanations</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">30s Defaults</span>
          </div>
        </div>

        {/* Bento Cell 3: Google Classroom Integration (Spans 6 cols) */}
        <div
          className={`md:col-span-6 bento-card p-6 rounded-3xl border flex flex-col justify-between ${
            darkMode
              ? 'bg-slate-900/90 border-slate-800 text-slate-100'
              : 'bg-white border-slate-200 shadow-sm text-slate-800'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">Google Classroom Sync</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Automated Grade Reporting</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Connected
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Export live assessment performance, letter grades, and participation statistics directly into Google Classroom courses and assignments.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              <span>3 active course rosters linked</span>
            </div>
            <button
              id="open-classroom-integration-btn"
              onClick={() => {
                sound.playClick();
                onOpenClassroomModal();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Manage Classroom Sync</span>
            </button>
          </div>
        </div>

        {/* Bento Cell 4: Quick Action / Empty Quiz Builder (Spans 6 cols) */}
        <div
          className={`md:col-span-6 bento-card p-6 rounded-3xl border flex flex-col justify-between ${
            darkMode
              ? 'bg-slate-900/90 border-slate-800 text-slate-100'
              : 'bg-white border-slate-200 shadow-sm text-slate-800'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center shadow-sm">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">Manual Slide Builder</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Custom Questions & Options</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Custom Editor
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Create a custom quiz from scratch. Configure multiple choice options, set timers (15s–90s), attach difficulty ratings, and write pedagogical notes.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              <span>Full slide & points customizer</span>
            </div>
            <button
              id="create-manual-quiz-btn"
              onClick={() => {
                sound.playClick();
                onCreateNewManual();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-500" />
              <span>Create Empty Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BENTO SECTION 2: Quiz Library Matrix */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Interactive Quiz Library ({filteredQuizzes.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any quiz to host a live presenter session or edit individual slides
            </p>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quizzes..."
              className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Quizzes Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className={`bento-card p-6 rounded-3xl border flex flex-col justify-between space-y-4 ${
                darkMode
                  ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                  : 'bg-white border-slate-200 shadow-sm text-slate-800'
              }`}
            >
              <div className="space-y-3">
                {/* Meta pills */}
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {quiz.subject || 'General'}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span className="text-[11px] font-medium">{quiz.defaultTimeLimit || 30}s / slide</span>
                  </div>
                </div>

                <h3 className="font-extrabold text-base line-clamp-2 text-slate-900 dark:text-slate-100 tracking-tight">
                  {quiz.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {quiz.description}
                </p>

                {/* Badges bar */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {quiz.questions.length} Slides
                  </span>
                  <span>•</span>
                  <span>{quiz.totalPoints || quiz.questions.length * 100} Total Pts</span>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onEditQuiz(quiz);
                    }}
                    title="Edit Slides"
                    className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      exportQuizAsJsonFile(quiz);
                    }}
                    title="Export Offline Bundle (.json)"
                    className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {quizzes.length > 1 && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onDeleteQuiz(quiz.id);
                      }}
                      title="Delete Quiz"
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  id={`launch-quiz-${quiz.id}`}
                  onClick={() => {
                    sound.playCorrect();
                    onLaunchLiveQuiz(quiz);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Host Live</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

