'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  HelpCircle,
  AlertTriangle,
  Save,
  Sliders,
  ExternalLink,
  BookOpen,
  Search,
  X,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  questionQuantity: number;
  _count: { questions: number };
  activeQuestionsCount: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryQuantity, setNewCategoryQuantity] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'IN_EXAM' | 'SHORTAGE'>('ALL');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      const list: Category[] = data.categories || [];
      setCategories(list);

      // Initialize quantities map
      const qMap: Record<string, number> = {};
      list.forEach((c) => {
        qMap[c.id] = c.questionQuantity || 0;
      });
      setQuantities(qMap);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleQuantityChange = (id: string, value: number) => {
    const val = Math.max(0, isNaN(value) ? 0 : value);
    setQuantities((prev) => ({
      ...prev,
      [id]: val,
    }));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setSubmitting(true);
    setMessage('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          questionQuantity: Number(newCategoryQuantity) || 0,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setNewCategoryName('');
        setNewCategoryQuantity(0);
        setMessage(`Category "${data.category.name}" created successfully!`);
        await loadCategories();
      } else {
        setErrorMessage(data.error || 'Failed to create category');
      }
    } catch {
      setErrorMessage('An error occurred while creating category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSingleQuantity = async (id: string) => {
    setSavingId(id);
    setMessage('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          questionQuantity: quantities[id] || 0,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('Category question quantity updated!');
        await loadCategories();
      } else {
        setErrorMessage(data.error || 'Failed to update quantity');
      }
    } catch {
      setErrorMessage('An error occurred while saving quantity');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAllQuantities = async () => {
    setSavingAll(true);
    setMessage('');
    setErrorMessage('');

    const payload = categories.map((c) => ({
      id: c.id,
      questionQuantity: quantities[c.id] || 0,
    }));

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantities: payload }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('All category question quantities updated successfully!');
        await loadCategories();
      } else {
        setErrorMessage(data.error || 'Failed to update quantities');
      }
    } catch {
      setErrorMessage('An error occurred while saving quantities');
    } finally {
      setSavingAll(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string, count: number) => {
    const confirmMsg =
      count > 0
        ? `Are you sure you want to delete "${name}"? ${count} questions in this category will become Uncategorized.`
        : `Are you sure you want to delete "${name}"?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`Category "${name}" deleted.`);
        await loadCategories();
      } else {
        setErrorMessage(data.error || 'Failed to delete category');
      }
    } catch {
      setErrorMessage('An error occurred while deleting category');
    }
  };

  // Calculations for summary banner
  const totalExamQuestions = Object.values(quantities).reduce((acc, q) => acc + (q || 0), 0);
  const activeCategoriesCount = Object.values(quantities).filter((q) => (q || 0) > 0).length;
  const shortages = categories.filter((c) => (quantities[c.id] || 0) > (c.activeQuestionsCount || 0));

  // Filtered categories based on search query and status filter
  const filteredCategories = categories.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    if (!matchesSearch) return false;
    const targetQty = quantities[c.id] ?? c.questionQuantity ?? 0;
    const activeCount = c.activeQuestionsCount || 0;
    if (filterStatus === 'IN_EXAM') return targetQty > 0;
    if (filterStatus === 'SHORTAGE') return targetQty > activeCount;
    return true;
  });

  return (
    <div className="w-full px-4 sm:px-8 lg:px-10 py-8 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/questions"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Question Bank</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
          <Tag className="w-7 h-7 sm:w-8 sm:h-8 mr-3 text-blue-600 flex-shrink-0" />
          Question Categories & Exam Distribution
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Organize questions by subject and configure the exact quantity of questions to pull from each
          category when a candidate takes an assessment.
        </p>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center shadow-sm">
          <CheckCircle2 className="w-4 h-4 mr-2.5 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center shadow-sm">
          <AlertTriangle className="w-4 h-4 mr-2.5 text-rose-600 flex-shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Exam Distribution Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Exam Questions
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{totalExamQuestions}</div>
            <div className="text-[10px] sm:text-[11px] text-blue-600 font-semibold">
              {totalExamQuestions} mins ({totalExamQuestions > 0 ? '1 min/question' : '0 mins'})
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Categories in Exam
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-600">
              {activeCategoriesCount} / {categories.length}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500">Quota &gt; 0 configured</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active in Bank
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              {categories.reduce((acc, c) => acc + (c.activeQuestionsCount || 0), 0)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500">Ready across categories</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              shortages.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
            }`}
          >
            {shortages.length > 0 ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Exam Status
            </div>
            <div
              className={`text-xs sm:text-sm font-extrabold truncate max-w-[130px] sm:max-w-none ${
                shortages.length > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {shortages.length > 0
                ? `${shortages.length} Shortage Alert`
                : totalExamQuestions > 0
                ? 'Ready for Candidates'
                : 'No Quota Configured'}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500">
              {totalExamQuestions > 0 ? `${totalExamQuestions} questions assigned` : 'Default active pool'}
            </div>
          </div>
        </div>
      </div>

      {/* Reduced-Size Compact Add New Category Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Add New Category
          </h2>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            • Create category topic and optional exam quota
          </span>
        </div>

        <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
          <div className="sm:col-span-8">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Category Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Python, General Knowledge, Aptitude, Cloud..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full px-3 py-1.5 h-9 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Questions in Exam
            </label>
            <input
              type="number"
              min="0"
              value={newCategoryQuantity}
              onChange={(e) => setNewCategoryQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="0"
              className="w-full px-3 py-1.5 h-9 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{submitting ? 'Adding...' : 'Add Category'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Category Questions Configuration Table with Integrated Search & Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {/* Table Toolbar Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center">
              <Sliders className="w-5 h-5 mr-2 text-blue-600" />
              Category Question Quantities
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify how many questions from each category should be randomly assigned to each candidate.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Filter Input */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 h-9 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Status Tabs */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  filterStatus === 'ALL'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({categories.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('IN_EXAM')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  filterStatus === 'IN_EXAM'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                In Exam ({activeCategoriesCount})
              </button>
              {shortages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterStatus('SHORTAGE')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    filterStatus === 'SHORTAGE'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-amber-700 hover:text-amber-900'
                  }`}
                >
                  Shortage ({shortages.length})
                </button>
              )}
            </div>

            {/* Bulk Save Button */}
            <button
              onClick={handleSaveAllQuantities}
              disabled={savingAll || loading}
              className="px-4 py-2 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center space-x-1.5 whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingAll ? 'Saving All...' : 'Save All Quantities'}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            No categories created yet. Add your first category using the form above!
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm space-y-2">
            <div>No categories found matching &quot;{searchQuery}&quot;</div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('ALL');
              }}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Category Name</th>
                  <th className="py-3 px-4 text-center">Questions in Bank</th>
                  <th className="py-3 px-6 text-center">Questions to Ask Candidate</th>
                  <th className="py-3 px-4 text-center">Share of Exam</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((c) => {
                  const targetQty = quantities[c.id] ?? c.questionQuantity ?? 0;
                  const activeCount = c.activeQuestionsCount || 0;
                  const isShortage = targetQty > activeCount;
                  const isDirty = targetQty !== c.questionQuantity;
                  const sharePercent =
                    totalExamQuestions > 0 ? Math.round((targetQty / totalExamQuestions) * 100) : 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                            <Tag className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{c.name}</span>
                            <span className="text-[11px] text-slate-400">
                              {c._count.questions} total questions linked
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            activeCount > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {activeCount} active
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-center whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(c.id, targetQty - 1)}
                            disabled={targetQty <= 0}
                            className="w-7 h-7 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-slate-700 text-xs flex items-center justify-center transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={targetQty}
                            onChange={(e) => handleQuantityChange(c.id, parseInt(e.target.value, 10))}
                            className={`w-16 text-center py-1 px-1.5 rounded-md border font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                              isShortage
                                ? 'border-rose-400 bg-rose-50 text-rose-900'
                                : targetQty > 0
                                ? 'border-blue-300 bg-blue-50/50 text-blue-900'
                                : 'border-slate-300 bg-white text-slate-700'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(c.id, targetQty + 1)}
                            className="w-7 h-7 rounded-md border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700 text-xs flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {targetQty > 0 ? (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            {sharePercent}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">0%</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isShortage ? (
                          <div className="flex items-center text-xs font-semibold text-rose-600">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                            <span>Shortage ({activeCount} in bank)</span>
                          </div>
                        ) : targetQty > 0 ? (
                          <div className="flex items-center text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                            <span>Ready ({activeCount} avail)</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not in exam</span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-right space-x-2 whitespace-nowrap">
                        {isDirty && (
                          <button
                            onClick={() => handleSaveSingleQuantity(c.id)}
                            disabled={savingId === c.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all inline-flex items-center space-x-1"
                            title="Save this quantity"
                          >
                            <Save className="w-3 h-3" />
                            <span>{savingId === c.id ? 'Saving...' : 'Save'}</span>
                          </button>
                        )}
                        <Link
                          href={`/admin/questions?categoryId=${c.id}`}
                          className="inline-block p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Questions in Question Bank"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteCategory(c.id, c.name, c._count.questions)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
