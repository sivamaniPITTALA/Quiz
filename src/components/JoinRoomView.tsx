import React, { useState } from 'react';
import {
  Users,
  Sparkles,
  ArrowRight,
  WifiOff,
  AlertCircle,
  HelpCircle,
  Hash,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface JoinRoomViewProps {
  onJoin: (pin: string, studentName: string, studentId: string, avatar: string) => Promise<void>;
  onStartOfflineQuiz: () => void;
  darkMode: boolean;
  initialPin?: string;
}

export const JoinRoomView: React.FC<JoinRoomViewProps> = ({
  onJoin,
  onStartOfflineQuiz,
  darkMode,
  initialPin = '',
}) => {
  const [pin, setPin] = useState<string>(initialPin);
  const [studentName, setStudentName] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🚀');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const avatars = ['🚀', '⚡', '🌟', '🦊', '🐼', '🦁', '🦉', '🐬', '🐙', '🎨'];
  const sampleRollNos = ['25MCMI28', '25MCMT41', '25MCCE25'];

  // University Roll Number Validation (e.g. 25MCMI28: 2 digits + 4 letters + 2 digits)
  const isRollNoValid = (roll: string) => {
    const formatted = roll.trim().toUpperCase();
    return /^[0-9]{2}[A-Z]{4}[0-9]{2}$/.test(formatted) || /^[A-Z0-9]{8}$/.test(formatted);
  };

  const handleRollNoChange = (value: string) => {
    // Only accept alphanumeric characters, auto-uppercase, max 8 characters
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setStudentId(sanitized);
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Please enter the 6-digit Room PIN displayed by your instructor.');
      return;
    }
    if (!studentName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const cleanRollNo = studentId.trim().toUpperCase();
    if (!cleanRollNo) {
      setErrorMsg('Please enter your 8-digit University Roll Number (e.g., 25MCMI28).');
      return;
    }
    if (cleanRollNo.length !== 8) {
      setErrorMsg(`Roll Number must be exactly 8 characters (currently ${cleanRollNo.length}/8). Example: 25MCMI28, 25MCMT41.`);
      return;
    }
    if (!/^[0-9]{2}[A-Z]{4}[0-9]{2}$/.test(cleanRollNo) && !/^[A-Z0-9]{8}$/.test(cleanRollNo)) {
      setErrorMsg('Invalid Roll Number format. Expected 8-character format like 25MCMI28, 25MCMT41, 25MCCE25.');
      return;
    }

    sound.playClick();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onJoin(pin.trim(), studentName.trim(), cleanRollNo, selectedAvatar);
    } catch (err: any) {
      sound.playWrong();
      setErrorMsg(err.message || 'Could not connect to room. Please check the PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rollValid = studentId.length === 8 && isRollNoValid(studentId);

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Users className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Join Live Classroom Poll</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Enter the PIN and your University Roll Number to participate
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`p-6 sm:p-7 rounded-3xl border shadow-xl space-y-5 transition-all bento-card ${
          darkMode ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* PIN Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-indigo-500" />
            Classroom Game PIN
          </label>
          <input
            id="student-pin-input"
            type="text"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 849201"
            className="w-full text-center text-3xl font-black font-mono tracking-widest rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-3 text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-inner"
          />
        </div>

        {/* Student Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Student Full Name
          </label>
          <input
            id="student-name-input"
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="e.g. Alex Rivera"
            className="w-full text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Student University Roll Number (Strict 8-char validation) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
              University Roll Number
            </label>
            <span
              className={`text-[11px] font-black font-mono px-2 py-0.5 rounded-lg border ${
                rollValid
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : studentId.length > 0
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {rollValid ? '✓ 8 Digits Valid' : `${studentId.length}/8 chars`}
            </span>
          </div>

          <div className="relative">
            <input
              id="student-id-input"
              type="text"
              maxLength={8}
              value={studentId}
              onChange={(e) => handleRollNoChange(e.target.value)}
              placeholder="e.g. 25MCMI28"
              className={`w-full text-sm font-mono font-black rounded-xl border px-4 py-2.5 uppercase tracking-widest focus:ring-2 focus:outline-none transition-all ${
                rollValid
                  ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 focus:ring-emerald-500'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-indigo-500'
              }`}
            />
            {rollValid && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-3" />
            )}
          </div>

          {/* Helper & Quick Fill Chips */}
          <div className="pt-1 space-y-1">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Format: 8 alphanumeric digits (e.g. 2 digits + 4 letters + 2 digits)
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Samples:</span>
              {sampleRollNos.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setStudentId(sample);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Avatar Selector */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Choose Your Avatar
          </label>
          <div className="flex flex-wrap gap-2 justify-center">
            {avatars.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setSelectedAvatar(av)}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                  selectedAvatar === av
                    ? 'bg-indigo-600 text-white scale-110 shadow-md ring-2 ring-indigo-400'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          id="join-room-submit-btn"
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:scale-[1.01]"
        >
          <span>{isSubmitting ? 'Connecting to Room...' : 'Enter Live Quiz'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Offline Runner Fallback */}
      <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-center space-y-2 bento-card">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          In a remote classroom or low-connectivity area?
        </p>
        <button
          id="launch-offline-student-btn"
          onClick={onStartOfflineQuiz}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <WifiOff className="w-3.5 h-3.5" />
          <span>Launch Offline Mode & Take Practice Test</span>
        </button>
      </div>
    </div>
  );
};
