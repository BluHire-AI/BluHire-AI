'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, UserCircle, LogOut, Building, Briefcase, 
  Network, Contact, Sun, Moon, Sparkles, ChevronDown, ChevronRight,
  TrendingUp, Compass, Award, BarChart3, Bot
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/lib/store/auth';
import { AuthProvider } from '@/components/providers/auth-provider';
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
import { AICopilot } from '@/components/ui/ai-copilot';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Group accordion states
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    workforce: true,
    orgSetup: true,
    account: true,
    future: false,
  });

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

  const renderGroupHeader = (title: string, groupKey: string) => {
    const isOpen = openGroups[groupKey];
    return (
      <button
        onClick={() => toggleGroup(groupKey)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mt-4 first:mt-0"
      >
        <span>{title}</span>
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
    );
  };

  return (
    <AuthProvider>
      <div className="flex h-screen bg-zinc-50 dark:bg-[#070b13] transition-colors duration-300">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-[#0e1422] border-r border-zinc-200/80 dark:border-zinc-800/80 flex flex-col z-20 shadow-sm">
          <div className="h-16 flex items-center px-6 border-b border-zinc-100 dark:border-zinc-800/60 justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 mr-2.5">
                <Building className="w-4.5 h-4.5" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">BluHire-AI</span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-4">
            <div className="space-y-4">
              {/* Dashboard Link (Single Top-level) */}
              <div>
                <Link
                  href="/dashboard"
                  className={`relative flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group duration-300 ${
                    pathname === '/dashboard'
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/20'
                  }`}
                >
                  {pathname === '/dashboard' && (
                    <motion.div
                      layoutId="active-nav-glow"
                      className="absolute left-0 w-1 h-6 rounded-r bg-blue-600 dark:bg-blue-500"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <LayoutDashboard className={`w-5 h-5 mr-3.5 transition-transform duration-300 group-hover:scale-105 ${
                    pathname === '/dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'
                  }`} />
                  Dashboard
                </Link>
              </div>

              {/* Workforce Management Group */}
              <div>
                {renderGroupHeader('Workforce Management', 'workforce')}
                <AnimatePresence initial={false}>
                  {openGroups.workforce && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden space-y-1 mt-1 pl-1"
                    >
                      {[
                        { name: 'Employees', href: '/dashboard/employees', icon: Users, roles: ['MANAGEMENT_ADMIN', 'HR_RECRUITER', 'SENIOR_MANAGER'] },
                        { name: 'Employee Directory', href: '/dashboard/directory', icon: Contact },
                        { name: 'Organization Chart', href: '/dashboard/org-chart', icon: Network },
                        { name: 'Recruitment', href: '/dashboard/recruitment', icon: Compass, roles: ['MANAGEMENT_ADMIN', 'HR_RECRUITER'] },
                      ].map((item) => {
                        if (item.roles && user && !item.roles.includes(user.role)) {
                          return null;
                        }
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all group duration-300 ${
                              isActive
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10'
                                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10'
                            }`}
                          >
                            <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
                            {item.name}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Organization Setup Group */}
              <div>
                {renderGroupHeader('Organization Setup', 'orgSetup')}
                <AnimatePresence initial={false}>
                  {openGroups.orgSetup && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden space-y-1 mt-1 pl-1"
                    >
                      {[
                        { name: 'Departments', href: '/dashboard/departments', icon: Building, roles: ['MANAGEMENT_ADMIN', 'HR_RECRUITER', 'SENIOR_MANAGER'] },
                        { name: 'Designations', href: '/dashboard/designations', icon: Briefcase, roles: ['MANAGEMENT_ADMIN', 'HR_RECRUITER', 'SENIOR_MANAGER'] },
                      ].map((item) => {
                        if (item.roles && user && !item.roles.includes(user.role)) {
                          return null;
                        }
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all group duration-300 ${
                              isActive
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10'
                                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10'
                            }`}
                          >
                            <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
                            {item.name}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* My Account Group */}
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
                        className={`flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all group duration-300 ${
                          pathname === '/dashboard/profile'
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10'
                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10'
                        }`}
                      >
                        <UserCircle className={`w-4 h-4 mr-3 ${pathname === '/dashboard/profile' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
                        Profile
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Future Modules Group */}
              <div>
                {renderGroupHeader('Future Modules', 'future')}
                <AnimatePresence initial={false}>
                  {openGroups.future && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden space-y-1 mt-1 pl-1"
                    >
                      {[
                        { name: 'Performance', icon: Award },
                        { name: 'Analytics', icon: BarChart3 },
                        { name: 'AI Hub', icon: Bot },
                      ].map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 dark:text-zinc-600 cursor-not-allowed select-none"
                        >
                          <div className="flex items-center">
                            <item.icon className="w-4 h-4 mr-3 text-zinc-300 dark:text-zinc-800" />
                            {item.name}
                          </div>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 dark:text-zinc-600">Soon</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </nav>

          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/60">
            <Button
              variant="ghost"
              className="w-full justify-start text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign out
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white dark:bg-[#0e1422] border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between px-8 z-10 shadow-sm transition-colors duration-300">
            <div>
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                {pathname === '/dashboard' ? 'Overview' : 
                 pathname.startsWith('/dashboard/employees') ? 'Employees' : 
                 pathname === '/dashboard/directory' ? 'Employee Directory' : 
                 pathname === '/dashboard/org-chart' ? 'Organization Chart' : 
                 pathname === '/dashboard/departments' ? 'Departments' : 
                 pathname === '/dashboard/designations' ? 'Designations' : 
                 pathname.startsWith('/dashboard/recruitment') ? 'Recruitment' : 
                 pathname === '/dashboard/profile' ? 'Profile' : 'HRMinds AI'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all cursor-pointer border border-zinc-100 dark:border-zinc-800/50"
                  aria-label="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 tracking-wide uppercase hidden sm:block">
                {user?.role.replace('_', ' ')}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-9 w-9 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer overflow-hidden border border-zinc-100 dark:border-zinc-800">
                  <Avatar className="h-9 w-9 rounded-xl">
                    <AvatarImage src={user?.profileImage} alt={user?.firstName} />
                    <AvatarFallback className="rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-medium text-sm">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-xl p-1.5 shadow-xl border-zinc-200/80 dark:border-zinc-800/80" align="end">
                  <DropdownMenuLabel className="font-normal px-2.5 py-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                  <DropdownMenuItem className="rounded-lg py-2 focus:bg-zinc-50 dark:focus:bg-zinc-800/40">
                    <Link href="/dashboard/profile" className="w-full text-xs">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                  <DropdownMenuItem className="text-red-600 dark:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20 rounded-lg py-2 cursor-pointer" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="text-xs font-medium">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8 gradient-bg">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="max-w-7xl mx-auto space-y-8"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
      
      {/* Global AI Copilot Widget */}
      <AICopilot />
    </AuthProvider>
  );
}
