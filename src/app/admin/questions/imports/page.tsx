'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, FileText, ArrowLeft, Upload, CheckCircle2 } from 'lucide-react';

interface Batch {
  id: string;
  fileName: string;
  fileType: string;
  totalQuestions: number;
  validQuestions: number;
  invalidQuestions: number;
  importedQuestions: number;
  uploadedBy: string;
  createdAt: string;
}

export default function ImportHistoryPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/imports')
      .then((res) => res.json())
      .then((data) => setBatches(data.batches || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full px-4 sm:px-8 lg:px-10 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
            <Link
              href="/admin/questions"
              className="hover:text-blue-600 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Question Bank</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <History className="w-7 h-7 mr-3 text-blue-600" />
            Import History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit logs of all batch question imports from PDF and Word documents
          </p>
        </div>

        <Link
          href="/admin/questions/import"
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>New Import</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading import history...</div>
        ) : batches.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No import batches recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">File Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Detected</th>
                  <th className="py-3.5 px-4">Imported</th>
                  <th className="py-3.5 px-4">Uploaded By</th>
                  <th className="py-3.5 px-6 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span>{b.fileName}</span>
                    </td>
                    <td className="py-4 px-4 uppercase text-xs font-bold text-slate-600">
                      {b.fileType}
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-700">
                      {b.totalQuestions} ({b.validQuestions} valid)
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center text-xs font-bold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {b.importedQuestions} saved
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600">{b.uploadedBy}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 text-right">
                      {new Date(b.createdAt).toLocaleString()}
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
