'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Shield,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileSpreadsheet,
  Download,
  Key,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  UserPlus,
  RotateCcw,
  CheckSquare,
  Layers,
  ShieldAlert,
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: string;
  batch?: {
    id: string;
    batchName: string;
  } | null;
  assessments: {
    id: string;
    status: string;
    score: number;
    percentage: number;
    submittedAt: string | null;
  }[];
}

interface GeneratedCredential {
  name: string;
  username: string;
  email: string;
  plainPassword: string;
  status: 'CREATED' | 'ALREADY_EXISTS' | 'ERROR';
  errorMessage?: string;
}

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setSelectedUserIds([]);
      setSelectAllAcrossPages(false);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    }
    fetchCurrentUser();
  }, []);

  // Import Modal States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [importResult, setImportResult] = useState<{
    totalProcessed: number;
    totalCreated: number;
    totalSkipped: number;
    credentials: GeneratedCredential[];
    csvContent: string;
  } | null>(null);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (search) params.set('search', search);
      if (selectedBatchId) params.set('batchId', selectedBatchId);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();

      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalUsers(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedBatchId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Bulk Candidate Selection States
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState('');
  const [bulkDeleteSuccess, setBulkDeleteSuccess] = useState('');

  const [availableBatches, setAvailableBatches] = useState<
    { id: string; batchName: string; totalCandidates: number; createdAt?: string }[]
  >([]);

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/batches');
      if (res.ok) {
        const data = await res.json();
        setAvailableBatches(data.batches || []);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const selectedBatchObj = availableBatches.find((b) => b.id === selectedBatchId);
  const batchScopeLabel = selectedBatchObj ? `"${selectedBatchObj.batchName}"` : 'All Batches';

  const selectableUsers = users.filter((u) => u.role !== 'ADMIN');
  const isAllCandidatesOnPageSelected =
    selectableUsers.length > 0 &&
    (selectAllAcrossPages || selectableUsers.every((u) => selectedUserIds.includes(u.id)));
  const isPartiallySelected =
    !selectAllAcrossPages &&
    selectableUsers.some((u) => selectedUserIds.includes(u.id)) &&
    !isAllCandidatesOnPageSelected;

  const toggleSelectAllCandidatesOnPage = () => {
    if (selectAllAcrossPages || isAllCandidatesOnPageSelected) {
      setSelectedUserIds([]);
      setSelectAllAcrossPages(false);
    } else {
      const candidateIds = selectableUsers.map((u) => u.id);
      setSelectedUserIds(candidateIds);
      setSelectAllAcrossPages(false);
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectAllAcrossPages(false);
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteUsers = async () => {
    if (!selectAllAcrossPages && selectedUserIds.length === 0) return;
    setIsBulkDeleting(true);
    setBulkDeleteError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          selectAllAcrossPages
            ? {
                all: true,
                batchId: selectedBatchId || undefined,
                search: search || undefined,
              }
            : { userIds: selectedUserIds }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete selected candidates');
      }

      setBulkDeleteSuccess(
        selectAllAcrossPages
          ? `Successfully deleted all ${data.count} candidate account(s) in ${batchScopeLabel}.`
          : `Successfully deleted ${selectedUserIds.length} candidate account(s).`
      );
      setTimeout(() => setBulkDeleteSuccess(''), 4000);
      setSelectedUserIds([]);
      setSelectAllAcrossPages(false);
      setShowBulkDeleteModal(false);
      setIsDeleteMode(false);
      fetchUsers();
      fetchBatches();
    } catch (err: any) {
      setBulkDeleteError(err.message || 'An error occurred while deleting candidate accounts');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (!selectAllAcrossPages) {
      setSelectedUserIds([]);
    }
    setPage(newPage);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (currentUser && (userToDelete.id === currentUser.id || userToDelete.email === currentUser.email)) {
      setDeleteError('You cannot delete your own logged-in administrator account.');
      return;
    }
    setIsDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }
      setSelectedUserIds((prev) => prev.filter((x) => x !== userToDelete.id));
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.message || 'An error occurred while deleting user');
    } finally {
      setIsDeleting(false);
    }
  };

  // Retake State & Handlers
  const [userToRetake, setUserToRetake] = useState<UserItem | null>(null);
  const [isRetaking, setIsRetaking] = useState(false);
  const [retakeError, setRetakeError] = useState('');
  const [retakeSuccess, setRetakeSuccess] = useState('');

  const [showBulkRetakeModal, setShowBulkRetakeModal] = useState(false);
  const [isBulkRetaking, setIsBulkRetaking] = useState(false);
  const [bulkRetakeError, setBulkRetakeError] = useState('');

  const handleAllowRetake = async () => {
    if (!userToRetake) return;
    setIsRetaking(true);
    setRetakeError('');
    try {
      const res = await fetch('/api/admin/assessments/retake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userToRetake.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to allow retake');
      }

      setRetakeSuccess(`Retake enabled for ${userToRetake.name}. The candidate can now start a fresh exam.`);
      setTimeout(() => setRetakeSuccess(''), 5000);
      setUserToRetake(null);
      fetchUsers();
    } catch (err: any) {
      setRetakeError(err.message || 'An error occurred while enabling retake');
    } finally {
      setIsRetaking(false);
    }
  };

  const handleBulkAllowRetake = async () => {
    if (selectedUserIds.length === 0) return;
    setIsBulkRetaking(true);
    setBulkRetakeError('');
    try {
      const res = await fetch('/api/admin/assessments/retake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to allow bulk retake');
      }

      setRetakeSuccess(`Successfully enabled retake for ${selectedUserIds.length} candidate(s).`);
      setTimeout(() => setRetakeSuccess(''), 5000);
      setSelectedUserIds([]);
      setShowBulkRetakeModal(false);
      fetchUsers();
    } catch (err: any) {
      setBulkRetakeError(err.message || 'An error occurred while enabling retake');
    } finally {
      setIsBulkRetaking(false);
    }
  };

  // Add Student Manually States
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentBatchId, setStudentBatchId] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState('');
  const [createdStudentResult, setCreatedStudentResult] = useState<{
    user: { id: string; name: string; email: string; batch?: { batchName: string } | null };
    plainPassword: string;
  } | null>(null);
  const [copiedStudentCreds, setCopiedStudentCreds] = useState(false);



  const resetAddStudentModal = () => {
    setStudentName('');
    setStudentEmail('');
    setStudentPassword('');
    setStudentBatchId('');
    setShowStudentPassword(false);
    setAddStudentError('');
    setCreatedStudentResult(null);
    setCopiedStudentCreds(false);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = studentName.trim();
    const trimmedEmail = studentEmail.trim();

    if (!trimmedName) {
      setAddStudentError('Please enter candidate name.');
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setAddStudentError('Please enter a valid candidate email address.');
      return;
    }
    if (studentPassword && studentPassword.trim().length < 6) {
      setAddStudentError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmittingStudent(true);
    setAddStudentError('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail.toLowerCase(),
          password: studentPassword.trim() || undefined,
          batchId: studentBatchId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create student.');
      }

      setCreatedStudentResult({
        user: data.user,
        plainPassword: data.plainPassword,
      });

      // Refresh candidate list and batch counters
      fetchUsers();
      fetchBatches();
    } catch (err: any) {
      setAddStudentError(err.message || 'Error creating student.');
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  const handleCopyStudentCredentials = () => {
    if (!createdStudentResult) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = `Candidate Login Credentials:
Name: ${createdStudentResult.user.name}
Email: ${createdStudentResult.user.email}
Password: ${createdStudentResult.plainPassword}
Portal URL: ${origin}/login`;

    navigator.clipboard.writeText(text);
    setCopiedStudentCreds(true);
    setTimeout(() => setCopiedStudentCreds(false), 2000);
  };

  const handleToggleStatus = async (id: string, currentRole: string) => {
    if (currentRole === 'ADMIN') {
      alert('Administrator accounts cannot be deactivated.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError('');
    }
  };

  const handleUploadRoster = async () => {
    if (!selectedFile) {
      setUploadError('Please choose an Excel (.xlsx, .xls) or CSV file first.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/admin/users/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setUploadError(data.error || 'Failed to process spreadsheet.');
        setIsUploading(false);
        return;
      }

      setImportResult(data.data);
      fetchUsers(); // Refresh background user list
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading candidate roster.');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadCredentialsCsv = (csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `candidate_login_credentials_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const resetModal = () => {
    setIsImportModalOpen(false);
    setSelectedFile(null);
    setUploadError('');
    setImportResult(null);
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-10 py-8 space-y-6">
      {/* Header with Title and Import Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <Users className="w-8 h-8 mr-3 text-blue-600" />
            User Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage candidate access permissions, review assessment statuses, and provision accounts ({totalUsers} total)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {!isDeleteMode ? (
            <button
              type="button"
              onClick={() => setIsDeleteMode(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold shadow-sm transition-all text-sm space-x-2"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Delete</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  if (selectedUserIds.length > 0 || selectAllAcrossPages) {
                    setBulkDeleteError('');
                    setShowBulkDeleteModal(true);
                  }
                }}
                disabled={selectedUserIds.length === 0 && !selectAllAcrossPages}
                className="inline-flex items-center px-4 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-600/20 transition-all text-sm space-x-2 animate-in fade-in"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {selectAllAcrossPages
                    ? `Delete All Candidates in ${batchScopeLabel}`
                    : selectedUserIds.length > 0
                    ? `Delete Selected (${selectedUserIds.length})`
                    : 'Delete Candidates'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDeleteMode(false);
                  setSelectedUserIds([]);
                  setSelectAllAcrossPages(false);
                }}
                className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 shadow-sm transition-all text-sm space-x-1.5"
              >
                <span>Cancel</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              resetAddStudentModal();
              setIsAddStudentOpen(true);
            }}
            className="inline-flex items-center px-4 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all text-sm space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => {
              resetModal();
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all text-sm space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import Candidates (Excel/CSV)</span>
          </button>
        </div>
      </div>

      {/* Success Notifications */}
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

      {/* Search & Batch Filters Toolbar */}
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
              setSelectedUserIds([]);
              setSelectAllAcrossPages(false);
              setPage(1);
            }}
            className="flex-1 sm:max-w-md px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
          >
            <option value="">— All Batches —</option>
            {availableBatches
              .filter((b) => b.totalCandidates > 0)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchName} ({b.totalCandidates} candidates{b.createdAt ? ` · ${new Date(b.createdAt).toLocaleDateString()}` : ''})
                </option>
              ))}
          </select>

          <div className="relative flex-1 sm:max-w-xs sm:ml-auto">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Batch & Candidate Summary Bar with Quick Select All */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-1.5">
            <span>
              Showing <strong className="text-slate-800">{totalUsers}</strong> user(s)
              {selectedBatchObj ? (
                <> in batch <strong className="text-blue-700">&ldquo;{selectedBatchObj.batchName}&rdquo;</strong></>
              ) : (
                <> across <strong className="text-slate-700">All Batches</strong></>
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
                    setSelectedUserIds(selectableUsers.map((u) => u.id));
                  }}
                  disabled={totalUsers === 0}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold transition-colors disabled:opacity-50 border border-blue-200/60"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>
                    {selectedBatchObj
                      ? `Select all in "${selectedBatchObj.batchName}"`
                      : `Select all candidates`}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectAllAcrossPages(false);
                    setSelectedUserIds([]);
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
                    Delete All Candidates in {batchScopeLabel}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading candidate accounts...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            {/* Select All Across Pages Banner */}
            {isDeleteMode && (isAllCandidatesOnPageSelected || selectAllAcrossPages) && totalUsers > selectableUsers.length && (
              <div className="bg-blue-50/90 border-b border-blue-200/70 px-6 py-2.5 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5">
                  <span>
                    {selectAllAcrossPages
                      ? `All candidates in ${batchScopeLabel} are selected across all pages.`
                      : `All ${selectableUsers.length} candidates on this page are selected.`}
                  </span>
                  {!selectAllAcrossPages ? (
                    <button
                      type="button"
                      onClick={() => setSelectAllAcrossPages(true)}
                      className="font-bold text-blue-700 hover:text-blue-950 underline ml-1 cursor-pointer"
                    >
                      Select all candidates in {batchScopeLabel}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectAllAcrossPages(false);
                        setSelectedUserIds([]);
                      }}
                      className="font-bold text-blue-700 hover:text-blue-950 underline ml-1 cursor-pointer"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
                {selectAllAcrossPages && (
                  <span className="font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px]">
                    All in {batchScopeLabel} Selected
                  </span>
                )}
              </div>
            )}

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  {isDeleteMode && (
                    <th className="py-3.5 pl-6 pr-2 w-12">
                      <input
                        type="checkbox"
                        checked={isAllCandidatesOnPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isPartiallySelected;
                        }}
                        onChange={toggleSelectAllCandidatesOnPage}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        title={
                          isAllCandidatesOnPageSelected
                            ? 'Deselect all candidates on page'
                            : 'Select all candidates on page'
                        }
                      />
                    </th>
                  )}
                  <th className={`py-3.5 ${!isDeleteMode ? 'pl-6 pr-4' : 'px-4'} whitespace-nowrap text-left`}>Candidate</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-left">Role</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-left">Account</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-left">Exam Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-left">Score</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-left">Registered</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center">Retake</th>
                  <th className="py-3.5 px-6 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const latestExam = u.assessments && u.assessments[0];
                  const isSelected = selectedUserIds.includes(u.id);
                  const isSelf = currentUser ? (u.id === currentUser.id || u.email === currentUser.email) : (u.role === 'ADMIN');
                  const isCandidate = u.role !== 'ADMIN';
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-blue-50/60 hover:bg-blue-50/90' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {isDeleteMode && (
                        <td className="py-4 pl-6 pr-2 w-12 whitespace-nowrap">
                          {isCandidate && !isSelf ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectUser(u.id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                              title="Select candidate"
                            />
                          ) : (
                            <span className="w-4 h-4 inline-block" />
                          )}
                        </td>
                      )}

                      <td className={`py-4 ${!isDeleteMode ? 'pl-6 pr-4' : 'px-4'} whitespace-nowrap`}>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{u.name}</span>
                          {isSelf && (
                            <span className="inline-flex items-center text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                        {u.batch && (
                          <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                            📋 {u.batch.batchName}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(u.id, u.role)}
                          disabled={u.role === 'ADMIN'}
                          className={`inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
                            u.role === 'ADMIN'
                              ? 'bg-emerald-50 text-emerald-700 cursor-default'
                              : u.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Deactivated</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {latestExam ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              latestExam.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {latestExam.status}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Not Started</span>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                        {latestExam && latestExam.status === 'COMPLETED' ? (
                          <span>
                            {latestExam.score}/50{' '}
                            <span className="text-xs font-normal text-slate-400">
                              ({latestExam.percentage.toFixed(0)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-slate-400 select-none">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {u.role !== 'ADMIN' && (
                          latestExam ? (
                            <button
                              onClick={() => {
                                setUserToRetake(u);
                                setRetakeError('');
                              }}
                              className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors border border-amber-200/70 shadow-sm"
                              title="Allow candidate to re-attend examination"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              <span>Allow Retake</span>
                            </button>
                          ) : (
                            <span className="text-sm font-bold text-slate-400 select-none">—</span>
                          )
                        )}
                      </td>

                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        {isSelf ? (
                          <div className="flex items-center justify-center">
                            <span
                              className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200/80 cursor-not-allowed select-none"
                              title="Administrator accounts cannot delete themselves"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-slate-400 mr-1" />
                              <span>Cannot delete self</span>
                            </span>
                          </div>
                        ) : u.role !== 'ADMIN' ? (
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleToggleStatus(u.id, u.role)}
                              className={`inline-flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors border shadow-sm ${
                                u.isActive
                                  ? 'text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border-slate-200'
                                  : 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                              }`}
                              title={u.isActive ? 'Deactivate candidate' : 'Activate candidate'}
                            >
                              {u.isActive ? (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Deactivate</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Activate</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                setUserToDelete(u);
                                setDeleteError('');
                              }}
                              className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-colors border border-rose-200 shadow-sm"
                              title="Delete candidate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Admin Account</span>
                        )}
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
            Page <span className="font-bold">{page}</span> of{' '}
            <span className="font-bold">{totalPages}</span>
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

      {/* Floating Bulk Action Bar for Users */}
      {isDeleteMode && (selectedUserIds.length > 0 || selectAllAcrossPages) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center space-x-2 text-sm font-semibold">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
              {selectAllAcrossPages ? totalUsers : selectedUserIds.length}
            </span>
            <span>
              {selectAllAcrossPages
                ? `all in ${batchScopeLabel} selected`
                : `candidate${selectedUserIds.length > 1 ? 's' : ''} selected`}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {totalUsers > selectableUsers.length && !selectAllAcrossPages && (
            <button
              onClick={() => setSelectAllAcrossPages(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              Select all in {batchScopeLabel}
            </button>
          )}

          {selectAllAcrossPages && (
            <button
              onClick={() => {
                setSelectAllAcrossPages(false);
                const candidateIds = selectableUsers.map((u) => u.id);
                setSelectedUserIds(candidateIds);
              }}
              className="text-xs text-slate-300 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
            >
              Select only current page ({selectableUsers.length})
            </button>
          )}

          <button
            onClick={() => {
              setSelectedUserIds([]);
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
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all ml-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {selectAllAcrossPages
                ? `Delete All in ${batchScopeLabel}`
                : `Delete Selected (${selectedUserIds.length})`}
            </span>
          </button>
        </div>
      )}

      {/* Bulk Delete Candidates Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectAllAcrossPages
                      ? `Delete All in ${batchScopeLabel}?`
                      : `Delete ${selectedUserIds.length} Candidates?`}
                  </h3>
                  <p className="text-xs text-slate-500">Permanent action</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isBulkDeleting}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {bulkDeleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkDeleteError}</span>
                </div>
              )}

              <p className="text-sm text-slate-600 leading-relaxed">
                {selectAllAcrossPages ? (
                  <>
                    Are you sure you want to permanently delete all candidates in{' '}
                    <strong className="text-rose-600 font-bold">{batchScopeLabel}</strong> across all pages?
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently delete these{' '}
                    <strong className="text-slate-900 font-bold">{selectedUserIds.length}</strong>{' '}
                    selected candidate accounts?
                  </>
                )}
              </p>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Warning: Cascade Deletion</span>
                </div>
                <p className="leading-normal">
                  This will permanently remove candidate accounts along with their associated examination sessions, questions, answers, and scores. Administrator accounts are protected and will never be deleted.
                </p>
              </div>
            </div>

            <div className="p-5 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteUsers}
                disabled={isBulkDeleting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      Deleting {selectAllAcrossPages ? `all in ${batchScopeLabel}` : selectedUserIds.length}...
                    </span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {selectAllAcrossPages
                        ? `Yes, Delete All in ${batchScopeLabel}`
                        : `Yes, Delete ${selectedUserIds.length} Candidates`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Excel/CSV Ingestion Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Import Candidates & Auto-Generate Credentials
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload an Excel (.xlsx) or CSV roster containing candidate names
                  </p>
                </div>
              </div>

              <button
                onClick={resetModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {!importResult ? (
                /* Step 1: File Selection */
                <div className="space-y-6">
                  {/* Explanatory guidelines banner */}
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed space-y-2">
                    <p className="font-semibold">How Candidate Ingestion Works:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>The platform extracts names from the <strong>Name</strong> or <strong>Candidate Name</strong> column.</li>
                      <li>For each candidate, a clean unique <strong>Username</strong> and secure random <strong>Password</strong> are automatically created.</li>
                      <li>Upon import, you will immediately receive a <strong>downloadable CSV file</strong> with all generated credentials to distribute to candidates.</li>
                    </ul>
                  </div>

                  {/* Upload Drop Zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                    />
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-800">
                      {selectedFile ? selectedFile.name : 'Click to select Excel (.xlsx, .xls) or CSV file'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                        : 'Supports Microsoft Excel (.xlsx, .xls) and CSV spreadsheets'}
                    </p>
                  </div>

                  {uploadError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start text-xs text-rose-700">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-rose-500 mt-0.5" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {/* Sample Template Link */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Need a starting format?</span>
                    <a
                      href="/api/admin/users/template"
                      download="candidate_roster_template.csv"
                      className="inline-flex items-center font-bold text-blue-600 hover:text-blue-700 underline space-x-1"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      <span>Download Sample Template (.CSV)</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* Step 2: Post-Import Results & Download */
                <div className="space-y-6">
                  {/* Success Summary Banner */}
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-sm mb-0.5">
                        Candidate Provisioning Complete!
                      </span>
                      <span>
                        Successfully created <strong>{importResult.totalCreated}</strong> new candidate accounts ({importResult.totalSkipped} skipped/duplicates).
                      </span>
                    </div>
                  </div>

                  {/* Prominent Download CSV Action Button */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 text-center space-y-3">
                    <h4 className="font-extrabold text-base">
                      Download Login Credentials File
                    </h4>
                    <p className="text-xs text-blue-100 max-w-md mx-auto">
                      Click below to save the official credentials CSV file containing candidate usernames, emails, and temporary passwords for distribution.
                    </p>
                    <button
                      onClick={() => downloadCredentialsCsv(importResult.csvContent)}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold bg-white text-blue-700 hover:bg-blue-50 shadow-md transition-all space-x-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Credentials (.CSV)</span>
                    </button>
                  </div>

                  {/* Credentials Preview Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Generated Credentials Preview ({importResult.credentials.length})</span>
                      <span className="text-[11px] text-slate-400 font-normal">Click password to copy</span>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Name</th>
                            <th className="py-2.5 px-3">Username / Login ID</th>
                            <th className="py-2.5 px-3">Password</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {importResult.credentials.map((cred, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                                {cred.name}
                              </td>
                              <td className="py-2.5 px-3 text-blue-600">
                                {cred.username}
                              </td>
                              <td className="py-2.5 px-3">
                                {cred.status === 'CREATED' ? (
                                  <button
                                    onClick={() => copyToClipboard(cred.plainPassword, idx)}
                                    className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                                    title="Click to copy password"
                                  >
                                    <Key className="w-3 h-3 text-slate-400" />
                                    <span>{cred.plainPassword}</span>
                                    {copiedIndex === idx ? (
                                      <Check className="w-3 h-3 text-emerald-600 ml-1" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-slate-400 ml-1 opacity-60" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-slate-400 font-sans italic">{cred.plainPassword}</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-sans">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    cred.status === 'CREATED'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {cred.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-3">
              {!importResult ? (
                <>
                  <button
                    onClick={resetModal}
                    disabled={isUploading}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadRoster}
                    disabled={isUploading || !selectedFile}
                    className="inline-flex items-center px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 space-x-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Accounts...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Process & Generate Credentials</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={resetModal}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 shadow-sm transition-all"
                >
                  Done & Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Candidate Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Candidate</h3>
                  <p className="text-xs text-slate-500">Permanent action</p>
                </div>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {deleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900 font-bold">{userToDelete.name}</strong> (
                <span className="font-mono text-xs text-slate-700">{userToDelete.email}</span>)?
              </p>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Warning: Cascade Deletion</span>
                </div>
                <p className="leading-normal">
                  This will permanently remove this candidate's account along with all their examination records, scores, and answer submissions.
                </p>
              </div>
            </div>

            <div className="p-5 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Candidate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Candidates Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectAllAcrossPages
                      ? `Delete All Candidates in ${batchScopeLabel}?`
                      : `Delete ${selectedUserIds.length} Candidate${selectedUserIds.length > 1 ? 's' : ''}?`}
                  </h3>
                  <p className="text-xs text-slate-500">Permanent cascade action</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isBulkDeleting}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {bulkDeleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkDeleteError}</span>
                </div>
              )}

              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900 font-bold">
                  {selectAllAcrossPages
                    ? `all candidates in ${batchScopeLabel}`
                    : `${selectedUserIds.length} selected candidate(s)`}
                </strong>? This will permanently remove their accounts and exam submissions.
              </p>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                  <span>Admin Accounts are Protected:</span>
                </div>
                <p className="leading-normal">
                  Administrator accounts (including your own account) are strictly protected and will never be deleted.
                </p>
              </div>
            </div>

            <div className="p-5 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteUsers}
                disabled={isBulkDeleting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting Candidates...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {selectAllAcrossPages
                        ? `Yes, Delete All Candidates`
                        : `Yes, Delete ${selectedUserIds.length} Candidate${selectedUserIds.length > 1 ? 's' : ''}`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Candidate Allow Retake Confirmation Modal */}
      {userToRetake && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-sm">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Allow Exam Retake</h3>
                  <p className="text-xs text-slate-500">Re-attend examination</p>
                </div>
              </div>
              <button
                onClick={() => setUserToRetake(null)}
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
                <strong className="text-slate-900 font-bold">{userToRetake.name}</strong> (
                <span className="font-mono text-xs text-slate-700">{userToRetake.email}</span>) to
                re-attend the examination?
              </p>

              {userToRetake.assessments && userToRetake.assessments[0] && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-1">
                  <div className="font-semibold text-slate-800">Current Session Details:</div>
                  <div>
                    Status: <span className="font-bold">{userToRetake.assessments[0].status}</span> •
                    Score:{' '}
                    <span className="font-bold">
                      {userToRetake.assessments[0].score}/50 (
                      {userToRetake.assessments[0].percentage?.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>What happens when you confirm:</span>
                </div>
                <p className="leading-normal">
                  Their previous attempt records and timer will be reset. The candidate can immediately log in and start a fresh examination with full duration and randomized questions.
                </p>
              </div>
            </div>

            <div className="p-5 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setUserToRetake(null)}
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
                    <span>Enabling Retake...</span>
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

      {/* Bulk Candidates Allow Retake Confirmation Modal */}
      {showBulkRetakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-sm">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Allow Retake for {selectedUserIds.length} Candidates?
                  </h3>
                  <p className="text-xs text-slate-500">Reset examination attempts</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkRetakeModal(false)}
                disabled={isBulkRetaking}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {bulkRetakeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkRetakeError}</span>
                </div>
              )}

              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to allow all{' '}
                <strong className="text-slate-900 font-bold">{selectedUserIds.length}</strong>{' '}
                selected candidates to re-attend the examination?
              </p>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>What happens when you confirm:</span>
                </div>
                <p className="leading-normal">
                  Any existing examination sessions for these candidates will be reset. All candidates will be able to log in and start a fresh assessment.
                </p>
              </div>
            </div>

            <div className="p-5 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowBulkRetakeModal(false)}
                disabled={isBulkRetaking}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAllowRetake}
                disabled={isBulkRetaking}
                className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {isBulkRetaking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enabling Retake...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Yes, Allow Retake ({selectedUserIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Manually Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {createdStudentResult ? 'Student Account Created' : 'Add New Candidate'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {createdStudentResult
                      ? 'Credentials generated and ready to share with candidate'
                      : 'Provision candidate account directly without an Excel roster'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  resetAddStudentModal();
                  setIsAddStudentOpen(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {createdStudentResult ? (
                /* Success View: Display Created Credentials */
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center space-x-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold">Candidate Added to Examination Portal</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        The candidate can now sign in using the credentials below and take their single allowed assessment attempt.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3.5">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate Name</span>
                      <span className="text-sm font-bold text-slate-900">{createdStudentResult.user.name}</span>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email (Login ID)</span>
                      <span className="text-sm font-mono font-bold text-slate-900">{createdStudentResult.user.email}</span>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</span>
                      <span className="text-sm font-mono font-bold bg-white px-3 py-1 rounded-lg border border-slate-200 text-emerald-700">
                        {createdStudentResult.plainPassword}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Batch</span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {createdStudentResult.user.batch?.batchName || 'Individual (No Batch)'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Portal URL</span>
                      <span className="text-xs font-mono text-blue-600">
                        {typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleCopyStudentCredentials}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
                    >
                      {copiedStudentCreds ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Credentials Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Credentials</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={resetAddStudentModal}
                      className="py-3 px-5 rounded-xl font-bold text-sm bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Another</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Form View: Input Student Details */
                <form onSubmit={handleCreateStudent} className="space-y-4">
                  {addStudentError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start space-x-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{addStudentError}</span>
                    </div>
                  )}

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Candidate Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Saanvi Bose"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address (Login Username) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. saanvi.bose@assessment.com"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Password (Optional)
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Default: {studentName.trim() ? `${studentName.trim().toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, '')}@123` : 'firstname@123'}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type={showStudentPassword ? 'text' : 'password'}
                        placeholder="Leave blank for auto-generated password"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                        tabIndex={-1}
                      >
                        {showStudentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      If left blank, system automatically assigns <strong>{studentName.trim() ? `${studentName.trim().toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, '')}@123` : '[firstname]@123'}</strong>.
                    </p>
                  </div>

                  {/* Batch Selection (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Assign to Batch (Optional)
                    </label>
                    <select
                      value={studentBatchId}
                      onChange={(e) => setStudentBatchId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">No Batch (Individual Candidate)</option>
                      {availableBatches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.batchName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        resetAddStudentModal();
                        setIsAddStudentOpen(false);
                      }}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingStudent}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isSubmittingStudent ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating Candidate...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Save & Create Candidate</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
