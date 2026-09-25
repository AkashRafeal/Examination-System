'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  CheckCircle2,
  Users,
  PlayCircle,
  FileCheck2,
  TrendingUp,
  ArrowRight,
  Upload,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface DashboardStats {
  totalQuestions: number;
  activeQuestions: number;
  inactiveQuestions: number;
  totalUsers: number;
  assessmentsStarted: number;
  assessmentsCompleted: number;
  avgScore: string;
  avgPercentage: string;
  categories: { id: string; name: string; _count: { questions: number } }[];
  recentAssessments: {
    id: string;
    status: string;
    score: number;
    percentage: number;
    startedAt: string;
    submittedAt: string | null;
    user: { name: string; email: string };
  }[];
}

import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/dashboard-stats');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.error || !Array.isArray(data.recentAssessments)) {
          router.push('/login');
          return;
        }
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Loading administrative dashboard...</p>
      </div>
    );
  }

  if (!stats || !Array.isArray(stats.recentAssessments)) {
    return null;
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-10 py-8 space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            System overview, question bank metrics, and candidate assessment analytics
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/questions/import"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import Questions</span>
          </Link>
          <Link
            href="/admin/results"
            className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all space-x-2"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>View Results</span>
          </Link>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Questions</span>
            <HelpCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.totalQuestions}</div>
          <div className="text-[11px] text-slate-400 mt-1">In question bank</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Questions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{stats.activeQuestions}</div>
          <div className="text-[11px] text-slate-400 mt-1">Available for assessments</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-700">{stats.totalUsers}</div>
          <div className="text-[11px] text-slate-400 mt-1">Registered candidates</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Started</span>
            <PlayCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700">{stats.assessmentsStarted}</div>
          <div className="text-[11px] text-slate-400 mt-1">Total exam attempts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
            <FileCheck2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700">
            {stats.assessmentsCompleted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Evaluated server-side</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-700">
            {stats.avgScore} <span className="text-xs font-normal text-slate-400">/ 50</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{stats.avgPercentage}% overall</div>
        </div>
      </div>

      {/* Main Section: Recent Assessments */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Assessments</h2>
              <p className="text-xs text-slate-500">Latest candidate test activities and scores</p>
            </div>
            <Link
              href="/admin/results"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center"
            >
              <span>View All Results</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {(!stats.recentAssessments || stats.recentAssessments.length === 0) ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No assessments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="pb-3">Candidate</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Percentage</th>
                    <th className="pb-3">Submission Date</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(stats.recentAssessments || []).map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5">
                        <div className="font-semibold text-slate-900">{a.user.name}</div>
                        <div className="text-xs text-slate-400">{a.user.email}</div>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            a.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3.5 font-bold text-slate-900">
                        {a.status === 'COMPLETED' ? `${a.score}/50` : '-'}
                      </td>
                      <td className="py-3.5 font-semibold text-slate-700">
                        {a.status === 'COMPLETED' ? `${a.percentage.toFixed(1)}%` : '-'}
                      </td>
                      <td className="py-3.5 text-xs text-slate-500">
                        {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : 'In Progress'}
                      </td>
                      <td className="py-3.5 text-right">
                        {a.status === 'COMPLETED' ? (
                          <Link
                            href={`/admin/results/${a.id}`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Review &rarr;
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
