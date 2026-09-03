import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  Lock,
  ArrowRight,
  AlertCircle,
  X,
  CheckCircle2,
  KeyRound,
  User,
  Users,
  Edit2,
  Check,
} from 'lucide-react';
import { TeachingAssistant } from '../types';
import {
  getAuthorizedTeachingAssistants,
  updateTeachingAssistantRollNo,
  verifyTeachingAssistant,
  setActiveTeachingAssistant,
} from '../data/teachingAssistants';
import { sound } from '../utils/audio';

interface TeachingAssistantAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ta: TeachingAssistant) => void;
  darkMode: boolean;
}

export const TeachingAssistantAuthModal: React.FC<TeachingAssistantAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  darkMode,
}) => {
  const [roster, setRoster] = useState<TeachingAssistant[]>(getAuthorizedTeachingAssistants);
  const [selectedTaName, setSelectedTaName] = useState<string>('Sivamani');
  const [typedName, setTypedName] = useState<string>('Sivamani');
  const [passcode, setPasscode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inline editing of roll numbers for Nikitha & Madhumathi
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRollValue, setEditingRollValue] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const freshRoster = getAuthorizedTeachingAssistants();
      setRoster(freshRoster);
      setErrorMsg(null);
      setPasscode('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartEditRoll = (e: React.MouseEvent, ta: TeachingAssistant) => {
    e.stopPropagation();
    sound.playClick();
    setEditingId(ta.id);
    setEditingRollValue(ta.rollNo || '');
  };

  const handleSaveRoll = (e: React.MouseEvent, taId: string) => {
    e.stopPropagation();
    sound.playClick();
    const updated = updateTeachingAssistantRollNo(taId, editingRollValue);
    setRoster(updated);
    setEditingId(null);
  };

  const handleSelectTa = (ta: TeachingAssistant) => {
    sound.playClick();
    setSelectedTaName(ta.name);
    setTypedName(ta.name);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setErrorMsg(null);

    const nameToVerify = typedName.trim();
    const codeToVerify = passcode.trim();

    if (!nameToVerify) {
      setErrorMsg('Please enter your name as Teaching Assistant.');
      sound.playWrong();
      return;
    }

    if (!codeToVerify) {
      setErrorMsg('Please enter the security passcode to continue.');
      sound.playWrong();
      return;
    }

    if (codeToVerify !== 'TADC2026') {
      setErrorMsg('Incorrect Passcode. Access denied.');
      sound.playWrong();
      return;
    }

    const verifiedTa = verifyTeachingAssistant(nameToVerify, codeToVerify);

    if (verifiedTa) {
      sound.playFanfare();
      setActiveTeachingAssistant(verifiedTa);
      onSuccess(verifiedTa);
      onClose();
    } else {
      sound.playWrong();
      setErrorMsg(
        'Access Denied. Only authorized Teaching Assistants (Sivamani, Nikitha, Madhumathi) have host privileges.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="ta-auth-modal"
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all bento-card ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-900/20 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Teaching Assistant Verification</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Host Access
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your Teaching Assistant Name and security passcode to enter Teacher Host.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Policy Banner */}
        <div className="px-6 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800/60 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200">
          <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Authorized Teaching Assistants: <strong>Sivamani</strong>, <strong>Nikitha</strong>, <strong>Madhumathi</strong>.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick Select Profile Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>Select or Click Your TA Name:</span>
              <span className="text-[10px] text-slate-400 font-normal">3 Authorized Teaching Assistants</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {roster.map((ta) => {
                const isSelected = selectedTaName.toLowerCase() === ta.name.toLowerCase();
                const isEditingThis = editingId === ta.id;

                return (
                  <div
                    key={ta.id}
                    id={`ta-card-${ta.name.toLowerCase()}`}
                    onClick={() => handleSelectTa(ta)}
                    className={`p-3 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-2xl mb-1">{ta.avatar}</span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1 justify-center">
                      {ta.name}
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </span>

                    {/* Roll No with quick edit */}
                    <div className="mt-1 w-full" onClick={(e) => e.stopPropagation()}>
                      {isEditingThis ? (
                        <div className="flex items-center gap-1 justify-center mt-1">
                          <input
                            type="text"
                            value={editingRollValue}
                            onChange={(e) => setEditingRollValue(e.target.value.toUpperCase())}
                            placeholder="Roll No"
                            maxLength={10}
                            className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded border border-indigo-400 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 w-16 text-center"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={(e) => handleSaveRoll(e, ta.id)}
                            className="p-1 rounded bg-indigo-600 text-white text-[9px]"
                            title="Save"
                          >
                            <Check className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          <span className="font-mono text-slate-500 dark:text-slate-400 font-bold truncate max-w-[70px]">
                            {ta.rollNo || 'No Roll'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleStartEditRoll(e, ta)}
                            className="text-slate-400 hover:text-indigo-600 p-0.5"
                            title={ta.rollNo ? 'Edit Roll No' : 'Add Roll No'}
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Teaching Assistant Name</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                Sivamani / Nikitha / Madhumathi
              </span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                id="ta-name-input"
                type="text"
                value={typedName}
                onChange={(e) => {
                  setTypedName(e.target.value);
                  setSelectedTaName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter your TA Name (e.g. Sivamani)"
                className="w-full text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Passcode Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Security Passcode</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                id="ta-passcode-input"
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="enter passcode"
                className="w-full text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none tracking-wider"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2.5 text-red-700 dark:text-red-300 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="flex-1 py-3 rounded-2xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Stay as Student</span>
            </button>

            <button
              id="verify-enter-ta-host-btn"
              type="submit"
              className="flex-1 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Enter Teacher Host</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
