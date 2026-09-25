'use client';

import React, { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Clock,
  HelpCircle,
  ShieldAlert,
  Lock,
} from 'lucide-react';

interface Option {
  key: string;
  text: string;
}

interface Question {
  id: string;
  questionNumber: number;
  questionText: string;
  options: Option[];
}

interface AssessmentData {
  id: string;
  status: string;
  totalQuestions: number;
  attemptedQuestions: number;
  startedAt: string;
  deadlineAt: string;
  durationMinutes: number;
  remainingSeconds: number;
  questions: Question[];
  answers: Record<string, string>; // questionId -> optionKey
}

export default function AssessmentRunnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: assessmentId } = use(params);

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  );
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSubmitReason, setAutoSubmitReason] = useState<string | null>(null);

  const hasSubmittedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch assessment state
  useEffect(() => {
    async function loadAssessment() {
      try {
        const res = await fetch(`/api/assessments/${assessmentId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          if (data.completed || (data.error && data.error.toLowerCase().includes('completed'))) {
            router.push('/user/assessment/submitted');
            return;
          }
          setError(data.error || 'Unable to load assessment.');
          setLoading(false);
          return;
        }

        if (data.data.status === 'COMPLETED') {
          router.push('/user/assessment/submitted');
          return;
        }

        setAssessment(data.data);
        setSelectedAnswers(data.data.answers || {});
        setRemainingSeconds(data.data.remainingSeconds ?? 3600);
      } catch (err: any) {
        setError(err.message || 'Error fetching assessment.');
      } finally {
        setLoading(false);
      }
    }
    loadAssessment();
  }, [assessmentId, router]);

  // Auto-submit trigger (e.g. on time expiry or tab switch)
  const triggerAutoSubmit = useCallback(
    async (reason: string) => {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;
      setAutoSubmitReason(reason);
      setSubmitting(true);

      try {
        await fetch(`/api/assessments/${assessmentId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
          keepalive: true,
        });
      } catch (err) {
        console.error('Auto-submit fetch error:', err);
      } finally {
        router.push(`/user/assessment/submitted?reason=${encodeURIComponent(reason)}`);
      }
    },
    [assessmentId, router]
  );

  // Countdown Timer: 1 Hour Authoritative Countdown
  useEffect(() => {
    if (remainingSeconds === null || !assessment || assessment.status !== 'IN_PROGRESS' || loading) {
      return;
    }

    if (remainingSeconds <= 0) {
      triggerAutoSubmit('time_expired');
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          triggerAutoSubmit('time_expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, assessment, loading, triggerAutoSubmit]);

  // Anti-cheat: Detect tab switching via Page Visibility API
  useEffect(() => {
    if (!assessment || assessment.status !== 'IN_PROGRESS' || loading) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        triggerAutoSubmit('tab_switch');
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasSubmittedRef.current) {
        triggerAutoSubmit('tab_switch');
        e.preventDefault();
        e.returnValue = '';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [assessment, loading, triggerAutoSubmit]);

  // Debounced Autosave handler
  const handleSelectOption = useCallback(
    (questionId: string, optionKey: string) => {
      if (hasSubmittedRef.current) return;

      // 1. Instant optimistic state update
      setSelectedAnswers((prev) => ({
        ...prev,
        [questionId]: optionKey,
      }));

      setAutosaveStatus('saving');

      // 2. Debounce backend dispatch by 200ms to eliminate multi-click thrashing
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/assessments/${assessmentId}/answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionId,
              selectedOption: optionKey,
            }),
          });

          if (res.ok) {
            setAutosaveStatus('saved');
            setTimeout(() => {
              setAutosaveStatus('idle');
            }, 1500);
          } else {
            const data = await res.json().catch(() => ({}));
            if (data.error && data.error.includes('expired')) {
              triggerAutoSubmit('time_expired');
              return;
            }
            setAutosaveStatus('error');
          }
        } catch {
          setAutosaveStatus('error');
        }
      }, 200);
    },
    [assessmentId, triggerAutoSubmit]
  );

  // Manual submit assessment handler
  const handleConfirmSubmit = async () => {
    hasSubmittedRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'manual' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit assessment.');
      }

      router.push('/user/assessment/submitted?reason=manual');
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Helper: Format countdown seconds to MM:SS or HH:MM:SS
  const formatTimeRemaining = (seconds: number | null): string => {
    if (seconds === null || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium text-sm">
            Initializing your examination session...
          </p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-600">{error || 'Unable to load assessment.'}</p>
          <button
            onClick={() => router.push('/user/dashboard')}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const questions = assessment.questions || [];
  const currentQuestion = questions[currentIndex];
  const attemptedCount = Object.keys(selectedAnswers).length;
  const progressPercent = Math.round((attemptedCount / questions.length) * 100);

  // Determine Timer Alert Severity
  const isTimeCritical = remainingSeconds !== null && remainingSeconds <= 60; // < 1 min
  const isTimeWarning = remainingSeconds !== null && remainingSeconds <= 300 && !isTimeCritical; // < 5 mins

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16">
      {/* Exam Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
        <div className="w-full px-4 sm:px-8 lg:px-10 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Question progress indicator */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-bold text-slate-900">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-500">{progressPercent}%</span>
            </div>
          </div>

          {/* Center: Authoritative 1-Hour Backward Countdown Timer */}
          <div className="flex items-center">
            <div
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-2xl font-mono text-sm font-bold transition-all shadow-sm ${
                isTimeCritical
                  ? 'bg-rose-600 text-white animate-bounce ring-4 ring-rose-200'
                  : isTimeWarning
                  ? 'bg-amber-500 text-white animate-pulse ring-2 ring-amber-200'
                  : 'bg-slate-900 text-emerald-400 border border-slate-800'
              }`}
            >
              <Clock className={`w-4 h-4 ${isTimeCritical ? 'animate-spin' : ''}`} />
              <span>Time Left: {formatTimeRemaining(remainingSeconds)}</span>
            </div>
          </div>

          {/* Right: Autosave status & Submit button */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Autosave status indicator */}
            <div className="text-xs font-medium flex items-center space-x-1.5">
              {autosaveStatus === 'saving' && (
                <span className="text-amber-600 flex items-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  Saving...
                </span>
              )}
              {autosaveStatus === 'saved' && (
                <span className="text-emerald-600 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Saved
                </span>
              )}
              {autosaveStatus === 'error' && (
                <span className="text-rose-600 flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Save failed
                </span>
              )}
              {autosaveStatus === 'idle' && (
                <span className="text-slate-400 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-slate-300" />
                  Autosave active
                </span>
              )}
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Assessment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Examination Layout */}
      <div className="w-full px-4 sm:px-8 lg:px-10 pt-6 flex-1 space-y-4">
        {/* Anti-cheat tab-switching warning banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 px-4 flex items-center justify-between text-xs text-amber-900 shadow-sm">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Examination Rules:</strong> Duration is strictly{' '}
              {assessment.durationMinutes || assessment.totalQuestions || 60} minutes (1 min per question). Switching browser tabs will{' '}
              <u>immediately auto-submit</u> your exam. When time expires, it auto-submits automatically.
            </span>
          </div>
          <span className="hidden sm:inline-block font-bold text-[11px] text-amber-800 uppercase tracking-wider">
            Attempt 1/1
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Question & Options Card (8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Question Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    Question {currentIndex + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Select 1 correct option
                  </span>
                </div>

                {/* Question Text */}
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                  {currentQuestion?.questionText}
                </h2>

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {currentQuestion?.options.map((option) => {
                    const isSelected = selectedAnswers[currentQuestion.id] === option.key;
                    return (
                      <button
                        key={option.key}
                        onClick={() => handleSelectOption(currentQuestion.id, option.key)}
                        disabled={submitting}
                        className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all flex items-start space-x-4 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {option.key}
                        </div>
                        <div
                          className={`text-sm sm:text-base leading-relaxed ${
                            isSelected ? 'font-semibold text-blue-950' : 'text-slate-800'
                          }`}
                        >
                          {option.text}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-8">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center px-5 py-3 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-colors space-x-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="text-xs font-medium text-slate-500">
                  {selectedAnswers[currentQuestion?.id] ? (
                    <span className="text-emerald-600 font-semibold flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Option{' '}
                      {selectedAnswers[currentQuestion.id]} Selected
                    </span>
                  ) : (
                    <span>Not yet answered</span>
                  )}
                </div>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="inline-flex items-center px-6 py-3 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all space-x-2"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex items-center px-6 py-3 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all space-x-2"
                  >
                    <span>Review & Submit</span>
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Question Matrix Navigation Palette (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Question Matrix</h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                  {attemptedCount}/{questions.length} Answered
                </span>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded bg-blue-600" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded border-2 border-blue-600 bg-white" />
                  <span>Current</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
                  <span>Unanswered</span>
                </div>
              </div>

              {/* 50-Question Interactive Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isAnswered = !!selectedAnswers[q.id];
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'border-2 border-blue-600 bg-blue-50 text-blue-700 shadow-sm font-extrabold ring-2 ring-blue-500/20'
                          : isAnswered
                          ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Final Submission</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Confirm Final Submission</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                You have answered <strong>{attemptedCount}</strong> of{' '}
                <strong>{questions.length}</strong> questions.
                {attemptedCount < questions.length && (
                  <span className="text-rose-600 block font-semibold mt-1">
                    Warning: You have {questions.length - attemptedCount} unanswered question(s).
                  </span>
                )}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-bold text-slate-900">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Attempted:</span>
                <span className="font-bold text-blue-600">{attemptedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Unanswered:</span>
                <span className="font-bold text-amber-600">
                  {questions.length - attemptedCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Time Remaining:</span>
                <span className="font-bold text-slate-900">{formatTimeRemaining(remainingSeconds)}</span>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-xs text-rose-900 flex items-start space-x-2.5">
              <Lock className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Irreversible Action:</span> Once confirmed, your session
                will be permanently locked. You will not be able to change answers or retake the
                test.
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Continue Test
              </button>

              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Yes, Submit Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
