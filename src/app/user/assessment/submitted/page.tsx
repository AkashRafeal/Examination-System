'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck, Lock, LayoutDashboard, ShieldAlert, Clock } from 'lucide-react';

function SubmittedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const isTabSwitch = reason === 'tab_switch' || reason === 'window_blur';
  const isTimeExpired = reason === 'time_expired';

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-inner ${
            isTimeExpired
              ? 'bg-blue-100 text-blue-600'
              : isTabSwitch
              ? 'bg-amber-100 text-amber-600'
              : 'bg-emerald-100 text-emerald-600'
          }`}
        >
          {isTimeExpired ? (
            <Clock className="w-9 h-9" />
          ) : isTabSwitch ? (
            <ShieldAlert className="w-9 h-9" />
          ) : (
            <CheckCircle2 className="w-9 h-9" />
          )}
        </div>

        <div className="space-y-2">
          <span
            className={`inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
              isTimeExpired
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : isTabSwitch
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {isTimeExpired ? (
              <>
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Auto-Submitted: 1-Hour Time Limit Expired</span>
              </>
            ) : isTabSwitch ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Auto-Submitted: Tab Switch Detected</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Submission Confirmed</span>
              </>
            )}
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight pt-2">
            {isTimeExpired
              ? 'Exam Time Expired — Auto-Submitted'
              : isTabSwitch
              ? 'Assessment Auto-Submitted'
              : 'Assessment Submitted'}
          </h1>
        </div>

        {/* Time expired notification banner */}
        {isTimeExpired && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs leading-relaxed text-left flex items-start space-x-3 shadow-sm">
            <Clock className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
            <div>
              <span className="font-extrabold uppercase tracking-wider block mb-0.5 text-blue-900">
                Examination Time Limit Reached
              </span>
              <span>
                Your allotted examination time has concluded. Your assessment has been
                safely and automatically submitted with all answers you completed up to the deadline.
              </span>
            </div>
          </div>
        )}

        {/* Tab switch anti-cheat violation alert banner */}
        {isTabSwitch && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs leading-relaxed text-left flex items-start space-x-3 shadow-sm">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-extrabold uppercase tracking-wider block mb-0.5 text-amber-900">
                Security Regulation Enforced
              </span>
              <span>
                A tab switch or window focus departure was detected during your active examination
                session. In accordance with examination proctoring regulations, your test was
                immediately finalized.
              </span>
            </div>
          </div>
        )}

        {/* Required Submission Privacy Message */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-base leading-relaxed font-medium">
          &ldquo;Your assessment has been submitted successfully. Your result will be available to
          the administrator.&rdquo;
        </div>

        {/* Single Attempt Permanent Lock Notice */}
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed text-left flex items-start space-x-3">
          <Lock className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div>
            <span className="font-extrabold uppercase tracking-wider block mb-0.5">
              Attempt 1/1 Completed (Locked)
            </span>
            <span>
              Per strict platform examination regulations, only one attempt is permitted per
              candidate. Any further attempts to start, retake, or modify this examination are
              permanently disabled and blocked by the server.
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          All responses have been recorded and evaluated server-side. Detailed scores and answer
          keys are accessible exclusively to authorized evaluation administrators.
        </p>

        <div className="pt-4">
          <Link
            href="/user/dashboard"
            className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all space-x-2 w-full sm:w-auto text-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to Candidate Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentSubmittedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SubmittedContent />
    </Suspense>
  );
}
