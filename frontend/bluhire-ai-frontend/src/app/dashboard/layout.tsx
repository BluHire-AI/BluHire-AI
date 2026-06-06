'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, UserCircle, LogOut, Building, Briefcase, 
  Network, Contact, Sun, Moon, ChevronDown, ChevronRight,
  Compass, Award, BarChart3, Bot, BookOpen
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
    aiFeatures: true,
    orgSetup: true,
    account: true,
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
        className="w-full flex items-center justify-between px-3.5 py-2 text-small-label text-white/45 hover:text-white/85 transition-colors mt-4 first:mt-0"
      >
        <span>{title}</span>
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
    );
  };

  return (
    <AuthProvider>
      <div className="flex h-screen w-screen bg-transparent overflow-hidden p-3 gap-4 text-foreground selection:bg-primary/25 selection:text-white">
        {/* Sidebar - Floating Glass Command Center */}
        <div className="w-64 bg-white/[0.03] backdrop-blur-2xl border border-white/10 flex flex-col z-20 shadow-[0_8px_32px_rgba(0,0,0,0.35)] rounded-[24px] h-full overflow-hidden shrink-0">
          <div className="h-16 flex items-center px-6 border-b border-white/10 justify-between bg-white/[0.02]">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 flex items-center justify-center text-[#8B5CF6] mr-2.5 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
                <Building className="w-4.5 h-4.5" />
              </div>
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-violet-400 via-indigo-400 to-[#8B5CF6] bg-clip-text text-transparent">BluHire-AI</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
            <div className="space-y-4">
              {/* Dashboard Link (Single Top-level) */}
              <div>
                <Link
                  href="/dashboard"
                  className={`relative flex items-center px-4 py-2.5 rounded-xl text-sidebar transition-all group duration-250 ${
                    pathname === '/dashboard'
                      ? 'text-white bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                      : 'text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  {pathname === '/dashboard' && (
                    <motion.div
                      layoutId="active-nav-glow"
                      className="absolute left-0 w-1 h-5 rounded-r bg-[#8B5CF6] shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <LayoutDashboard className={`w-4.5 h-4.5 mr-3 transition-transform duration-250 group-hover:scale-105 ${
                    pathname === '/dashboard' ? 'text-[#8B5CF6]' : 'text-white/45 group-hover:text-white/80'
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
                        { name: 'Performance & Coaching', href: '/dashboard/performance', icon: Award },
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
                            className={`flex items-center px-4 py-2.5 rounded-xl text-sidebar transition-all group duration-250 ${
                              isActive
                                ? 'text-white bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                                : 'text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent'
                            }`}
                          >
                            <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-[#8B5CF6]' : 'text-white/45 group-hover:text-white/80'}`} />
                            {item.name}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Analytics Link (Standalone Top-level) */}
              {user && ['MANAGEMENT_ADMIN', 'SENIOR_MANAGER', 'HR_RECRUITER'].includes(user.role) && (
                <div>
                  <Link
                    href="/dashboard/analytics"
                    className={`relative flex items-center px-4 py-2.5 rounded-xl text-sidebar transition-all group duration-250 ${
                      pathname === '/dashboard/analytics'
                        ? 'text-white bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                        : 'text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    {pathname === '/dashboard/analytics' && (
                      <motion.div
                        layoutId="active-nav-glow"
                        className="absolute left-0 w-1 h-5 rounded-r bg-[#8B5CF6]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <BarChart3 className={`w-4.5 h-4.5 mr-3 transition-transform duration-250 group-hover:scale-105 ${
                      pathname === '/dashboard/analytics' ? 'text-[#8B5CF6]' : 'text-white/45 group-hover:text-white/80'
                    }`} />
                    Analytics
                  </Link>
                </div>
              )}

              {/* AI Features Group */}
              <div>
                {renderGroupHeader('AI Features', 'aiFeatures')}
                <AnimatePresence initial={false}>
                  {openGroups.aiFeatures && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden space-y-1 mt-1 pl-1"
                    >
                      {[
                        { name: 'AI Copilot', href: '/dashboard/copilot', icon: Bot, roles: ['MANAGEMENT_ADMIN', 'HR_RECRUITER', 'SENIOR_MANAGER'] },
                        { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: BookOpen, roles: ['MANAGEMENT_ADMIN', 'SENIOR_MANAGER', 'HR_RECRUITER', 'EMPLOYEE'] },
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
                            className={`flex items-center px-4 py-2.5 rounded-xl text-sidebar transition-all group duration-250 ${
                              isActive
                                ? 'text-white bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                                : 'text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent'
                            }`}
                          >
                            <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-[#8B5CF6]' : 'text-white/45 group-hover:text-white/80'}`} />
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
                            className={`flex items-center px-4 py-2.5 rounded-xl text-sidebar transition-all group duration-250 ${
                              isActive
                                ? 'text-white bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                                : 'text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent'
                            }`}
                          >
                            <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-[#8B5CF6]' : 'text-white/45 group-hover:text-white/80'}`} />
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
                        className={`flex items-center px-4 py-2.5 rounded-xl text-sidebar transition-all group duration-300 ${
                          pathname === '/dashboard/profile'
                            ? 'text-white bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                            : 'text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent'
                        }`}
                      >
                        <UserCircle className={`w-4.5 h-4.5 mr-3 ${pathname === '/dashboard/profile' ? 'text-[#8B5CF6]' : 'text-white/45'}`} />
                        Profile
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </nav>

          <div className="p-3 border-t border-white/10 bg-white/[0.01]">
            <Button
              variant="ghost"
              className="w-full justify-start text-white/45 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-xl cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4.5 h-4.5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col gap-3 h-full overflow-hidden">
          {/* Top Navbar - Glass Header */}
          <header className="h-16 bg-white/[0.03] backdrop-blur-2xl border border-white/10 flex items-center justify-between px-6 z-10 shadow-[0_8px_32px_rgba(0,0,0,0.25)] rounded-[24px] shrink-0">
            <div>
              <h2 className="text-small-label text-white">
                {pathname === '/dashboard' ? 'Overview' : 
                 pathname.startsWith('/dashboard/employees') ? 'Employees' : 
                 pathname === '/dashboard/directory' ? 'Employee Directory' : 
                 pathname === '/dashboard/org-chart' ? 'Organization Chart' : 
                 pathname === '/dashboard/departments' ? 'Departments' : 
                 pathname === '/dashboard/designations' ? 'Designations' : 
                 pathname.startsWith('/dashboard/recruitment') ? 'Recruitment' : 
                 pathname.startsWith('/dashboard/copilot') ? 'AI Copilot' :
                 pathname === '/dashboard/knowledge' ? 'Knowledge Base' :
                 pathname === '/dashboard/profile' ? 'Profile' : 'HRMinds AI'}
              </h2>
            </div>

            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-xl text-white/45 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer border border-transparent hover:border-white/10"
                  aria-label="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              <div className="h-4 w-px bg-white/10" />

              <span className="text-small-label px-3 py-1 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] tracking-wider uppercase font-mono hidden sm:block border border-[#8B5CF6]/20">
                {user?.role.replace('_', ' ')}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-8 w-8 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] cursor-pointer overflow-hidden border border-white/10">
                  <Avatar className="h-8 w-8 rounded-xl">
                    <AvatarImage src={user?.profileImage} alt={user?.firstName} />
                    <AvatarFallback className="rounded-xl bg-gradient-to-tr from-violet-600 to-[#8B5CF6] text-white font-semibold text-xs">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-xl p-1.5 shadow-2xl border-white/10 bg-[#0F0E17]/95 backdrop-blur-xl text-popover-foreground" align="end">
                  <DropdownMenuLabel className="font-normal px-2.5 py-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-semibold leading-none text-white">{user?.firstName} {user?.lastName}</p>
                      <p className="text-[10px] leading-none text-white/45">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className="rounded-lg py-2 focus:bg-white/[0.06] text-xs cursor-pointer">
                    <Link href="/dashboard/profile" className="w-full">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className="text-red-400 focus:bg-[#EF4444]/10 rounded-lg py-2 cursor-pointer text-xs" onClick={handleLogout}>
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content Area Container */}
          <main className="flex-1 overflow-y-auto p-6 bg-transparent rounded-[24px] h-[calc(100vh-6rem)]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="max-w-7xl mx-auto space-y-6"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
