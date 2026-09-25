'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  GraduationCap,
  LayoutDashboard,
  HelpCircle,
  Upload,
  FileCheck,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  User as UserIcon,
  Tag,
} from 'lucide-react';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check if current view is live distraction-free exam
  const isExamMode = pathname.startsWith('/user/assessment/') && !pathname.endsWith('/submitted');

  useEffect(() => {
    // If we already have the authenticated user session in memory, don't re-fetch on every route change
    if (user) {
      setAuthLoading(false);
      return;
    }

    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.authenticated && data.user) {
              setUser(data.user);
            } else {
              setUser(null);
            }
          }
        } else {
          if (isMounted) setUser(null);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }
    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsLoggingOut(false);
      window.location.href = '/login';
    }
  };

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/questions', label: 'Question Bank', icon: HelpCircle },
    { href: '/admin/categories', label: 'Categories', icon: Tag },
    { href: '/admin/results', label: 'Assessment Results', icon: FileCheck },
    { href: '/admin/users', label: 'User Management', icon: Users },
  ];

  const userLinks = [
    { href: '/user/dashboard', label: 'Candidate Dashboard', icon: LayoutDashboard },
  ];

  const links = user?.role === 'ADMIN' ? adminLinks : userLinks;

  // Helper to ensure ONLY ONE tab is active at a time (exact match or most specific prefix match)
  const getActiveHref = (path: string, items: typeof links): string | null => {
    const exact = items.find((item) => path === item.href);
    if (exact) return exact.href;

    let bestMatch: string | null = null;
    let maxLen = 0;

    for (const item of items) {
      if (path.startsWith(item.href + '/')) {
        if (item.href.length > maxLen) {
          maxLen = item.href.length;
          bestMatch = item.href;
        }
      }
    }

    return bestMatch;
  };

  const activeHref = getActiveHref(pathname, links);

  // 1. Distraction-Free Live Examination Mode
  if (isExamMode) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-lg">ExamPortal</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Live Examination
                </span>
              </div>
            </div>
            {user && (
              <div className="flex items-center space-x-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{user.name}</span>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // 2. Loading state while checking authentication
  if (authLoading && (pathname.startsWith('/admin') || pathname.startsWith('/user'))) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 3. Unauthenticated Guests
  if (!user) {
    // If attempting to access protected admin or user area without authentication, redirect to login
    if (pathname.startsWith('/admin') || pathname.startsWith('/user')) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }

    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="w-full px-4 sm:px-8 lg:px-10 h-16 flex items-center justify-center">
            <Link href="/" className="flex items-center space-x-2.5 focus:outline-none">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-lg tracking-tight leading-none">
                  ExamPortal
                </span>
                <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase mt-0.5">
                  Assessment Platform
                </span>
              </div>
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // 3. Authenticated Candidates (Role: USER): TOP NAVBAR LAYOUT
  if (user.role === 'USER') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Left: Brand & Dashboard Navigation Link */}
            <div className="flex items-center space-x-6 sm:space-x-8">
              <Link href="/user/dashboard" className="flex items-center space-x-2.5 focus:outline-none group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 transition-transform group-hover:scale-105">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-none">
                    ExamPortal
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase mt-0.5">
                    Assessment Platform
                  </span>
                </div>
              </Link>

              <nav className="flex items-center space-x-1">
                <Link
                  href="/user/dashboard"
                  className={`inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                    pathname === '/user/dashboard'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  <span>Candidate Dashboard</span>
                </Link>
              </nav>
            </div>

            {/* Right: Candidate Profile Badge & Sign Out */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-xs shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono leading-tight">{user.email}</div>
                </div>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                  CANDIDATE
                </span>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all space-x-1.5"
                title="Sign out of ExamPortal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // 4. Authenticated Administrators (Role: ADMIN): LEFT SIDEBAR LAYOUT
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-40 px-4 h-16 flex items-center justify-between">
        <Link
          href={user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'}
          className="flex items-center space-x-2.5"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 text-base">ExamPortal</span>
        </Link>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col justify-between p-6 z-10 shadow-2xl">
            <div className="space-y-6">
              {/* Brand */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-base tracking-tight leading-none">
                      ExamPortal
                    </span>
                    <span className="text-[9px] font-bold text-blue-600 tracking-wider uppercase mt-0.5">
                      Assessment Platform
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                  Navigation
                </div>
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = link.href === activeHref;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={true}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100 font-bold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="flex-1">{link.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 text-blue-600" />}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Profile & Logout */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center space-x-3 px-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{user.name}</div>
                  <div className="text-xs text-slate-400 truncate">{user.email}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Left Sidebar (Fixed / Sticky on Left) */}
      <aside className="hidden md:flex md:w-64 lg:w-72 h-screen sticky top-0 shrink-0 bg-white border-r border-slate-200 flex-col justify-between p-6 z-30 shadow-sm">
        <div className="space-y-8">
          {/* Brand Logo & Title */}
          <Link
            href={user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'}
            className="flex items-center space-x-3 focus:outline-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 transition-transform group-hover:scale-105">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-none">
                ExamPortal
              </span>
              <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase mt-1">
                Assessment Platform
              </span>
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2.5">
              {user.role === 'ADMIN' ? 'Administration Menu' : 'Candidate Menu'}
            </div>

            {links.map((link) => {
              const Icon = link.icon;
              const isActive = link.href === activeHref;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={`flex items-center px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mr-3 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span className="flex-1">{link.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 text-blue-200" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Session Section */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          {/* User Profile Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-sm ${
                user.role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
              <span
                className={`inline-block mt-1 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>

          {/* Logout Action Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all space-x-2"
            title="Sign out of ExamPortal"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area (Right Side of Sidebar) */}
      <main className="flex-1 min-w-0 flex flex-col">{children}</main>
    </div>
  );
}
