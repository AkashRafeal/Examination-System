'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Play,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Lock,
  XCircle,
} from 'lucide-react';

interface AssessmentState {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  assessmentId?: string;
  startedAt?: string;
  submittedAt?: string;
  totalQuestions?: number;
  durationMinutes?: number;
  isConfigured?: boolean;
  categories?: { name: string; quantity: number }[];
}

export default function UserDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [assessmentState, setAssessmentState] = useState<AssessmentState>({
    status: 'NOT_STARTED',
  });
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }
        const userData = await userRes.json();
        setUserName(userData.user.name);

        // Check if user has an assessment via read-only status endpoint
        const statusRes = await fetch('/api/assessments/status');
        const statusData = await statusRes.json();

        if (statusRes.ok) {
          setAssessmentState({
            status: statusData.status,
            assessmentId: statusData.assessmentId,
            startedAt: statusData.startedAt,
            submittedAt: statusData.submittedAt,
            totalQuestions: statusData.totalQuestions,
            durationMinutes: statusData.durationMinutes,
            isConfigured: statusData.isConfigured,
            categories: statusData.categories || [],
          });
        }
      } catch (err: any) {
        setError(err.message || 'Error loading dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleStartClick = () => {
    if (assessmentState.status === 'COMPLETED') {
      alert('You have already completed the assessment. Only one attempt is permitted. No more attempts are allowed.');
      return;
    }

    if (assessmentState.status === 'NOT_STARTED' && assessmentState.isConfigured === false) {
      alert(
        'The administrator has not yet configured the questions for this assessment. Please contact your administrator.'
      );
      return;
    }

    if (assessmentState.assessmentId) {
      router.push(`/user/assessment/${assessmentState.assessmentId}`);
      return;
    }

    setShowStartModal(true);
  };

  const handleConfirmStart = async () => {
    setShowStartModal(false);
    setStarting(true);
    setError('');

    try {
      const res = await fetch('/api/assessments/start', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.alreadyCompleted) {
          setAssessmentState({ status: 'COMPLETED' });
        }
        setError(data.error || 'Failed to initialize assessment');
        setStarting(false);
        return;
      }

      router.push(`/user/assessment/${data.data.id}`);
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Loading candidate portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-blue-100 text-xs font-semibold mb-4 backdrop-blur-sm">
            <GraduationCap className="w-4 h-4" />
            <span>Online Assessment Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome, {userName}!
          </h1>
          <p className="mt-3 text-blue-100 text-base leading-relaxed">
            Welcome to your evaluation dashboard. Each candidate is permitted{' '}
            <strong className="text-white underline">exactly one attempt</strong>. Questions are
            selected across specialized categories and fully randomized.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start text-sm">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Assessment Status Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Standardized Assessment</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Category-based Technical & Analytical Evaluation
            </p>
          </div>

          <div>
            {assessmentState.status === 'NOT_STARTED' && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  assessmentState.isConfigured === false
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {assessmentState.isConfigured === false
                  ? 'Questions Not Configured'
                  : 'Attempt 0/1 Used • Ready'}
              </span>
            )}
            {assessmentState.status === 'IN_PROGRESS' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                Attempt 1/1 • In Progress
              </span>
            )}
            {assessmentState.status === 'COMPLETED' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center">
                <Lock className="w-3.5 h-3.5 mr-1" />
                Attempt 1/1 Completed (Locked)
              </span>
            )}
          </div>
        </div>

        {/* Status Specific Content */}
        {assessmentState.status === 'COMPLETED' ? (
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">
                Assessment Completed — No More Attempts Permitted
              </h3>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
                Single Attempt Policy Strictly Enforced
              </p>
            </div>

            <div className="p-4 max-w-lg mx-auto rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm leading-relaxed font-medium shadow-sm">
              &ldquo;Your assessment has been submitted successfully. Your result will be available
              to the administrator.&rdquo;
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              You have used your 1 attempt. The platform does not allow candidates to retake, reset,
              or create another assessment. If you believe this is an error, contact your institution
              administrator.
            </p>

            <div className="pt-2 text-xs text-slate-400">
              Submitted on:{' '}
              {assessmentState.submittedAt
                ? new Date(assessmentState.submittedAt).toLocaleString()
                : 'Recorded'}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Questions
                </div>
                {assessmentState.isConfigured === false ? (
                  <>
                    <div className="text-xl font-extrabold text-amber-600 mt-1">Not Configured</div>
                    <div className="text-xs text-slate-500 mt-1">Awaiting admin setup</div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                      {assessmentState.totalQuestions || 0} MCQs
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {assessmentState.durationMinutes || assessmentState.totalQuestions || 0} Mins (1 min/question)
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Question Format
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">Single Choice</div>
                <div className="text-xs text-slate-500 mt-1">4 options (A, B, C, D)</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Attempt Limit
                </div>
                <div className="text-2xl font-extrabold text-rose-600 mt-1">Strictly 1 Attempt</div>
                <div className="text-xs text-slate-500 mt-1">No retakes or second chances</div>
              </div>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 flex items-start space-x-3 text-xs text-amber-900">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Strict Rule Warning:</span> You are allowed only ONE
                attempt. Once submitted, the platform will permanently lock you out from taking the
                exam again.
              </div>
            </div>

            <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 flex items-start space-x-3 text-xs text-rose-950">
              <Lock className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-bold">Anti-Cheat Tab-Lock Rule:</span> During the exam, you
                must <strong>remain on the exam tab</strong>. Switching to another browser tab,
                minimizing the window, or navigating away will <strong>instantly auto-submit</strong>{' '}
                your examination with whatever answers you have completed at that moment.
              </div>
            </div>

            {assessmentState.isConfigured === false && (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start space-x-3 text-xs text-amber-900">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold">Assessment Not Yet Configured:</span> The administrator has not configured the question quantities for this assessment yet. Once the administrator selects the question distribution in the Admin Categories panel, the exam will become available.
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-center">
              <button
                onClick={handleStartClick}
                disabled={
                  starting ||
                  (assessmentState.status === 'NOT_STARTED' && assessmentState.isConfigured === false)
                }
                className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl text-base font-bold transition-all space-x-3 ${
                  assessmentState.status === 'NOT_STARTED' && assessmentState.isConfigured === false
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 cursor-pointer disabled:opacity-75'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {starting
                    ? 'Preparing Assessment...'
                    : assessmentState.status === 'IN_PROGRESS'
                    ? 'Continue Assessment'
                    : assessmentState.isConfigured === false
                    ? 'Awaiting Admin Question Configuration'
                    : 'Start Assessment'}
                </span>
                {(assessmentState.status === 'IN_PROGRESS' ||
                  assessmentState.isConfigured !== false) && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Start Exam Confirmation & Rules Modal */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Examination Regulations & Acknowledgment
              </h3>
              <p className="text-xs text-slate-500">
                Please review the strict assessment regulations before initializing your session.
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">
                    {assessmentState.totalQuestions || 0} Randomized MCQs:
                  </span>{' '}
                  Exactly {assessmentState.totalQuestions || 0} questions will be selected randomly and locked for your attempt ({assessmentState.durationMinutes || assessmentState.totalQuestions || 0} minutes duration).
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3">
                <Lock className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-900">Strictly 1 Attempt:</span> You cannot retake, reset, or restart the exam once initiated.
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-start space-x-3">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900">No Tab Switching Permitted:</span> Do NOT switch tabs, minimize, or leave the exam tab. If you switch tabs, your exam will <strong>immediately auto-submit</strong> with whatever answers you have completed.
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setShowStartModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmStart}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2"
              >
                <span>I Understand & Begin Exam</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
