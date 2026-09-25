'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, Loader2 } from 'lucide-react';

export default function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [questionText, setQuestionText] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [options, setOptions] = useState([
    { key: 'A', text: '', isCorrect: false },
    { key: 'B', text: '', isCorrect: false },
    { key: 'C', text: '', isCorrect: false },
    { key: 'D', text: '', isCorrect: false },
  ]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [qRes, catRes] = await Promise.all([
          fetch(`/api/admin/questions/${id}`),
          fetch('/api/admin/categories'),
        ]);

        const [qData, catData] = await Promise.all([qRes.json(), catRes.json()]);
        setCategories(catData.categories || []);

        if (qData.question) {
          const q = qData.question;
          setQuestionText(q.questionText);
          setCategoryId(q.categoryId || '');
          setIsActive(q.isActive);

          if (q.options && q.options.length > 0) {
            setOptions(
              q.options.map((opt: any) => ({
                key: opt.optionKey,
                text: opt.optionText,
                isCorrect: opt.isCorrect,
              }))
            );
          }
        }
      } catch (err: any) {
        setError(err.message || 'Error loading question details');
      } finally {
        setInitialLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleOptionTextChange = (idx: number, text: string) => {
    const updated = [...options];
    updated[idx].text = text;
    setOptions(updated);
  };

  const handleCorrectAnswerChange = (key: string) => {
    const updated = options.map((opt) => ({
      ...opt,
      isCorrect: opt.key === key,
    }));
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!questionText.trim()) {
      setError('Question text is required.');
      return;
    }

    for (const opt of options) {
      if (!opt.text.trim()) {
        setError(`Option ${opt.key} text is required.`);
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: questionText.trim(),
          categoryId: categoryId || null,
          isActive,
          options,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to update question.');
        setSaving(false);
        return;
      }

      router.push('/admin/questions');
    } catch {
      setError('An error occurred while updating question.');
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">Loading question details...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-10 py-8 space-y-6">
      <div>
        <Link
          href="/admin/questions"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Question Bank</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Edit Question
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Update question statement, category, difficulty, choices, and answer key
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start text-sm">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Question Text
          </label>
          <textarea
            rows={4}
            required
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full p-4 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Uncategorized / General</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Status
            </label>
            <div className="flex items-center h-10 space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                Active in question bank
              </label>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Options & Correct Answer
          </label>
          <div className="space-y-3">
            {options.map((opt, idx) => (
              <div
                key={opt.key}
                className={`p-3 rounded-2xl border flex items-center space-x-3 transition-colors ${
                  opt.isCorrect
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="correctOption"
                  checked={opt.isCorrect}
                  onChange={() => handleCorrectAnswerChange(opt.key)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  title="Mark as correct answer"
                />
                <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 font-extrabold text-xs flex items-center justify-center text-slate-700 shadow-sm">
                  {opt.key}
                </span>
                <input
                  type="text"
                  required
                  placeholder={`Option ${opt.key} text...`}
                  value={opt.text}
                  onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {opt.isCorrect && (
                  <span className="text-[11px] font-bold text-emerald-700 px-2 py-0.5 rounded bg-emerald-100 uppercase tracking-wider">
                    Correct
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
          <Link
            href="/admin/questions"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating...' : 'Update Question'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
