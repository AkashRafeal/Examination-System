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
  User as UserIcon,
} from 'lucide-react';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Do not show full navbar in distraction-free exam mode
  const isExamMode = pathname.startsWith('/user/assessment/') && !pathname.endsWith('/submitted');

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    checkAuth();
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

  if (isExamMode) {
    return (
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg">ExamPortal</span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Live Examination
              </span>
            </div>
          </div>
          {user && (
            <div className="flex items-center space-x-3 text-sm text-slate-600">
              <span className="font-medium text-slate-800">{user.name}</span>
            </div>
          )}
        </div>
      </header>
    );
  }

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/questions', label: 'Question Bank', icon: HelpCircle },
    { href: '/admin/questions/import', label: 'Import', icon: Upload },
    { href: '/admin/results', label: 'Results', icon: FileCheck },
    { href: '/admin/users', label: 'Users', icon: Users },
  ];

  const userLinks = [
    { href: '/user/dashboard', label: 'Candidate Dashboard', icon: LayoutDashboard },
  ];

  const links = user?.role === 'ADMIN' ? adminLinks : userLinks;

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

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-8">
            <Link
              href={user?.role === 'ADMIN' ? '/admin/dashboard' : user ? '/user/dashboard' : '/'}
              className="flex items-center space-x-2.5 focus:outline-none"
            >
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

            {/* Desktop Navigation Links */}
            {user && (
              <div className="hidden md:flex items-center space-x-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = link.href === activeHref;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2 opacity-80" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right section: User profile & Auth controls */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 leading-tight">
                    {user.name}
                  </div>
                  <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {user.role}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 truncate max-w-[150px]">
                      {user.email}
                    </span>
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {user && (
            <div className="py-2 border-b border-slate-100 mb-2">
              <div className="text-sm font-semibold text-slate-900">{user.name}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {user.role}
              </span>
            </div>
          )}

          {user &&
            links.map((link) => {
              const Icon = link.icon;
              const isActive = link.href === activeHref;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-base font-medium ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3 opacity-80" />
                  {link.label}
                </Link>
              );
            })}

          {user ? (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center px-3 py-2 rounded-lg text-base font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          ) : null}
        </div>
      )}
    </nav>
  );
}
