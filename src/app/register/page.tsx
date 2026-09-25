'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, Lock, ArrowRight, ShieldAlert } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
            <Lock className="w-3.5 h-3.5" />
            <span>Admin-Exclusive Provisioning</span>
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight pt-2">
            Public Registration Closed
          </h1>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-sm leading-relaxed text-left space-y-2">
          <p>
            Candidate self-registration is permanently disabled. In accordance with platform security policies, examination candidate accounts are created and distributed exclusively by authorized administrators.
          </p>
          <p className="text-xs text-slate-500">
            If you are a student or examinee scheduled to take an assessment, your administrator will issue your unique username and temporary password.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all space-x-2 text-sm"
          >
            <span>Go to Candidate Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
