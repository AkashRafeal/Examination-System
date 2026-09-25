'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
  Layers,
  FileSpreadsheet,
  Users,
  Trophy,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

interface ResultItem {
  id: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  score: number;
  percentage: number;
  startedAt: string;
  submittedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface BatchItem {
  id: string;
  fileName: string;
  batchName: string;
  totalCandidates: number;
  testsStarted: number;
  testsCompleted: number;
  avgScore: string | null;
  avgPercentage: string | null;
  createdAt: string;
}

export default function AdminResultsPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const [sortBy, setSortBy] = useState<'score' | 'submittedAt' | 'percentage'>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Retake States
  const [resultToRetake, setResultToRetake] = useState<ResultItem | null>(null);
  const [isRetaking, setIsRetaking] = useState(false);
  const [retakeError, setRetakeError] = useState('');
  const [retakeSuccess, setRetakeSuccess] = useState('');

  // Load batches on mount
  useEffect(() => {
    fetch('/api/admin/batches')
      .then((r) => r.json())
      .then((data) => {
        const list = (data.batches || []).filter((b: BatchItem) => b.totalCandidates > 0);
        setBatches(list);
      })
      .catch(console.error);
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (search) params.set('search', search);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      if (selectedBatchId) params.set('batchId', selectedBatchId);

      const res = await fetch(`/api/admin/results?${params.toString()}`);
      const data = await res.json();

      setResults(data.assessments || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalResults(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder, selectedBatchId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleExportExcel = async () => {
    if (!selectedBatchId) return;
    setExporting(true);
    try {
      const url = `/api/admin/results/export-excel?batchId=${selectedBatchId}`;
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.json();
        alert(err.error || 'Export failed.');
        return;
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const selectedBatch = batches.find((b) => b.id === selectedBatchId);
      a.href = objectUrl;
      a.download = `Exam_Results_${selectedBatch?.batchName ?? 'batch'}.xlsx`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } finally {
      setExporting(false);
    }
  };

  const handleAllowRetake = async () => {
    if (!resultToRetake) return;
    setIsRetaking(true);
    setRetakeError('');
    try {
      const res = await fetch('/api/admin/assessments/retake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: resultToRetake.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to allow retake');
      }

      setRetakeSuccess(`Retake granted for ${resultToRetake.user.name}. The previous assessment has been reset.`);
      setTimeout(() => setRetakeSuccess(''), 5000);
      setResultToRetake(null);
      fetchResults();
    } catch (err: any) {
      setRetakeError(err.message || 'An error occurred while enabling retake');
    } finally {
      setIsRetaking(false);
    }
  };

  const toggleSort = (field: 'score' | 'submittedAt' | 'percentage') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) ?? null;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-10 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <FileCheck2 className="w-8 h-8 mr-3 text-blue-600" />
            Assessment Results
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review completed assessments, filter by batch, and export Excel reports
          </p>
        </div>

        {selectedBatchId && (
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all space-x-2 disabled:opacity-60 disabled:cursor-wait"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exporting ? 'Generating...' : 'Download Excel Report (.xlsx)'}</span>
          </button>
        )}
      </div>

      {/* Retake Success Notification */}
      {retakeSuccess && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>{retakeSuccess}</span>
          </div>
          <button
            onClick={() => setRetakeSuccess('')}
            className="text-amber-600 hover:text-amber-800 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Batch Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-sm font-bold text-slate-700 shrink-0">Filter by Batch:</span>
          </div>
          <select
            value={selectedBatchId}
            onChange={(e) => {
              setSelectedBatchId(e.target.value);
              setPage(1);
            }}
            className="flex-1 sm:max-w-md px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">— All Batches —</option>
            {batches
              .filter((b) => b.totalCandidates > 0)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchName} ({b.totalCandidates} candidates · {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''})
                </option>
              ))}
          </select>
        </div>

        {/* Batch Stats Cards */}
        {selectedBatch && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <div className="text-xl font-extrabold text-blue-700">{selectedBatch.totalCandidates}</div>
              <div className="text-xs text-blue-500 font-medium">Total Candidates</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
              <FileCheck2 className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <div className="text-xl font-extrabold text-purple-700">{selectedBatch.testsStarted}</div>
              <div className="text-xs text-purple-500 font-medium">Tests Started</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <div className="text-xl font-extrabold text-emerald-700">{selectedBatch.testsCompleted}</div>
              <div className="text-xs text-emerald-500 font-medium">Completed</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
              <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <div className="text-xl font-extrabold text-amber-700">
                {selectedBatch.avgScore ?? '—'}
              </div>
              <div className="text-xs text-amber-500 font-medium">Avg Score (/50)</div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Sort Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 sm:max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-500">Sort by:</span>
          <button
            onClick={() => toggleSort('submittedAt')}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1 ${
              sortBy === 'submittedAt'
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Date</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => toggleSort('score')}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1 ${
              sortBy === 'score'
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Score</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => toggleSort('percentage')}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1 ${
              sortBy === 'percentage'
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Percentage</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading candidate results...</div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No completed assessment results found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Candidate</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Percentage</th>
                  <th className="py-3.5 px-4">Breakdown</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{r.user.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{r.user.email}</div>
                    </td>

                    <td className="py-4 px-4 font-extrabold text-slate-900 text-base">
                      {r.score}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        / {r.totalQuestions}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          r.percentage >= 80
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.percentage >= 50
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {r.percentage.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs space-x-2 text-slate-600">
                      <span className="text-emerald-700 font-bold">{r.correctAnswers} Correct</span>
                      <span>•</span>
                      <span className="text-rose-700 font-bold">{r.incorrectAnswers} Incorrect</span>
                      <span>•</span>
                      <span className="text-slate-400">{r.unanswered} Blank</span>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'}
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => {
                          setResultToRetake(r);
                          setRetakeError('');
                        }}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors space-x-1 border border-amber-200/60"
                        title="Allow student to re-attend examination"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Allow Retake</span>
                      </button>

                      <Link
                        href={`/admin/results/${r.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Page <span className="font-bold">{page}</span> of{' '}
            <span className="font-bold">{totalPages}</span> ({totalResults} total)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Retake Confirmation Modal */}
      {resultToRetake && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-sm">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Allow Exam Retake</h3>
                  <p className="text-xs text-slate-500">Reset result & grant fresh attempt</p>
                </div>
              </div>
              <button
                onClick={() => setResultToRetake(null)}
                disabled={isRetaking}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {retakeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{retakeError}</span>
                </div>
              )}

              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to allow{' '}
                <strong className="text-slate-900 font-bold">{resultToRetake.user.name}</strong> (
                <span className="font-mono text-xs text-slate-700">{resultToRetake.user.email}</span>) to
                re-attend the examination?
              </p>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-1">
                <div className="font-semibold text-slate-800">Completed Exam Score:</div>
                <div>
                  Score: <span className="font-bold">{resultToRetake.score}/{resultToRetake.totalQuestions}</span> (
                  <span className="font-bold">{resultToRetake.percentage.toFixed(1)}%</span>) •
                  Submitted: {resultToRetake.submittedAt ? new Date(resultToRetake.submittedAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Impact of Retake:</span>
                </div>
                <p className="leading-normal">
                  The candidate's previous score ({resultToRetake.score}/{resultToRetake.totalQuestions}) and answer records will be cleared. The candidate can immediately log in and take the exam again from their dashboard.
                </p>
              </div>
            </div>

            <div className="p-5 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setResultToRetake(null)}
                disabled={isRetaking}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAllowRetake}
                disabled={isRetaking}
                className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {isRetaking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resetting Exam...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
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
