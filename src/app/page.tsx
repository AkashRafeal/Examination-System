'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-100/70 text-blue-700 text-xs font-semibold mb-6 border border-blue-200 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>High-Security Enterprise Assessment Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Randomized Online Examination &amp; Assessment System
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Automated PDF/DOCX question ingestion with staged preview, 50-question server-side
            randomization, atomic evaluation, and complete privacy protection.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/25 transition-all text-base group"
            >
              <span>Access Examination Portal</span>
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
