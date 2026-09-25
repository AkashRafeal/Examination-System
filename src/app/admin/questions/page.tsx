'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Search,
  Filter,
  Plus,
  Upload,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Tag,
  AlertTriangle,
  Loader2,
  CheckSquare,
} from 'lucide-react';

interface QuestionItem {
  id: string;
  questionText: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isActive: boolean;
  createdAt: string;
  options: { id: string; optionKey: string; optionText: string; isCorrect: boolean }[];
}

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setSelectedQuestionIds([]);
      setSelectAllAcrossPages(false);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeQuestionModal, setActiveQuestionModal] = useState<QuestionItem | null>(null);

  // Bulk Selection States
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState('');
  const [bulkDeleteSuccess, setBulkDeleteSuccess] = useState('');

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);
  const categoryScopeLabel = selectedCategoryObj ? `"${selectedCategoryObj.name}"` : 'Question Bank';

  // Clear selection when filters or page change
  const handlePageChange = (newPage: number) => {
    if (!selectAllAcrossPages) {
      setSelectedQuestionIds([]);
    }
    setPage(newPage);
  };

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    loadCategories();
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (search) params.set('search', search);
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (selectedStatus) params.set('isActive', selectedStatus);

      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      const data = await res.json();

      setQuestions(data.questions || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalQuestions(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, selectedStatus]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-status' }),
      });
      if (res.ok) {
        fetchQuestions();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const isAllOnPageSelected =
    questions.length > 0 &&
    (selectAllAcrossPages || questions.every((q) => selectedQuestionIds.includes(q.id)));
  const isPartiallySelected =
    !selectAllAcrossPages &&
    questions.some((q) => selectedQuestionIds.includes(q.id)) &&
    !isAllOnPageSelected;

  const toggleSelectAllOnPage = () => {
    if (selectAllAcrossPages || isAllOnPageSelected) {
      setSelectedQuestionIds([]);
      setSelectAllAcrossPages(false);
    } else {
      const pageIds = questions.map((q) => q.id);
      setSelectedQuestionIds(pageIds);
      setSelectAllAcrossPages(false);
    }
  };

  const toggleSelectQuestion = (id: string) => {
    setSelectAllAcrossPages(false);
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectAllAcrossPages && selectedQuestionIds.length === 0) return;
    setIsBulkDeleting(true);
    setBulkDeleteError('');
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          selectAllAcrossPages
            ? {
                all: true,
                categoryId: selectedCategory || undefined,
                isActive: selectedStatus ? selectedStatus === 'true' : undefined,
                search: search || undefined,
              }
            : { questionIds: selectedQuestionIds }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete selected questions');
      }

      setBulkDeleteSuccess(
        selectAllAcrossPages
          ? `Successfully deleted all ${data.count} question(s) in ${categoryScopeLabel}.`
          : `Successfully deleted ${selectedQuestionIds.length} question(s).`
      );
      setTimeout(() => setBulkDeleteSuccess(''), 4000);
      setSelectedQuestionIds([]);
      setSelectAllAcrossPages(false);
      setShowBulkDeleteModal(false);
      setIsDeleteMode(false);
      fetchQuestions();
    } catch (err: any) {
      setBulkDeleteError(err.message || 'An error occurred while deleting questions');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedQuestionIds((prev) => prev.filter((x) => x !== id));
        fetchQuestions();
      }
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-10 py-8 space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <HelpCircle className="w-8 h-8 mr-3 text-blue-600" />
            Question Bank
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage repository of multiple-choice examination questions ({totalQuestions} total)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {!isDeleteMode ? (
            <button
              type="button"
              onClick={() => setIsDeleteMode(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-sm font-semibold shadow-sm transition-all space-x-2"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Delete</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  if (selectedQuestionIds.length > 0 || selectAllAcrossPages) {
                    setBulkDeleteError('');
                    setShowBulkDeleteModal(true);
                  }
                }}
                disabled={selectedQuestionIds.length === 0 && !selectAllAcrossPages}
                className="inline-flex items-center px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all space-x-2 animate-in fade-in"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {selectAllAcrossPages
                    ? `Delete All ${totalQuestions} Questions`
                    : selectedQuestionIds.length > 0
                    ? `Delete Selected (${selectedQuestionIds.length})`
                    : 'Delete Questions'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteMode(false);
                  setSelectedQuestionIds([]);
                  setSelectAllAcrossPages(false);
                }}
                className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all space-x-1.5"
              >
                <span>Cancel</span>
              </button>
            </>
          )}

          <Link
            href="/admin/questions/import"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import Questions</span>
          </Link>
          <Link
            href="/admin/questions/new"
            className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {bulkDeleteSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{bulkDeleteSuccess}</span>
          </div>
          <button
            onClick={() => setBulkDeleteSuccess('')}
            className="text-emerald-600 hover:text-emerald-800 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search question text..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedQuestionIds([]);
              setSelectAllAcrossPages(false);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setSelectedQuestionIds([]);
              setSelectAllAcrossPages(false);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        {/* Category & Filter Count Bar with Quick Select All */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-1.5">
            <span>
              Showing <strong className="text-slate-800">{totalQuestions}</strong> question(s)
              {selectedCategoryObj ? (
                <> in category <strong className="text-blue-700">&ldquo;{selectedCategoryObj.name}&rdquo;</strong></>
              ) : (
                <> across <strong className="text-slate-700">All Categories</strong></>
              )}
            </span>
          </div>

          {isDeleteMode && (
            <div className="flex items-center space-x-2 animate-in fade-in">
              {!selectAllAcrossPages ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectAllAcrossPages(true);
                    setSelectedQuestionIds(questions.map((q) => q.id));
                  }}
                  disabled={totalQuestions === 0}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold transition-colors disabled:opacity-50 border border-blue-200/60"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>
                    {selectedCategoryObj
                      ? `Select all ${totalQuestions} in "${selectedCategoryObj.name}"`
                      : `Select all ${totalQuestions} questions`}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectAllAcrossPages(false);
                    setSelectedQuestionIds([]);
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold transition-colors"
                >
                  <span>Clear selection</span>
                </button>
              )}

              {selectAllAcrossPages && (
                <button
                  type="button"
                  onClick={() => {
                    setBulkDeleteError('');
                    setShowBulkDeleteModal(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 font-bold transition-colors shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    Delete All {totalQuestions} {selectedCategoryObj ? `in "${selectedCategoryObj.name}"` : 'Questions'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading question bank...</div>
        ) : questions.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            No questions found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Select All Across Pages Banner */}
            {isDeleteMode && (isAllOnPageSelected || selectAllAcrossPages) && totalQuestions > questions.length && (
              <div className="bg-blue-50/90 border-b border-blue-200/70 px-6 py-2.5 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5">
                  <span>
                    {selectAllAcrossPages
                      ? `All ${totalQuestions} questions in ${categoryScopeLabel} are selected across all pages.`
                      : `All ${questions.length} questions on this page are selected.`}
                  </span>
                  {!selectAllAcrossPages ? (
                    <button
                      type="button"
                      onClick={() => setSelectAllAcrossPages(true)}
                      className="font-bold text-blue-700 hover:text-blue-950 underline ml-1 cursor-pointer"
                    >
                      Select all {totalQuestions} questions in {categoryScopeLabel}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectAllAcrossPages(false);
                        setSelectedQuestionIds([]);
                      }}
                      className="font-bold text-blue-700 hover:text-blue-950 underline ml-1 cursor-pointer"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
                {selectAllAcrossPages && (
                  <span className="font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px]">
                    All {totalQuestions} Selected
                  </span>
                )}
              </div>
            )}

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  {isDeleteMode && (
                    <th className="py-3.5 pl-6 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={isAllOnPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isPartiallySelected;
                        }}
                        onChange={toggleSelectAllOnPage}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        title={isAllOnPageSelected ? 'Deselect all on this page' : 'Select all on this page'}
                      />
                    </th>
                  )}
                  <th className={`py-3.5 ${!isDeleteMode ? 'pl-6 pr-4' : 'px-4'} w-full`}>Question</th>
                  <th className="py-3.5 px-4 w-px whitespace-nowrap text-left">Category</th>
                  <th className="py-3.5 px-4 w-px whitespace-nowrap text-left">Status</th>
                  <th className="py-3.5 px-4 w-px whitespace-nowrap text-left">Created</th>
                  <th className="py-3.5 pl-3 pr-6 w-px whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q) => {
                  const isSelected = selectedQuestionIds.includes(q.id);
                  return (
                    <tr
                      key={q.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-blue-50/60 hover:bg-blue-50/90' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {isDeleteMode && (
                        <td className="py-4 pl-6 pr-2 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectQuestion(q.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                            title="Select question"
                          />
                        </td>
                      )}

                      <td className={`py-4 ${!isDeleteMode ? 'pl-6 pr-4' : 'px-4'} w-full`}>
                        <div className="font-semibold text-slate-900 line-clamp-2">
                          {q.questionText}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 font-mono">
                          {q.options.length} options • Answer:{' '}
                          <span className="font-bold text-blue-600">
                            {q.options.find((o) => o.isCorrect)?.optionKey || 'N/A'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 w-px whitespace-nowrap">
                        {q.category ? (
                          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
                            <Tag className="w-3 h-3 mr-1 text-blue-500" />
                            {q.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Uncategorized
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 w-px whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(q.id)}
                          className={`inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
                            q.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                          title="Click to toggle status"
                        >
                          {q.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-4 w-px text-xs text-slate-500 whitespace-nowrap">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 pl-3 pr-6 w-px text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => setActiveQuestionModal(q)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          title="View Full Question"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/admin/questions/${q.id}/edit`}
                          className="inline-block p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Edit Question"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing Page <span className="font-bold">{page}</span> of{' '}
            <span className="font-bold">{totalPages}</span> ({totalQuestions} total questions)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(Math.max(page - 1, 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(Math.min(page + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {isDeleteMode && (selectedQuestionIds.length > 0 || selectAllAcrossPages) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center space-x-2 text-sm font-semibold">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
              {selectAllAcrossPages ? totalQuestions : selectedQuestionIds.length}
            </span>
            <span>
              {selectAllAcrossPages
                ? `all in ${categoryScopeLabel} selected`
                : 'selected'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {totalQuestions > questions.length && !selectAllAcrossPages && (
            <button
              onClick={() => setSelectAllAcrossPages(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              Select all {totalQuestions} in {categoryScopeLabel}
            </button>
          )}

          {selectAllAcrossPages && (
            <button
              onClick={() => {
                setSelectAllAcrossPages(false);
                const pageIds = questions.map((q) => q.id);
                setSelectedQuestionIds(pageIds);
              }}
              className="text-xs text-slate-300 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
            >
              Select only current page ({questions.length})
            </button>
          )}

          <button
            onClick={() => {
              setSelectedQuestionIds([]);
              setSelectAllAcrossPages(false);
            }}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Clear selection
          </button>

          <button
            onClick={() => {
              setBulkDeleteError('');
              setShowBulkDeleteModal(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all ml-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {selectAllAcrossPages
                ? `Delete All ${totalQuestions} Questions`
                : `Delete Selected (${selectedQuestionIds.length})`}
            </span>
          </button>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {selectAllAcrossPages
                    ? `Delete All ${totalQuestions} Questions?`
                    : `Delete ${selectedQuestionIds.length} Questions?`}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {selectAllAcrossPages ? (
                    <>
                      Are you sure you want to permanently delete all{' '}
                      <strong className="text-slate-800">{totalQuestions}</strong> questions in{' '}
                      <strong className="text-rose-600">{categoryScopeLabel}</strong> across all
                      pages? This action cannot be undone and will permanently remove all associated options and test answers.
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete these{' '}
                      <strong className="text-slate-800">{selectedQuestionIds.length}</strong>{' '}
                      selected questions? This action cannot be undone and will remove their options and assessment links.
                    </>
                  )}
                </p>
              </div>
            </div>

            {bulkDeleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{bulkDeleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDelete}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      Deleting {selectAllAcrossPages ? totalQuestions : selectedQuestionIds.length}...
                    </span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {selectAllAcrossPages
                        ? `Yes, Delete All ${totalQuestions} Questions`
                        : `Yes, Delete ${selectedQuestionIds.length} Questions`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      {activeQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                  Question Details
                </span>
                {activeQuestionModal.category && (
                  <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    <Tag className="w-3 h-3 mr-1 text-slate-500" />
                    {activeQuestionModal.category.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveQuestionModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 leading-relaxed">
                {activeQuestionModal.questionText}
              </h3>
            </div>

            <div className="space-y-2 pt-2">
              {activeQuestionModal.options.map((opt) => (
                <div
                  key={opt.id}
                  className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start space-x-3 ${
                    opt.isCorrect
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold'
                      : 'border-slate-200 text-slate-700 bg-slate-50/50'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {opt.optionKey}
                  </span>
                  <div className="flex-1 mt-0.5">{opt.optionText}</div>
                  {opt.isCorrect && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 self-center">
                      Correct Answer
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveQuestionModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
