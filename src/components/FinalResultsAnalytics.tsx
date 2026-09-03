import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Award,
  Sparkles,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Flame,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Loader2,
  Layers,
  TrendingUp,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { LiveRoom, GradeReportEntry, StudentParticipant } from '../types';
import { exportGradebookCsv } from '../utils/storage';
import { sound } from '../utils/audio';
import { generateQuizPerformancePdf } from '../utils/pdfReportGenerator';

interface FinalResultsAnalyticsProps {
  room: LiveRoom;
  onOpenClassroomModal: () => void;
  onReturnToDashboard: () => void;
  darkMode: boolean;
}

export const FinalResultsAnalytics: React.FC<FinalResultsAnalyticsProps> = ({
  room,
  onOpenClassroomModal,
  onReturnToDashboard,
  darkMode,
}) => {
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<GradeReportEntry | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  const participantsList = Object.values(room.participants) as StudentParticipant[];
  const totalQuestions = room.quiz.questions.length;
  const maxPossibleScore = totalQuestions * 100;

  // Trigger celebration confetti
  useEffect(() => {
    try {
      sound.playFanfare();
    } catch {}
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.warn('Confetti animation failed', err);
    }
  }, []);

  // Compute Gradebook entries
  const gradebookEntries: GradeReportEntry[] = participantsList.map((p) => {
    let correctCount = 0;
    let totalTimeSpentMs = 0;
    const strengths: string[] = [];
    const needsReview: string[] = [];

    room.quiz.questions.forEach((q) => {
      const ans = p.answers[q.id];
      if (ans && ans.isCorrect) {
        correctCount += 1;
        if (q.topicTag && !strengths.includes(q.topicTag)) {
          strengths.push(q.topicTag);
        }
      } else {
        if (q.topicTag && !needsReview.includes(q.topicTag)) {
          needsReview.push(q.topicTag);
        }
      }
      if (ans) totalTimeSpentMs += ans.timeSpentMs;
    });

    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    let letterGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (percentage >= 90) letterGrade = 'A';
    else if (percentage >= 80) letterGrade = 'B';
    else if (percentage >= 70) letterGrade = 'C';
    else if (percentage >= 60) letterGrade = 'D';

    const avgTimeSec = totalQuestions > 0 ? totalTimeSpentMs / 1000 / totalQuestions : 0;

    return {
      studentName: p.name,
      studentId: p.studentId || 'N/A',
      email: `${p.name.toLowerCase().replace(/\s+/g, '.')}@school.edu`,
      score: p.score,
      totalPossible: maxPossibleScore,
      percentage,
      letterGrade,
      correctCount,
      totalQuestions,
      averageResponseTimeSeconds: avgTimeSec,
      status: 'Turned In',
      strengths,
      needsReview,
    };
  });

  // Sort by score descending
  const sortedGrades = [...gradebookEntries].sort((a, b) => b.score - a.score);

  // Overall class engagement metrics
  const classAvgPercentage =
    gradebookEntries.length > 0
      ? gradebookEntries.reduce((acc, g) => acc + g.percentage, 0) / gradebookEntries.length
      : 0;

  const classAvgTime =
    gradebookEntries.length > 0
      ? gradebookEntries.reduce((acc, g) => acc + g.averageResponseTimeSeconds, 0) /
        gradebookEntries.length
      : 0;

  // Identify hardest question (lowest accuracy)
  const questionAccuracy = room.quiz.questions.map((q) => {
    const correctCount = participantsList.filter((p) => p.answers[q.id]?.isCorrect).length;
    const accuracy =
      participantsList.length > 0 ? Math.round((correctCount / participantsList.length) * 100) : 0;
    return { question: q, accuracy };
  });

  const hardestQuestion = [...questionAccuracy].sort((a, b) => a.accuracy - b.accuracy)[0];

  const handleDownloadCsv = () => {
    sound.playClick();
    exportGradebookCsv(room.quizTitle, gradebookEntries);
  };

  const handleDownloadPdf = () => {
    sound.playClick();
    setIsGeneratingPdf(true);
    try {
      generateQuizPerformancePdf({
        room,
        gradebookEntries,
        classAvgPercentage,
        classAvgTime,
        hardestQuestion,
      });
      sound.playFanfare();
      setPdfSuccessMessage('PDF Assessment Summary Report generated and downloaded successfully!');
      setTimeout(() => setPdfSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to generate PDF summary report:', err);
      sound.playWrong();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            id="results-return-dash-btn"
            onClick={onReturnToDashboard}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Session Complete • Final Assessment Report
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{room.quizTitle}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download PDF Summary Report */}
          <button
            id="download-pdf-report-btn"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02] disabled:opacity-50"
            title="Download full quiz performance summary report as PDF document"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Summary'}</span>
            <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-rose-200/80 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 uppercase">
              PDF
            </span>
          </button>

          <button
            id="export-csv-gradebook-btn"
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export CSV Gradebook</span>
          </button>

          <button
            id="sync-classroom-grades-btn"
            onClick={() => {
              sound.playClick();
              onOpenClassroomModal();
            }}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Sync to Google Classroom</span>
          </button>
        </div>
      </div>

      {/* PDF Success Feedback Banner */}
      {pdfSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{pdfSuccessMessage}</span>
          </div>
          <button
            onClick={() => setPdfSuccessMessage(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top 3 Champions Bento Podium Card */}
      <div
        className={`bento-card p-7 sm:p-9 rounded-3xl border ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        } space-y-6 text-center`}
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-black border border-amber-300 dark:border-amber-700">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            Classroom Champions Podium
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">Top Performers</h2>
        </div>

        <div className="flex items-end justify-center gap-4 sm:gap-8 pt-4">
          {/* 2nd Place */}
          {sortedGrades[1] && (
            <div className="flex flex-col items-center space-y-2">
              <span className="text-3xl">🥈</span>
              <p className="text-sm font-black truncate max-w-[110px] text-slate-800 dark:text-slate-200">{sortedGrades[1].studentName}</p>
              <p className="text-xs text-slate-500 font-bold">{sortedGrades[1].score} pts ({sortedGrades[1].percentage.toFixed(0)}%)</p>
              <div className="w-24 sm:w-32 h-24 sm:h-32 rounded-t-3xl bg-gradient-to-t from-slate-400 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center font-black text-2xl text-slate-800 dark:text-slate-100 shadow-md">
                2nd
              </div>
            </div>
          )}

          {/* 1st Place */}
          {sortedGrades[0] && (
            <div className="flex flex-col items-center space-y-2">
              <div className="relative">
                <span className="text-5xl">👑</span>
              </div>
              <p className="text-base font-black truncate max-w-[130px] text-amber-600 dark:text-amber-400">
                {sortedGrades[0].studentName}
              </p>
              <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                {sortedGrades[0].score} pts ({sortedGrades[0].percentage.toFixed(0)}%)
              </p>
              <div className="w-28 sm:w-40 h-36 sm:h-44 rounded-t-3xl bg-gradient-to-t from-amber-500 to-yellow-400 flex items-center justify-center font-black text-4xl text-amber-950 shadow-xl">
                1st
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {sortedGrades[2] && (
            <div className="flex flex-col items-center space-y-2">
              <span className="text-3xl">🥉</span>
              <p className="text-sm font-black truncate max-w-[110px] text-slate-800 dark:text-slate-200">{sortedGrades[2].studentName}</p>
              <p className="text-xs text-slate-500 font-bold">{sortedGrades[2].score} pts ({sortedGrades[2].percentage.toFixed(0)}%)</p>
              <div className="w-24 sm:w-32 h-18 sm:h-24 rounded-t-3xl bg-gradient-to-t from-amber-700 to-amber-600 dark:from-amber-800 dark:to-amber-700 flex items-center justify-center font-black text-2xl text-amber-100 shadow-md">
                3rd
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Engagement & Analytics Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Class Accuracy */}
        <div
          className={`bento-card p-5 rounded-3xl border ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/90'
          } shadow-sm space-y-2`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-wider">
            <span>Average Accuracy</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {classAvgPercentage.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500 font-medium">Across {totalQuestions} assessment slides</p>
        </div>

        {/* Avg Response Time */}
        <div
          className={`bento-card p-5 rounded-3xl border ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/90'
          } shadow-sm space-y-2`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-wider">
            <span>Avg Response Speed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {classAvgTime.toFixed(1)}s
          </p>
          <p className="text-xs text-slate-500 font-medium">Per question per student</p>
        </div>

        {/* Participation */}
        <div
          className={`bento-card p-5 rounded-3xl border ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/90'
          } shadow-sm space-y-2`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-wider">
            <span>Participation Rate</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
            100%
          </p>
          <p className="text-xs text-slate-500 font-medium">{participantsList.length} of {participantsList.length} students finished</p>
        </div>

        {/* Grade Distribution */}
        <div
          className={`bento-card p-5 rounded-3xl border ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/90'
          } shadow-sm space-y-2`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-wider">
            <span>Letter Grades</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-1 font-black text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              A: {gradebookEntries.filter((g) => g.letterGrade === 'A').length}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              B: {gradebookEntries.filter((g) => g.letterGrade === 'B').length}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              C/D: {gradebookEntries.filter((g) => ['C', 'D'].includes(g.letterGrade)).length}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Standard academic curving</p>
        </div>
      </div>

      {/* Hardest Question / Pedagogical Misconception Insight */}
      {hardestQuestion && (
        <div className="p-6 rounded-3xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Classroom Misconception Analysis • Most Challenging Question</span>
            <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 font-black">
              {hardestQuestion.accuracy}% Accuracy
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-100">
            "{hardestQuestion.question.text}"
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
            <span className="font-bold">Pedagogical Review:</span> {hardestQuestion.question.explanation}
          </p>
        </div>
      )}

      {/* Interactive Gradebook Table Bento */}
      <div
        className={`bento-card p-6 sm:p-7 rounded-3xl border ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        } space-y-4`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100">Classroom Gradebook & Roster</h3>
            <p className="text-xs text-slate-500 font-medium">
              Click any student row to inspect individualized report card and topic mastery.
            </p>
          </div>
          <span className="text-xs font-black px-3.5 py-1.5 rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {gradebookEntries.length} Students Graded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase tracking-wider">
                <th className="py-3 px-3">Student</th>
                <th className="py-3 px-3">Student ID</th>
                <th className="py-3 px-3 text-center">Correct</th>
                <th className="py-3 px-3 text-center">Percentage</th>
                <th className="py-3 px-3 text-center">Grade</th>
                <th className="py-3 px-3 text-right">Points</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {sortedGrades.map((entry, idx) => (
                <tr
                  key={entry.studentId + idx}
                  onClick={() => setSelectedStudentForReport(entry)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-3 font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="text-slate-400">#{idx + 1}</span>
                    <span>{entry.studentName}</span>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-500">{entry.studentId}</td>
                  <td className="py-3.5 px-3 text-center font-bold">
                    {entry.correctCount} / {entry.totalQuestions}
                  </td>
                  <td className="py-3.5 px-3 text-center font-black text-indigo-600 dark:text-indigo-400">
                    {entry.percentage.toFixed(0)}%
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-xl font-black text-center border ${
                        entry.letterGrade === 'A'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : entry.letterGrade === 'B'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : entry.letterGrade === 'C'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {entry.letterGrade}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-black text-slate-800 dark:text-slate-200">
                    {entry.score}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudentForReport(entry);
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Report Card
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Student Report Card Modal */}
      {selectedStudentForReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-5 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                  {selectedStudentForReport.studentName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base">{selectedStudentForReport.studentName}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedStudentForReport.studentId}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {selectedStudentForReport.percentage.toFixed(0)}%
                </span>
                <span className="ml-1 text-sm font-bold text-slate-400">Grade {selectedStudentForReport.letterGrade}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Points Earned</p>
                <p className="font-black text-sm">{selectedStudentForReport.score} / {maxPossibleScore}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Avg Speed</p>
                <p className="font-black text-sm">{selectedStudentForReport.averageResponseTimeSeconds.toFixed(1)}s</p>
              </div>
            </div>

            {/* Strengths */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Concept Strengths:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedStudentForReport.strengths.length > 0 ? (
                  selectedStudentForReport.strengths.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Needs additional practice on core themes.</span>
                )}
              </div>
            </div>

            {/* Needs Review */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Recommended Review Areas:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedStudentForReport.needsReview.length > 0 ? (
                  selectedStudentForReport.needsReview.map((r, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-medium">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-500 font-medium">Mastered all concepts in this quiz!</span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedStudentForReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
              >
                Close Report Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
