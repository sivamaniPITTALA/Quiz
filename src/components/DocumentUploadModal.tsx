import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  FileImage,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Quiz } from '../types';
import { sound } from '../utils/audio';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizParsed: (quiz: Quiz) => void;
  darkMode: boolean;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onQuizParsed,
  darkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [subject, setSubject] = useState<string>('Computer Science');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [defaultTimeLimit, setDefaultTimeLimit] = useState<number>(30);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseStatus, setParseStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelected = (selectedFile: File) => {
    setErrorMsg(null);
    setFile(selectedFile);

    // If image, create preview
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const readFileAsBase64 = (fileToRead: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileToRead);
    });
  };

  const handleStartAIParsing = async () => {
    if (activeTab === 'upload' && !file) {
      setErrorMsg('Please upload a document (PDF, PNG, JPG) first.');
      return;
    }
    if (activeTab === 'text' && !rawText.trim()) {
      setErrorMsg('Please paste or type study notes or questions.');
      return;
    }

    sound.playClick();
    setIsParsing(true);
    setErrorMsg(null);
    setParseStatus('Extracting content and structure...');

    try {
      let fileData: string | undefined;
      let mimeType: string | undefined;

      if (file && activeTab === 'upload') {
        setParseStatus(`Uploading and encoding ${file.name}...`);
        fileData = await readFileAsBase64(file);
        mimeType = file.type || 'application/pdf';
      }

      setParseStatus('AI analyzing pedagogical concepts and formulating options...');

      const response = await fetch('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          mimeType,
          rawText: activeTab === 'text' ? rawText : undefined,
          subject,
          targetQuestionCount: questionCount,
          defaultTimeLimit,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Failed to parse document.');
      }

      sound.playCorrect();
      setParseStatus('Quiz questions generated successfully!');
      setTimeout(() => {
        onQuizParsed(data.quiz);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error(err);
      sound.playWrong();
      setErrorMsg(err.message || 'An error occurred during AI parsing.');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="ai-document-modal"
        className={`w-full max-w-2xl rounded-3xl shadow-2xl border overflow-hidden transition-all bento-card ${
          darkMode ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg">AI Document Parsing Engine</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Upload PDFs, test photos, or notes to auto-generate live quiz slides
              </p>
            </div>
          </div>
          <button
            id="close-upload-modal-btn"
            onClick={onClose}
            disabled={isParsing}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Method Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <button
              id="upload-file-tab-btn"
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('upload');
              }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload PDF / Image Document
            </button>
            <button
              id="paste-text-tab-btn"
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('text');
              }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'text'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Paste Syllabus / Raw Text
            </button>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === 'upload' && (
            <div
              id="dropzone-area"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]'
                  : file
                  ? 'border-emerald-500/80 bg-emerald-50/30 dark:bg-emerald-950/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp,image/jpg,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-sm">
                    {file.type.startsWith('image/') ? <FileImage className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-800 dark:text-slate-200">{file.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI extraction</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setFilePreview(null);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:underline pt-1"
                  >
                    Remove and choose another
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mx-auto flex items-center justify-center shadow-sm">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
                      Click to browse or drag & drop document
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                      Supports PDF exam files, lecture slides, scanned worksheets, and diagrams (PNG, JPG, PDF)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Raw Text / Notes */}
          {activeTab === 'text' && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between uppercase tracking-wider">
                <span>Lecture Notes, Test Bank, or Syllabus Content</span>
                <span className="text-slate-400 font-normal font-mono">{rawText.length} characters</span>
              </label>
              <textarea
                id="raw-text-input"
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your quiz questions, textbook summary, flashcards, or syllabus here..."
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Subject */}
            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                Subject Area
              </label>
              <select
                id="subject-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Computer Science">Computer Science & Coding</option>
                <option value="Biology">Biology & Life Sciences</option>
                <option value="Physics">Physics & Engineering</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics & Calculus</option>
                <option value="History">History & Social Studies</option>
                <option value="Literature">Literature & Language</option>
                <option value="General Knowledge">General Assessment</option>
              </select>
            </div>

            {/* Questions Count */}
            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                Question Count
              </label>
              <select
                id="question-count-select"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={3}>3 Questions (Quick Poll)</option>
                <option value={5}>5 Questions (Standard)</option>
                <option value={8}>8 Questions (Comprehensive)</option>
                <option value={10}>10 Questions (Full Test)</option>
              </select>
            </div>

            {/* Default Timer */}
            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Time Per Question
              </label>
              <select
                id="timer-select"
                value={defaultTimeLimit}
                onChange={(e) => setDefaultTimeLimit(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={15}>15 Seconds (Blitz)</option>
                <option value={20}>20 Seconds (Fast)</option>
                <option value={30}>30 Seconds (Recommended)</option>
                <option value={45}>45 Seconds (Deep Thinking)</option>
                <option value={60}>60 Seconds (Complex Problem)</option>
              </select>
            </div>
          </div>

          {/* Parsing Status / Loader */}
          {isParsing && (
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3 animate-pulse">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs">
                <p className="font-black text-indigo-900 dark:text-indigo-200">Gemini 3.7 Flash Engine Active</p>
                <p className="text-indigo-700 dark:text-indigo-400 font-medium">{parseStatus}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2.5 text-red-700 dark:text-red-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <button
            id="cancel-modal-btn"
            type="button"
            onClick={onClose}
            disabled={isParsing}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            id="generate-quiz-btn"
            type="button"
            onClick={handleStartAIParsing}
            disabled={isParsing}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isParsing ? 'Processing Document...' : 'Generate Live Quiz Slides'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
