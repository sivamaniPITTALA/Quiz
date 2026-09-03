import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { FacultyDashboard } from './components/FacultyDashboard';
import { QuizEditor } from './components/QuizEditor';
import { PresenterLiveView } from './components/PresenterLiveView';
import { StudentLiveView } from './components/StudentLiveView';
import { JoinRoomView } from './components/JoinRoomView';
import { FinalResultsAnalytics } from './components/FinalResultsAnalytics';
import { OfflineQuizRunner } from './components/OfflineQuizRunner';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { GoogleClassroomModal } from './components/GoogleClassroomModal';
import { TeachingAssistantAuthModal } from './components/TeachingAssistantAuthModal';
import { Quiz, LiveRoom, RoomPhase, TeachingAssistant } from './types';
import { getStoredQuizzes, saveQuizToStorage, deleteQuizFromStorage } from './utils/storage';
import { sound } from './utils/audio';
import { getActiveTeachingAssistant, clearActiveTeachingAssistant } from './data/teachingAssistants';
import { computeGradebookFromRoom } from './utils/classroomService';

export default function App() {
  // Theme & Sound
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('live_quiz_dark_mode');
        return saved ? JSON.parse(saved) : false;
      } catch {
        return false;
      }
    }
    return false;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [isClassroomConnected, setIsClassroomConnected] = useState<boolean>(true);

  // Teaching Assistant Access Control - only the 4 TAs have teacher access
  const [activeTa, setActiveTa] = useState<TeachingAssistant | null>(() => {
    try {
      return getActiveTeachingAssistant();
    } catch {
      return null;
    }
  });
  const [isTaAuthModalOpen, setIsTaAuthModalOpen] = useState<boolean>(false);

  // Quizzes State
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    try {
      return getStoredQuizzes();
    } catch {
      return [];
    }
  });
  const [activeEditingQuiz, setActiveEditingQuiz] = useState<Quiz | null>(null);

  // Navigation & Role: Strictly default to student unless authorized TA session is present
  const [currentRole, setCurrentRole] = useState<'faculty' | 'student'>(() => {
    try {
      return getActiveTeachingAssistant() ? 'faculty' : 'student';
    } catch {
      return 'student';
    }
  });
  const [facultyView, setFacultyView] = useState<'dashboard' | 'editor' | 'presenter' | 'final_results'>('dashboard');
  const [studentView, setStudentView] = useState<'join' | 'live' | 'offline'>('join');

  // Active Live Room State
  const [activeRoom, setActiveRoom] = useState<LiveRoom | null>(null);
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState<boolean>(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState<boolean>(false);

  const activeRoomRef = useRef<LiveRoom | null>(null);
  activeRoomRef.current = activeRoom;

  // Dark Mode side effect
  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('live_quiz_dark_mode', JSON.stringify(darkMode));
    } catch {
      // Storage unavailable or restricted
    }
  }, [darkMode]);

  // URL Query PIN parameter support (e.g. ?pin=849201)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const pinParam = urlParams.get('pin');
        if (pinParam) {
          setCurrentRole('student');
          setStudentView('join');
        }
      } catch {
        // Location query access restricted
      }
    }
  }, []);

  // Timer Tick & Real-time Room Sync Interval
  useEffect(() => {
    if (!activeRoom) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${activeRoom.pin}`);
        if (res.ok) {
          const data = await res.json();
          if (data.room) {
            setActiveRoom((prev) => {
              if (!prev) return data.room;

              // If host, decrement timer if active
              let timerRemaining = data.room.timerRemainingSeconds;
              if (
                currentRole === 'faculty' &&
                data.room.phase === 'question' &&
                !data.room.isTimerPaused &&
                timerRemaining > 0
              ) {
                timerRemaining = Math.max(0, timerRemaining - 1);
                if (timerRemaining <= 5 && timerRemaining > 0 && soundEnabled) {
                  sound.playTimerTick();
                }
              }

              return {
                ...data.room,
                timerRemainingSeconds: timerRemaining,
              };
            });
          }
        }
      } catch (err) {
        console.warn('Sync poll error', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRoom?.pin, currentRole, soundEnabled]);

  // -------------------------------------------------------------
  // Faculty Actions
  // -------------------------------------------------------------

  const handleLaunchLiveQuiz = async (quiz: Quiz) => {
    sound.playClick();
    try {
      const hostDisplayName = activeTa
        ? `${activeTa.name}${activeTa.rollNo ? ` (${activeTa.rollNo})` : ''}`
        : 'Course Faculty';

      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz,
          hostName: hostDisplayName,
          settings: {
            showLivePercentages: true,
            streakBonus: true,
            speedBonus: true,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setActiveRoom(data.room);
        setFacultyView('presenter');
      }
    } catch (err) {
      console.error('Failed to create room', err);
    }
  };

  const handleUpdateRoomPhase = async (phase: RoomPhase, questionIndex?: number) => {
    if (!activeRoom) return;
    try {
      const response = await fetch(`/api/rooms/${activeRoom.pin}/phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase, questionIndex }),
      });

      const data = await response.json();
      if (data.success) {
        setActiveRoom(data.room);
        if (phase === 'final_results') {
          setFacultyView('final_results');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOverrideAction = async (action: string, payload?: any) => {
    if (!activeRoom) return;
    try {
      const response = await fetch(`/api/rooms/${activeRoom.pin}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      const data = await response.json();
      if (data.success) {
        setActiveRoom(data.room);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePopulateBots = async (count: number = 8) => {
    if (!activeRoom) return;
    try {
      const response = await fetch(`/api/rooms/${activeRoom.pin}/populate-bots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      const data = await response.json();
      if (data.success) {
        setActiveRoom(data.room);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateAnswers = async () => {
    if (!activeRoom) return;
    try {
      const response = await fetch(`/api/rooms/${activeRoom.pin}/simulate-answers`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setActiveRoom(data.room);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateTopic = async (topic: string, subject: string) => {
    setIsGeneratingTopic(true);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          subject,
          questionCount: 5,
          timeLimit: 30,
        }),
      });
      const data = await response.json();
      if (data.success && data.quiz) {
        const updated = saveQuizToStorage(data.quiz);
        setQuizzes(updated);
        sound.playCorrect();
        setActiveEditingQuiz(data.quiz);
        setFacultyView('editor');
      }
    } catch (err) {
      console.error(err);
      sound.playWrong();
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  const handleQuizParsed = (parsedQuiz: Quiz) => {
    const updated = saveQuizToStorage(parsedQuiz);
    setQuizzes(updated);
    setActiveEditingQuiz(parsedQuiz);
    setFacultyView('editor');
  };

  const handleSaveQuiz = (quiz: Quiz) => {
    const updated = saveQuizToStorage(quiz);
    setQuizzes(updated);
  };

  const handleDeleteQuiz = (id: string) => {
    const updated = deleteQuizFromStorage(id);
    setQuizzes(updated);
  };

  // -------------------------------------------------------------
  // Student Actions
  // -------------------------------------------------------------

  const handleStudentJoin = async (
    pin: string,
    studentName: string,
    studentId: string,
    avatar: string
  ) => {
    const response = await fetch(`/api/rooms/${pin}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName, studentId, avatar }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Room not found. Please verify the PIN.');
    }

    sound.playCorrect();
    setActiveRoom(data.room);
    setMyParticipantId(data.participantId);
    setStudentView('live');
  };

  const handleStudentSubmitAnswer = async (optionIndex: number, timeSpentMs: number) => {
    if (!activeRoom || !myParticipantId) return;
    const currentQ = activeRoom.quiz.questions[activeRoom.currentQuestionIndex];
    if (!currentQ) return;

    try {
      const response = await fetch(`/api/rooms/${activeRoom.pin}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: myParticipantId,
          questionId: currentQ.id,
          selectedOptionIndex: optionIndex,
          timeSpentMs,
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.isCorrect) sound.playCorrect();
        else sound.playWrong();
      }
    } catch (err) {
      console.error('Answer submission error', err);
    }
  };

  const handleTaAuthSuccess = (ta: TeachingAssistant) => {
    setActiveTa(ta);
    setCurrentRole('faculty');
    setFacultyView('dashboard');
  };

  const handleLogoutTa = () => {
    clearActiveTeachingAssistant();
    setActiveTa(null);
    setCurrentRole('student');
    setStudentView('join');
    sound.playClick();
  };

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-200 ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Global Application Navbar */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const nextVal = !soundEnabled;
          setSoundEnabled(nextVal);
          sound.setEnabled(nextVal);
        }}
        currentRole={currentRole}
        onChangeRole={(role) => {
          if (role === 'faculty') {
            if (!activeTa) {
              setIsTaAuthModalOpen(true);
              return;
            }
            setCurrentRole('faculty');
            if (facultyView === 'presenter') {
              // keep presenter
            }
          } else {
            setCurrentRole('student');
            if (!myParticipantId) {
              setStudentView('join');
            }
          }
        }}
        isOffline={isOfflineMode}
        onToggleOfflineMode={() => {
          const next = !isOfflineMode;
          setIsOfflineMode(next);
          if (next) {
            setCurrentRole('student');
            setStudentView('offline');
          }
        }}
        isClassroomConnected={isClassroomConnected}
        onOpenClassroomModal={() => setIsClassroomModalOpen(true)}
        activeRoomPin={activeRoom?.pin}
        onReturnToLobby={() => {
          sound.playClick();
          if (currentRole === 'faculty') setFacultyView('dashboard');
          else setStudentView('join');
        }}
        activeTa={activeTa}
        onOpenTaAuthModal={() => setIsTaAuthModalOpen(true)}
        onLogoutTa={handleLogoutTa}
      />

      {/* Main Role Content View */}
      <main id="app-main-content">
        {/* ========================================================= */}
        {/* FACULTY HOST VIEWS */}
        {/* ========================================================= */}
        {currentRole === 'faculty' && (
          <>
            {facultyView === 'dashboard' && (
              <FacultyDashboard
                quizzes={quizzes}
                onOpenUploadModal={() => setIsUploadModalOpen(true)}
                onLaunchLiveQuiz={handleLaunchLiveQuiz}
                onEditQuiz={(quiz) => {
                  setActiveEditingQuiz(quiz);
                  setFacultyView('editor');
                }}
                onCreateNewManual={() => {
                  const emptyQuiz: Quiz = {
                    id: 'quiz-' + Date.now(),
                    title: 'New Classroom Assessment',
                    description: 'Custom interactive assessment slides',
                    subject: 'General Knowledge',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    defaultTimeLimit: 30,
                    tags: ['Quiz'],
                    totalPoints: 100,
                    questions: [
                      {
                        id: `q-1-${Date.now()}`,
                        text: 'Enter your first question here...',
                        type: 'multiple-choice',
                        options: ['Option A', 'Option B', 'Option C', 'Option D'],
                        correctAnswerIndex: 0,
                        explanation: 'Add pedagogical review explanation here.',
                        timeLimitSeconds: 30,
                        points: 100,
                        difficulty: 'Easy',
                        topicTag: 'General',
                      },
                    ],
                  };
                  setActiveEditingQuiz(emptyQuiz);
                  setFacultyView('editor');
                }}
                onDeleteQuiz={handleDeleteQuiz}
                onOpenClassroomModal={() => setIsClassroomModalOpen(true)}
                onGenerateFromTopic={handleGenerateTopic}
                isGeneratingTopic={isGeneratingTopic}
                darkMode={darkMode}
                activeTa={activeTa}
                onOpenTaAuthModal={() => setIsTaAuthModalOpen(true)}
              />
            )}

            {facultyView === 'editor' && activeEditingQuiz && (
              <QuizEditor
                initialQuiz={activeEditingQuiz}
                onSave={handleSaveQuiz}
                onLaunchLive={handleLaunchLiveQuiz}
                onBack={() => setFacultyView('dashboard')}
                darkMode={darkMode}
              />
            )}

            {facultyView === 'presenter' && activeRoom && (
              <PresenterLiveView
                room={activeRoom}
                onUpdatePhase={handleUpdateRoomPhase}
                onOverrideAction={handleOverrideAction}
                onPopulateBots={handlePopulateBots}
                onSimulateAnswers={handleSimulateAnswers}
                onEndSession={() => setFacultyView('final_results')}
                darkMode={darkMode}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
              />
            )}

            {facultyView === 'final_results' && activeRoom && (
              <FinalResultsAnalytics
                room={activeRoom}
                onOpenClassroomModal={() => setIsClassroomModalOpen(true)}
                onReturnToDashboard={() => setFacultyView('dashboard')}
                darkMode={darkMode}
              />
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* STUDENT VIEWS */}
        {/* ========================================================= */}
        {currentRole === 'student' && (
          <>
            {studentView === 'join' && (
              <JoinRoomView
                onJoin={handleStudentJoin}
                onStartOfflineQuiz={() => setStudentView('offline')}
                darkMode={darkMode}
                initialPin={activeRoom?.pin || ''}
              />
            )}

            {studentView === 'live' && activeRoom && myParticipantId && (
              <StudentLiveView
                room={activeRoom}
                participantId={myParticipantId}
                onSubmitAnswer={handleStudentSubmitAnswer}
                darkMode={darkMode}
              />
            )}

            {studentView === 'offline' && (
              <OfflineQuizRunner
                onBack={() => setStudentView('join')}
                darkMode={darkMode}
              />
            )}
          </>
        )}
      </main>

      {/* AI Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onQuizParsed={handleQuizParsed}
        darkMode={darkMode}
      />

      {/* Google Classroom Integration Modal */}
      <GoogleClassroomModal
        isOpen={isClassroomModalOpen}
        onClose={() => setIsClassroomModalOpen(false)}
        quizTitle={activeRoom?.quizTitle || 'Live Classroom Assessment'}
        grades={activeRoom ? computeGradebookFromRoom(activeRoom) : []}
        darkMode={darkMode}
        onSyncComplete={() => setIsClassroomConnected(true)}
      />

      {/* Teaching Assistant Verification Modal (Strictly 4 Authorized TAs) */}
      <TeachingAssistantAuthModal
        isOpen={isTaAuthModalOpen}
        onClose={() => setIsTaAuthModalOpen(false)}
        onSuccess={handleTaAuthSuccess}
        darkMode={darkMode}
      />
    </div>
  );
}
