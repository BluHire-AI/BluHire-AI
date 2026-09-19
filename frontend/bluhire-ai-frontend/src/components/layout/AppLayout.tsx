'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, UserCircle, LogOut, Building, Briefcase, 
  Network, Contact, Sun, Moon, ChevronDown, ChevronRight,
  Compass, Award, BarChart3, Bot, BookOpen, Calendar, ShieldAlert,
  Menu, X
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/lib/store/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FloatingCopilot } from '@/components/copilot/FloatingCopilot';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import StarField from '@/components/StarField';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles?: string[];
}

interface NavSection {
  title: string;
  groupKey: string;
  items: NavItem[];
}

const isRouteActive = (itemHref: string, currentPathname: string, searchParamsStr: string = ''): boolean => {
  if (!currentPathname) return false;

  // Query tab links (e.g. candidate tabs /dashboard?tab=active)
  if (itemHref.includes('?tab=')) {
    const tabParam = itemHref.substring(itemHref.indexOf('?') + 1);
    return currentPathname === '/dashboard' && searchParamsStr.includes(tabParam);
  }

  // Exact match for top-level dashboard
  if (itemHref === '/dashboard' || itemHref === '/employee/dashboard') {
    return currentPathname === itemHref && (!searchParamsStr || !searchParamsStr.includes('tab='));
  }

  // AI Interviews vs Recruitment specific priority
  if (itemHref === '/dashboard/recruitment') {
    return (
      (currentPathname === '/dashboard/recruitment' || currentPathname.startsWith('/dashboard/recruitment/')) &&
      !currentPathname.startsWith('/dashboard/recruitment/ai-interviews')
    );
  }

  if (itemHref === '/dashboard/recruitment/ai-interviews') {
    return (
      currentPathname === '/dashboard/recruitment/ai-interviews' ||
      currentPathname.startsWith('/dashboard/recruitment/ai-interviews/')
    );
  }

  // Standard nested routes matching
  return currentPathname === itemHref || currentPathname.startsWith(`${itemHref}/`);
};

const getHeaderTitle = (pathname: string): string => {
  if (pathname === '/dashboard') return 'Overview';
  if (pathname === '/employee/dashboard') return 'Employee Dashboard';
  if (pathname.startsWith('/dashboard/employees')) return 'Employees';
  if (pathname.startsWith('/dashboard/directory')) return 'Employee Directory';
  if (pathname.startsWith('/dashboard/org-chart')) return 'Organization Chart';
  if (pathname.startsWith('/dashboard/attendance')) return 'Attendance & Leaves';
  if (pathname.startsWith('/dashboard/recruitment/ai-interviews')) return 'AI Interviews';
  if (pathname.startsWith('/dashboard/recruitment')) return 'Recruitment';
  if (pathname.startsWith('/dashboard/performance')) return 'Performance & Coaching';
  if (pathname.startsWith('/dashboard/payroll')) return 'Payroll Management';
  if (pathname.startsWith('/dashboard/copilot')) return 'AI Copilot';
  if (pathname.startsWith('/dashboard/knowledge')) return 'Knowledge Base';
  if (pathname.startsWith('/dashboard/departments')) return 'Departments';
  if (pathname.startsWith('/dashboard/designations')) return 'Designations';
  if (pathname.startsWith('/dashboard/analytics')) return 'Executive Analytics';
  if (pathname.startsWith('/dashboard/profile')) return 'Profile Settings';
  return 'BluHire AI';
};

const getNavigation = (role?: string): NavSection[] => {
  if (role === 'CANDIDATE') {
    return [
      {
        title: 'My Interviews',
        groupKey: 'interviews',
        items: [
          { name: 'Active Interview', href: '/dashboard?tab=active', icon: Compass },
          { name: 'Interview History', href: '/dashboard?tab=history', icon: Award }
        ]
      }
    ];
  }

  if (role === 'EMPLOYEE') {
    return [
      {
        title: 'Workforce',
        groupKey: 'workforce',
        items: [
          { name: 'Employee Directory', href: '/dashboard/directory', icon: Contact },
          { name: 'Organization Chart', href: '/dashboard/org-chart', icon: Network },
          { name: 'Attendance & Leaves', href: '/dashboard/attendance', icon: Calendar },
          { name: 'Performance & Coaching', href: '/dashboard/performance', icon: Award },
          { name: 'My Payroll', href: '/dashboard/payroll', icon: BarChart3 }
        ]
      },
      {
        title: 'AI Features',
        groupKey: 'aiFeatures',
        items: [
          { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: BookOpen }
        ]
      }
    ];
  }

  // Management / Recruiter / Manager Menu
  return [
    {
      title: 'Workforce Management',
      groupKey: 'workforce',
      items: [
        { name: 'Employees', href: '/dashboard/employees', icon: Users, roles: ['MANAGEMENT_ADMIN', 'HR_RECRUITER', 'SENIOR_MANAGER'] },
        { name: 'Employee Directory', href: '/dashboard/directory', icon: Contact },
        { name: 'Organization Chart', href: '/dashboard/org-chart', icon: Network },
        { name: 'Attendance & Leaves', href: '/dashboard/attendance', icon: Calendar },
        { name: 'Recruitment', href: '/dashboard/recruitment', icon: Compass, roles: ['MANAGEMENT_ADMIN', 'HR_RECRUITER'] },
        { name: 'AI Interviews', href: '/dashboard/recruitment/ai-interviews', icon: Award, roles: ['MANAGEMENT_ADMIN', 'HR_RECRUITER'] },
        { name: 'Performance & Coaching', href: '/dashboard/performance', icon: Award },
        { name: 'Payroll Management', href: '/dashboard/payroll', icon: BarChart3, roles: ['MANAGEMENT_ADMIN', 'HR_RECRUITER'] }
      ]
    },
    {
      title: 'AI Features',
      groupKey: 'aiFeatures',
      items: [
        { name: 'AI Copilot', href: '/dashboard/copilot', icon: Bot, roles: ['MANAGEMENT_ADMIN', 'HR_RECRUITER', 'SENIOR_MANAGER'] },
        { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: BookOpen }
      ]
    },
    {
      title: 'Organization Setup',
      groupKey: 'orgSetup',
      items: [
        { name: 'Departments', href: '/dashboard/departments', icon: Building, roles: ['MANAGEMENT_ADMIN', 'HR_RECRUITER', 'SENIOR_MANAGER'] },
        { name: 'Designations', href: '/dashboard/designations', icon: Briefcase, roles: ['MANAGEMENT_ADMIN', 'HR_RECRUITER', 'SENIOR_MANAGER'] }
      ]
    }
  ];
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, setUser, setTokens, refreshToken: storeRefreshToken } = useAuthStore();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [apiOffline, setApiOffline] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDark = (resolvedTheme || theme) === 'dark';

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.get('/health');
        if (res.data?.status === 'ok' && res.data?.database === 'connected') {
          setApiOffline(false);
        } else {
          setApiOffline(true);
        }
      } catch {
        setApiOffline(true);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 12000);
    return () => clearInterval(interval);
  }, []);

  // Group accordion states
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    workforce: true,
    aiFeatures: true,
    orgSetup: true,
    account: true,
    interviews: true,
  });

  // Sync profile & handle token refresh if role upgraded
  useEffect(() => {
    if (!user) return;
    
    api.get('/users/me')
      .then(res => {
        const latestUser = res.data.data;
        if (latestUser && latestUser.role !== user.role) {
          if (storeRefreshToken) {
            api.post('/auth/refresh', { refreshToken: storeRefreshToken })
              .then(refreshRes => {
                const { accessToken, refreshToken: newRefreshToken } = refreshRes.data.data;
                setTokens(accessToken, newRefreshToken || storeRefreshToken);
                setUser(latestUser);
                toast.success(`Account upgraded to ${latestUser.role.replace('_', ' ')}.`);
                router.refresh();
              })
              .catch(err => {
                console.error("Token refresh failed during role update", err);
              });
          } else {
            setUser(latestUser);
          }
        } else if (latestUser) {
          if (
            latestUser.role !== user.role ||
            latestUser.email !== user.email ||
            latestUser.firstName !== user.firstName ||
            latestUser.lastName !== user.lastName ||
            latestUser.profileImage !== user.profileImage ||
            latestUser.isActive !== user.isActive ||
            latestUser.mustChangePassword !== user.mustChangePassword
          ) {
            setUser(latestUser);
          }
        }
      })
      .catch(err => {
        console.error("Profile sync failed", err);
      });
  }, [user, storeRefreshToken, router, setTokens, setUser]);

  // Frontend URL Guards - strictly block access to unauthorized sections
  useEffect(() => {
    if (!user) return;

    const role = user.role;
    
    if (role === 'CANDIDATE') {
      const allowedPaths = ['/dashboard', '/dashboard/profile'];
      const isAllowed = allowedPaths.includes(pathname) || pathname.startsWith('/dashboard/interview/');
      if (!isAllowed) {
        router.push('/dashboard');
      }
    } else if (role === 'EMPLOYEE') {
      const forbiddenPrefixes = [
        '/dashboard/employees',
        '/dashboard/recruitment',
        '/dashboard/copilot',
        '/dashboard/departments',
        '/dashboard/designations',
        '/dashboard/analytics',
      ];
      const isForbidden = forbiddenPrefixes.some(pref => pathname.startsWith(pref));
      if (isForbidden) {
        router.push('/employee/dashboard');
      }
    }
  }, [user, pathname, router]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bluhire_sidebar_groups');
      if (saved) {
        try {
          setOpenGroups(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('bluhire_sidebar_groups', JSON.stringify(updated));
      return updated;
    });
  };

  const handleLogout = () => {
    logout();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return 'U';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Determine top-level Dashboard link destination by role
  const dashboardHref = user?.role === 'EMPLOYEE' ? '/employee/dashboard' : '/dashboard';

  const renderGroupHeader = (title: string, groupKey: string) => {
    const isOpen = openGroups[groupKey];
    return (
      <button
        type="button"
        onClick={() => toggleGroup(groupKey)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] uppercase text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white transition-colors mt-4 first:mt-0 cursor-pointer rounded-lg group select-none"
      >
        <span className="flex-1 min-w-0 text-left truncate pr-2 font-bold tracking-[0.12em] uppercase">
          {title}
        </span>
        <div className="shrink-0 flex items-center justify-center w-4 h-4">
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors" />
          )}
        </div>
      </button>
    );
  };

  const navSections = mounted ? getNavigation(user?.role) : [];
  const searchStr = typeof window !== 'undefined' ? window.location.search : '';

  // Sidebar content (shared between desktop floating panel and mobile drawer)
  const sidebarNavigation = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border dark:border-white/10 justify-between bg-muted/20 dark:bg-white/[0.02]">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mr-2.5 shadow-xs dark:shadow-[0_0_12px_rgba(139,92,246,0.15)]">
            <Building className="w-4.5 h-4.5" />
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-violet-400 dark:via-indigo-400 dark:to-[#8B5CF6] bg-clip-text text-transparent">
            BluHire-AI
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          {/* Close button for mobile drawer */}
          <button 
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        <div className="space-y-4">
          {/* Dashboard Link (Single Top-level) */}
          <div>
            <Link
              href={dashboardHref}
              className={`relative flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all group duration-200 ${
                isRouteActive(dashboardHref, pathname, searchStr)
                  ? 'text-indigo-600 dark:text-white bg-indigo-50/90 dark:bg-[#8B5CF6]/15 border border-indigo-200/80 dark:border-[#8B5CF6]/30 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50/50 dark:hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {isRouteActive(dashboardHref, pathname, searchStr) && (
                <div className="absolute left-0 w-1 h-5 rounded-r bg-indigo-600 dark:bg-[#8B5CF6] shadow-xs dark:shadow-[0_0_8px_rgba(139,92,246,0.5)] transition-all duration-200" />
              )}
              <LayoutDashboard className={`w-4.5 h-4.5 mr-3 transition-transform duration-200 group-hover:scale-105 ${
                isRouteActive(dashboardHref, pathname, searchStr) ? 'text-indigo-600 dark:text-[#8B5CF6]' : 'text-slate-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-white'
              }`} />
              Dashboard
            </Link>
          </div>

          {/* Dynamic Nav Sections */}
          {navSections.map((section) => (
            <div key={section.groupKey}>
              {renderGroupHeader(section.title, section.groupKey)}
              <AnimatePresence initial={false}>
                {openGroups[section.groupKey] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden space-y-1 mt-1 pl-1"
                  >
                    {section.items.map((item) => {
                      if (item.roles && user && !item.roles.includes(user.role)) {
                        return null;
                      }
                      const isTabActive = isRouteActive(item.href, pathname, searchStr);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`relative flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all group duration-200 ${
                            isTabActive
                              ? 'text-indigo-600 dark:text-white bg-indigo-50/90 dark:bg-[#8B5CF6]/15 border border-indigo-200/80 dark:border-[#8B5CF6]/30 font-semibold shadow-xs'
                              : 'text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50/50 dark:hover:bg-white/[0.04] border border-transparent'
                          }`}
                        >
                          {isTabActive && (
                            <div className="absolute left-0 w-1 h-5 rounded-r bg-indigo-600 dark:bg-[#8B5CF6] shadow-xs dark:shadow-[0_0_8px_rgba(139,92,246,0.5)] transition-all duration-200" />
                          )}
                          <Icon className={`w-4 h-4 mr-3 ${isTabActive ? 'text-indigo-600 dark:text-[#8B5CF6]' : 'text-slate-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-white'}`} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Analytics Link (Standalone Top-level for Admins) */}
          {mounted && user && ['MANAGEMENT_ADMIN', 'SENIOR_MANAGER', 'HR_RECRUITER'].includes(user.role) && (
            <div>
              <Link
                href="/dashboard/analytics"
                className={`relative flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all group duration-200 ${
                  isRouteActive('/dashboard/analytics', pathname, searchStr)
                    ? 'text-indigo-600 dark:text-white bg-indigo-50/90 dark:bg-[#8B5CF6]/15 border border-indigo-200/80 dark:border-[#8B5CF6]/30 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50/50 dark:hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {isRouteActive('/dashboard/analytics', pathname, searchStr) && (
                  <div className="absolute left-0 w-1 h-5 rounded-r bg-indigo-600 dark:bg-[#8B5CF6] transition-all duration-200" />
                )}
                <BarChart3 className={`w-4.5 h-4.5 mr-3 transition-transform duration-200 group-hover:scale-105 ${
                  isRouteActive('/dashboard/analytics', pathname, searchStr) ? 'text-indigo-600 dark:text-[#8B5CF6]' : 'text-slate-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-white'
                }`} />
                Analytics
              </Link>
            </div>
          )}

          {/* Profile Link (Standalone for Candidate and Employee) */}
          {mounted && (user?.role === 'CANDIDATE' || user?.role === 'EMPLOYEE') && (
            <div>
              <Link
                href="/dashboard/profile"
                className={`relative flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all group duration-200 ${
                  isRouteActive('/dashboard/profile', pathname, searchStr)
                    ? 'text-indigo-600 dark:text-white bg-indigo-50/90 dark:bg-[#8B5CF6]/15 border border-indigo-200/80 dark:border-[#8B5CF6]/30 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50/50 dark:hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {isRouteActive('/dashboard/profile', pathname, searchStr) && (
                  <div className="absolute left-0 w-1 h-5 rounded-r bg-indigo-600 dark:bg-[#8B5CF6] transition-all duration-200" />
                )}
                <UserCircle className={`w-4.5 h-4.5 mr-3 transition-transform duration-200 group-hover:scale-105 ${
                  isRouteActive('/dashboard/profile', pathname, searchStr) ? 'text-indigo-600 dark:text-[#8B5CF6]' : 'text-slate-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-white'
                }`} />
                Profile Settings
              </Link>
            </div>
          )}

          {/* My Account Group (For Admins) */}
          {mounted && user && !['CANDIDATE', 'EMPLOYEE'].includes(user.role) && (
            <div>
              {renderGroupHeader('My Account', 'account')}
              <AnimatePresence initial={false}>
                {openGroups.account && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden space-y-1 mt-1 pl-1"
                  >
                    <Link
                      href="/dashboard/profile"
                      className={`relative flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all group duration-200 ${
                        isRouteActive('/dashboard/profile', pathname, searchStr)
                          ? 'text-indigo-600 dark:text-white bg-indigo-50/90 dark:bg-[#8B5CF6]/15 border border-indigo-200/80 dark:border-[#8B5CF6]/30 font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50/50 dark:hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      {isRouteActive('/dashboard/profile', pathname, searchStr) && (
                        <div className="absolute left-0 w-1 h-5 rounded-r bg-indigo-600 dark:bg-[#8B5CF6] transition-all duration-200" />
                      )}
                      <UserCircle className={`w-4.5 h-4.5 mr-3 ${isRouteActive('/dashboard/profile', pathname, searchStr) ? 'text-indigo-600 dark:text-[#8B5CF6]' : 'text-slate-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-white'}`} />
                      Profile
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </nav>

      {/* Sign Out Footer */}
      <div className="p-3 border-t border-border dark:border-white/10 bg-muted/20 dark:bg-white/[0.01]">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-600 dark:text-zinc-300 hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer font-medium"
          onClick={handleLogout}
        >
          <LogOut className="w-4.5 h-4.5 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-screen w-screen bg-background text-foreground overflow-hidden p-2 sm:p-3 gap-3 sm:gap-4 selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:bg-primary/25 dark:selection:text-white">
      {/* Animated Connected-Node Network Background Scene */}
      <div className="bg-scene">
        <div className="bg-ambient" />
        <StarField dark={isDark} />
      </div>

      {/* Desktop Floating Glass Command Center Sidebar */}
      <div className="hidden md:flex w-64 glass-sidebar anim-sidebar bg-card/85 dark:bg-[#0e101e]/80 backdrop-blur-2xl border border-border dark:border-white/10 flex-col z-20 shadow-[0_8px_32px_rgba(23,32,51,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)] rounded-[24px] h-full overflow-hidden shrink-0">
        {sidebarNavigation}
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-72 max-w-[85vw] h-full bg-card/95 dark:bg-[#0e101e]/95 backdrop-blur-2xl border-r border-border dark:border-white/10 shadow-2xl z-10 flex flex-col"
            >
              {sidebarNavigation}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col gap-3 h-full overflow-hidden z-10 min-w-0">
        {/* Top Navbar - Glass Header */}
        <header className="h-16 glass-header anim-header bg-card/85 dark:bg-[#0e101e]/80 backdrop-blur-2xl border border-border dark:border-white/10 flex items-center justify-between px-4 sm:px-6 z-10 shadow-[0_4px_20px_rgba(23,32,51,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] rounded-[20px] sm:rounded-[24px] shrink-0">
          <div className="flex items-center space-x-3">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/[0.04] border border-border dark:border-white/10 cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <h2 className="text-small-label text-foreground dark:text-white font-bold tracking-wider uppercase truncate">
              {getHeaderTitle(pathname)}
            </h2>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/[0.04] transition-all cursor-pointer border border-border dark:border-transparent dark:hover:border-white/10 theme-toggle"
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>
            )}

            <div className="h-4 w-px bg-border dark:bg-white/10" />

            {mounted && user?.role && (
              <span className="text-[10px] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary/10 text-primary tracking-wider uppercase font-mono hidden sm:block border border-primary/20 font-semibold">
                {user.role.replace('_', ' ')}
              </span>
            )}

            {mounted && user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-8 w-8 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer overflow-hidden border border-border dark:border-white/10">
                  <Avatar className="h-8 w-8 rounded-xl">
                    <AvatarImage src={user?.profileImage} alt={user?.firstName} />
                    <AvatarFallback className="rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-semibold text-xs">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-xl p-1.5 shadow-2xl border-border dark:border-white/10 bg-popover dark:bg-[#0F0E17]/95 backdrop-blur-xl text-popover-foreground" align="end">
                  <DropdownMenuLabel className="font-normal px-2.5 py-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-semibold leading-none text-foreground dark:text-white">{user?.firstName} {user?.lastName}</p>
                      <p className="text-[10px] leading-none text-muted-foreground dark:text-white/45 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border dark:bg-white/10" />
                  <DropdownMenuItem className="rounded-lg py-2 focus:bg-muted dark:focus:bg-white/[0.06] text-xs cursor-pointer text-foreground">
                    <Link href="/dashboard/profile" className="w-full">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border dark:bg-white/10" />
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/10 rounded-lg py-2 cursor-pointer text-xs" onClick={handleLogout}>
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Main Content Area Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 bg-transparent rounded-[20px] sm:rounded-[24px] h-[calc(100vh-5.5rem)]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="max-w-7xl mx-auto space-y-6 anim-hero"
          >
            {apiOffline && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-550 rounded-xl p-4 flex items-start gap-3 text-xs shadow-sm select-none z-50">
                <ShieldAlert className="w-5 h-5 animate-pulse text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold uppercase tracking-wider text-[10px]">Critical: Unable to connect to HRMinds API</p>
                  <p className="font-medium text-zinc-500 dark:text-zinc-400">
                    The backend API server or the database is currently unreachable. Real-time logging, attendance check-ins, and payroll calculations will be disabled until services restore.
                  </p>
                </div>
              </div>
            )}
            {children}
          </motion.div>
        </main>
      </div>

      <FloatingCopilot />
    </div>
  );
};
