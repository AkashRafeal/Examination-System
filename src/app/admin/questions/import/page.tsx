'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit2,
  Trash2,
  ArrowRight,
  Loader2,
  Copy,
  Info,
  Layers,
} from 'lucide-react';

interface ParsedOption {
  key: string;
  text: string;
}

interface StagedQuestion {
  questionNumber?: number;
  questionText: string;
  options: ParsedOption[];
  correctAnswer: string;
  isValid: boolean;
  validationErrors?: string[];
  isDuplicate?: boolean;
  duplicateOf?: string;
}

interface StagedResult {
  fileName: string;
  fileType: string;
  totalQuestions: number;
  validQuestions: number;
  invalidQuestions: number;
  questions: StagedQuestion[];
}

export default function ImportQuestionsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);

  // Multi-step progress states
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');

  // Staged Preview data
  const [stagedData, setStagedData] = useState<StagedResult | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<StagedQuestion | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const lower = selected.name.toLowerCase();
      if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
        setError('Only .pdf and .docx files are supported.');
        setFile(null);
        return;
      }
      setError('');
      setFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      const lower = dropped.name.toLowerCase();
      if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
        setError('Only .pdf and .docx files are supported.');
        return;
      }
      setError('');
      setFile(dropped);
    }
  };

  const handleProcessDocument = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setCurrentStep(1);

    // Multi-step animated feedback simulation while server extracts & parses
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 450);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/questions/upload-preview', {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepTimer);
      setCurrentStep(5);

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to process document');
        setUploading(false);
        return;
      }

      setStagedData(data.data);
    } catch {
      clearInterval(stepTimer);
      setError('An unexpected error occurred during document extraction.');
    } finally {
      setUploading(false);
    }
  };

  // Open editor for a staged question
  const openEditor = (idx: number) => {
    if (!stagedData) return;
    setEditingQuestionIndex(idx);
    setEditFormData(JSON.parse(JSON.stringify(stagedData.questions[idx])));
  };

  // Save edits back to staged questions
  const saveEditor = () => {
    if (!stagedData || editingQuestionIndex === null || !editFormData) return;

    // Validate edited question
    const errors: string[] = [];
    if (!editFormData.questionText.trim()) errors.push('Question text is required.');
    for (const opt of editFormData.options) {
      if (!opt.text.trim()) errors.push(`Option ${opt.key} is missing text.`);
    }
    if (!['A', 'B', 'C', 'D'].includes(editFormData.correctAnswer.toUpperCase())) {
      errors.push('Correct answer must be A, B, C, or D.');
    }

    const updatedQ: StagedQuestion = {
      ...editFormData,
      correctAnswer: editFormData.correctAnswer.toUpperCase(),
      isValid: errors.length === 0,
      validationErrors: errors,
    };

    const newQuestions = [...stagedData.questions];
    newQuestions[editingQuestionIndex] = updatedQ;

    const validCount = newQuestions.filter((q) => q.isValid).length;

    setStagedData({
      ...stagedData,
      validQuestions: validCount,
      invalidQuestions: newQuestions.length - validCount,
      questions: newQuestions,
    });

    setEditingQuestionIndex(null);
    setEditFormData(null);
  };

  // Delete a staged question
  const deleteStagedQuestion = (idx: number) => {
    if (!stagedData) return;
    const newQuestions = stagedData.questions.filter((_, i) => i !== idx);
    const validCount = newQuestions.filter((q) => q.isValid).length;

    setStagedData({
      ...stagedData,
      totalQuestions: newQuestions.length,
      validQuestions: validCount,
      invalidQuestions: newQuestions.length - validCount,
      questions: newQuestions,
    });
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    if (!stagedData) return;

    const validQuestions = stagedData.questions.filter((q) => q.isValid);
    if (validQuestions.length === 0) {
      alert('There are no valid questions to import. Please resolve invalid questions first.');
      return;
    }

    setConfirming(true);

    try {
      const res = await fetch('/api/admin/questions/import-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: stagedData.fileName,
          fileType: stagedData.fileType,
          categoryId: selectedCategoryId || undefined,
          questions: validQuestions,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/admin/questions');
      } else {
        alert(data.error || 'Failed to confirm import.');
        setConfirming(false);
      }
    } catch {
      alert('An error occurred while saving imported questions.');
      setConfirming(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-10 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Import Questions
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload PDF or Microsoft Word (.docx) files. Review, edit, and confirm extracted questions
          before saving to the database.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start text-sm">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box (Only shown if preview is not yet generated) */}
      {!stagedData && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-2xl p-10 text-center cursor-pointer transition-all space-y-4"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx"
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">
                {file ? file.name : 'Drag & Drop PDF or Word document here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supported formats: PDF, DOCX (Max size: 20MB)
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Choose File
            </button>
          </div>

          {/* Upload & Process Button */}
          <div className="pt-2">
            <button
              onClick={handleProcessDocument}
              disabled={!file || uploading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all space-x-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Document...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Upload & Process</span>
                </>
              )}
            </button>
          </div>

          {/* Multi-step loading stepper */}
          {uploading && (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Extraction Pipeline
              </h4>
              <div className="space-y-2 text-xs">
                <div
                  className={`flex items-center space-x-2 ${
                    currentStep >= 1 ? 'text-blue-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Uploading document to secure processing engine</span>
                </div>
                <div
                  className={`flex items-center space-x-2 ${
                    currentStep >= 2 ? 'text-blue-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Extracting document text stream (PDF / DOCX)</span>
                </div>
                <div
                  className={`flex items-center space-x-2 ${
                    currentStep >= 3 ? 'text-blue-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Detecting question headers, options, and answer keys</span>
                </div>
                <div
                  className={`flex items-center space-x-2 ${
                    currentStep >= 4 ? 'text-blue-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">
                    4
                  </span>
                  <span>Validating choice integrity and duplicate checks</span>
                </div>
                <div
                  className={`flex items-center space-x-2 ${
                    currentStep >= 5 ? 'text-blue-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">
                    5
                  </span>
                  <span>Preparing staged administrative preview</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGED PREVIEW SECTION */}
      {stagedData && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>File: {stagedData.fileName}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Import Preview & Verification
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Review questions below. Fix invalid entries or discard unwanted questions before
                confirming import.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-slate-100 text-center">
                <div className="text-xs text-slate-500 font-semibold">Total Detected</div>
                <div className="text-lg font-bold text-slate-900">{stagedData.totalQuestions}</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-xs text-emerald-700 font-semibold">Valid</div>
                <div className="text-lg font-bold text-emerald-700">{stagedData.validQuestions}</div>
              </div>
              {stagedData.invalidQuestions > 0 && (
                <div className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <div className="text-xs text-rose-700 font-semibold">Invalid</div>
                  <div className="text-lg font-bold text-rose-700">
                    {stagedData.invalidQuestions}
                  </div>
                </div>
              )}
              <button
                onClick={() => setStagedData(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Upload Different File
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={confirming || stagedData.validQuestions === 0}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center space-x-2"
              >
                {confirming ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Import ({stagedData.validQuestions} Questions)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Category Assignment Card */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-950">Assign Questions to Category</h4>
                <p className="text-xs text-blue-800/80">
                  Select a category for the {stagedData.validQuestions} valid questions being imported.
                </p>
              </div>
            </div>
            <div className="w-full sm:w-64">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-blue-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="">Uncategorized / General</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Questions Preview Cards */}
          <div className="space-y-4">
            {stagedData.questions.map((q, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl bg-white border transition-all ${
                  !q.isValid
                    ? 'border-rose-300 bg-rose-50/20'
                    : q.isDuplicate
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                      Question {idx + 1}
                    </span>
                    {q.isValid ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Valid
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center">
                        <XCircle className="w-3 h-3 mr-1" />
                        Invalid
                      </span>
                    )}
                    {q.isDuplicate && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center">
                        <Copy className="w-3 h-3 mr-1" />
                        Possible Duplicate
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditor(idx)}
                      className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteStagedQuestion(idx)}
                      className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Discard
                    </button>
                  </div>
                </div>

                {/* Validation error alerts */}
                {q.validationErrors && q.validationErrors.length > 0 && (
                  <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                    <div className="font-bold flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                      Formatting Issues Detected:
                    </div>
                    {q.validationErrors.map((err, i) => (
                      <div key={i} className="pl-4">
                        • {err}
                      </div>
                    ))}
                  </div>
                )}

                {/* Question Text */}
                <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug mb-3">
                  {q.questionText || <span className="text-rose-500 italic">Missing question text</span>}
                </h4>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt) => {
                    const isCorrect = q.correctAnswer.toUpperCase() === opt.key.toUpperCase();
                    return (
                      <div
                        key={opt.key}
                        className={`p-2.5 rounded-xl border flex items-start space-x-2 ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50/80 font-bold text-emerald-950'
                            : 'border-slate-200 bg-slate-50/60 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="flex-1 mt-0.5">
                          {opt.text || <span className="text-rose-500 italic">[Empty Option]</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Detected Answer:{' '}
                    <strong className="text-slate-900 font-bold">
                      {q.correctAnswer || 'None'}
                    </strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INLINE EDIT QUESTION MODAL */}
      {editingQuestionIndex !== null && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit Staged Question {editingQuestionIndex + 1}
              </h3>
              <button
                onClick={() => {
                  setEditingQuestionIndex(null);
                  setEditFormData(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Question Text
                </label>
                <textarea
                  rows={3}
                  value={editFormData.questionText}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, questionText: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Options (A, B, C, D)
                </label>
                {editFormData.options.map((opt, optIdx) => (
                  <div key={opt.key} className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 font-bold text-xs flex items-center justify-center text-slate-700">
                      {opt.key}
                    </span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...editFormData.options];
                        newOpts[optIdx].text = e.target.value;
                        setEditFormData({ ...editFormData, options: newOpts });
                      }}
                      className="flex-1 p-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Correct Answer Key (A, B, C, or D)
                </label>
                <select
                  value={editFormData.correctAnswer}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, correctAnswer: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Correct Option</option>
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingQuestionIndex(null);
                  setEditFormData(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEditor}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
