'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface ResultDetail {
  assessment: {
    id: string;
    status: string;
    totalQuestions: number;
    attemptedQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unanswered: number;
    score: number;
    percentage: number;
    startedAt: string;
    submittedAt: string | null;
  };
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  questions: {
    order: number;
    questionId: string;
    questionText: string;
    category: string;
    difficulty: string;
    options: { key: string; text: string; isCorrect: boolean }[];
    userAnswer: { key: string; text: string } | null;
    correctAnswer: { key: string; text: string };
    status: 'CORRECT' | 'INCORRECT' | 'UNANSWERED';
  }[];
}

export default function DetailedResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [detail, setDetail] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
  const [retakeError, setRetakeError] = useState('');

  const handleAllowRetake = async () => {
    if (!detail) return;
    setIsRetaking(true);
    setRetakeError('');
    try {
      const res = await fetch('/api/admin/assessments/retake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: detail.assessment.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to allow retake');
      }

      router.push('/admin/results');
    } catch (err: any) {
      setRetakeError(err.message || 'An error occurred while enabling retake');
    } finally {
      setIsRetaking(false);
    }
  };

  useEffect(() => {
    async function loadDetail() {
      try {
        const res = await fetch(`/api/admin/results/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to load assessment report');
          return;
        }

        setDetail(data);
      } catch (err: any) {
        setError(err.message || 'Error loading report');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">Generating comprehensive assessment evaluation...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Result Not Found</h2>
        <p className="text-sm text-slate-600">{error || 'Unable to locate assessment record.'}</p>
        <Link
          href="/admin/results"
          className="inline-block px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Back to Results List
        </Link>
      </div>
    );
  }

  const { assessment, user, questions } = detail;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-10 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/admin/results"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-600 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to All Results</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Individual Candidate Assessment Review
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed question-by-question breakdown, candidate selections, and answer key evaluation
        </p>
      </div>

      {/* Candidate & Metrics Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-xl flex items-center justify-center">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{user.name}</h2>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Assessment ID: <span className="font-mono text-slate-600">{assessment.id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                Final Score
              </div>
              <div className="text-3xl font-black text-slate-900 mt-0.5">
                {assessment.score} <span className="text-sm font-semibold text-slate-400">/ {assessment.totalQuestions}</span>
              </div>
              <span
                className={`inline-block mt-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                  assessment.percentage >= 80
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : assessment.percentage >= 50
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {assessment.percentage.toFixed(1)}% Score
              </span>
            </div>

            <button
              onClick={() => setShowRetakeModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 shadow-sm transition-all"
              title="Allow this candidate to retake the examination"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Allow Retake</span>
            </button>
          </div>
        </div>

        {/* Detailed Metrics Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attempted</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              {assessment.attemptedQuestions} / {assessment.totalQuestions}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Correct</div>
            <div className="text-xl font-extrabold text-emerald-800 mt-1">
              {assessment.correctAnswers}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
            <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">Incorrect</div>
            <div className="text-xl font-extrabold text-rose-800 mt-1">
              {assessment.incorrectAnswers}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Unanswered</div>
            <div className="text-xl font-extrabold text-amber-800 mt-1">
              {assessment.unanswered}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>Started: {new Date(assessment.startedAt).toLocaleString()}</div>
          <div>
            Submitted:{' '}
            {assessment.submittedAt
              ? new Date(assessment.submittedAt).toLocaleString()
              : 'In Progress'}
          </div>
        </div>
      </div>

      {/* Question-by-Question Evaluation Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          Assessment Questions Review ({questions.length} Items)
        </h3>

        {questions.map((q) => (
          <div
            key={q.questionId}
            className={`p-6 rounded-3xl bg-white border transition-all ${
              q.status === 'CORRECT'
                ? 'border-emerald-200 shadow-sm'
                : q.status === 'INCORRECT'
                ? 'border-rose-200 shadow-sm'
                : 'border-slate-200'
            }`}
          >
            {/* Header: Question order and status badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                  Question {q.order}
                </span>
              </div>

              <div>
                {q.status === 'CORRECT' && (
                  <span className="inline-flex items-center text-xs font-bold text-emerald-700 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Correct
                  </span>
                )}
                {q.status === 'INCORRECT' && (
                  <span className="inline-flex items-center text-xs font-bold text-rose-700 px-3 py-1 rounded-full bg-rose-50 border border-rose-200">
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Incorrect
                  </span>
                )}
                {q.status === 'UNANSWERED' && (
                  <span className="inline-flex items-center text-xs font-bold text-amber-700 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
                    <HelpCircle className="w-3.5 h-3.5 mr-1" />
                    Unanswered
                  </span>
                )}
              </div>
            </div>

            {/* Question Text */}
            <h4 className="text-base font-bold text-slate-900 leading-snug mb-4">
              {q.questionText}
            </h4>

            {/* Choices list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-4">
              {q.options.map((opt) => {
                const isSelectedByUser = q.userAnswer?.key === opt.key;
                const isTheCorrectAnswer = q.correctAnswer.key === opt.key;

                let borderBg = 'border-slate-200 bg-slate-50/50 text-slate-700';
                if (isTheCorrectAnswer) {
                  borderBg = 'border-emerald-500 bg-emerald-50/80 font-bold text-emerald-950 ring-1 ring-emerald-500';
                } else if (isSelectedByUser && !isTheCorrectAnswer) {
                  borderBg = 'border-rose-400 bg-rose-50/80 font-medium text-rose-950';
                }

                return (
                  <div key={opt.key} className={`p-3 rounded-xl border flex items-start space-x-2 ${borderBg}`}>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 ${
                        isTheCorrectAnswer
                          ? 'bg-emerald-600 text-white'
                          : isSelectedByUser
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="flex-1 mt-0.5">{opt.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Answer Comparison Footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Candidate Choice:</span>
                <span
                  className={`font-bold ${
                    q.status === 'CORRECT'
                      ? 'text-emerald-700'
                      : q.status === 'INCORRECT'
                      ? 'text-rose-700'
                      : 'text-amber-700 italic'
                  }`}
                >
                  {q.userAnswer ? `${q.userAnswer.key}. ${q.userAnswer.text}` : 'Not answered'}
                </span>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Official Correct Answer:</span>
                <span className="font-bold text-emerald-700">
                  {q.correctAnswer.key}. {q.correctAnswer.text}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Retake Confirmation Modal */}
      {showRetakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Allow Exam Retake?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to allow <strong className="text-slate-800">{user.name}</strong> to re-attend the examination?
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">What happens next:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700">
                <li>This completed assessment and all submitted answers will be deleted.</li>
                <li>The candidate will be restored to <span className="font-semibold">NOT_STARTED</span> status.</li>
                <li>They can immediately log in and start a brand-new exam session with randomized questions and full duration.</li>
              </ul>
            </div>

            {retakeError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                {retakeError}
              </p>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  setShowRetakeModal(false);
                  setRetakeError('');
                }}
                disabled={isRetaking}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAllowRetake}
                disabled={isRetaking}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isRetaking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Yes, Allow Retake</span>
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
