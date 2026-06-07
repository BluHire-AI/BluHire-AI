'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';
import { api } from '@/lib/api';
import { RoleGuard } from '@/components/auth/RoleGuard';
import {
  User, Users, Building2, MapPin, Phone, Mail,
  Calendar, Clock, Star, TrendingUp, Award,
  ChevronRight, Briefcase, FileText, RefreshCw,
  CheckCircle, ShieldCheck, Layers
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface EmployeeProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employeeCode?: string;
  profileImage?: string;
  workLocation?: string;
  joiningDate?: string;
  employmentStatus?: string;
  employmentType?: string;
  skills?: string[];
  departmentId?: { name: string };
  designationId?: { title: string; level?: string };
  managerId?: { firstName: string; lastName: string; profileImage?: string; designationId?: { title: string } };
}

// ── Card atom ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-start gap-4`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Quick Action ───────────────────────────────────────────────────────────
function QuickAction({ href, icon: Icon, label, desc, color }: {
  href: string; icon: React.ElementType; label: string; desc: string; color: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm cursor-pointer group hover:border-blue-200 dark:hover:border-blue-800 transition-all"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{label}</p>
        <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
        <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 mt-2 transition-colors" />
      </motion.div>
    </Link>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // GET /api/v1/users/me — accessible by all authenticated roles
      const res = await api.get('/users/me');
      const userData = res.data.data;

      // Try to find the matching employee record if available
      try {
        const empRes = await api.get('/employees', { params: { search: userData.email, limit: 1 } });
        const emp = empRes.data?.data?.data?.[0];
        if (emp) {
          setProfile({ ...emp });
          return;
        }
      } catch {
        // Employee record may not be fully created yet — fall back to User data
      }

      setProfile({
        _id: userData._id || userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        employeeCode: userData.employeeId,
        departmentId: userData.department ? { name: userData.department } : undefined,
        designationId: userData.designation ? { title: userData.designation } : undefined,
      });
    } catch (err) {
      console.error('[EmployeeDashboard] Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const firstName = profile?.firstName || user?.firstName || 'Employee';
  const lastName = profile?.lastName || user?.lastName || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  const department = profile?.departmentId?.name || user?.department || '—';
  const designation = profile?.designationId?.title || user?.designation || '—';
  const employeeCode = profile?.employeeCode || (user as any)?.employeeId || '—';
  const joinDate = profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const skills = profile?.skills || [];

  const quickActions = [
    { href: '/dashboard/directory', icon: Users, label: 'Directory', desc: 'Browse employee contacts', color: 'bg-blue-500' },
    { href: '/dashboard/profile', icon: User, label: 'My Profile', desc: 'View & edit your profile', color: 'bg-violet-500' },
    { href: '/dashboard/org-chart', icon: Layers, label: 'Org Chart', desc: 'See team hierarchy', color: 'bg-emerald-500' },
    { href: '/dashboard/attendance', icon: Clock, label: 'Attendance', desc: 'Check in / attendance log', color: 'bg-amber-500' },
    { href: '/dashboard/performance', icon: TrendingUp, label: 'Performance', desc: 'Goals & reviews', color: 'bg-rose-500' },
    { href: '/dashboard/knowledge', icon: FileText, label: 'Knowledge Base', desc: 'Company docs & policies', color: 'bg-cyan-500' },
  ];

  return (
    <RoleGuard allowedRoles={['EMPLOYEE', 'MANAGEMENT_ADMIN', 'SENIOR_MANAGER', 'HR_RECRUITER']}>
      <div className="space-y-8 max-w-7xl mx-auto">

        {/* ── Welcome Header ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-xl"
        >
          {/* Background blobs */}
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold border border-white/20 shrink-0">
                {profile?.profileImage
                  ? <img src={profile.profileImage} alt="avatar" className="w-full h-full object-cover rounded-2xl" />
                  : initials
                }
              </div>
              <div>
                <p className="text-blue-200 text-sm font-medium">Welcome back 👋</p>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{firstName} {lastName}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {designation !== '—' && (
                    <span className="flex items-center gap-1.5 text-xs text-blue-100 bg-white/10 px-3 py-1 rounded-full">
                      <Briefcase className="w-3 h-3" /> {designation}
                    </span>
                  )}
                  {department !== '—' && (
                    <span className="flex items-center gap-1.5 text-xs text-blue-100 bg-white/10 px-3 py-1 rounded-full">
                      <Building2 className="w-3 h-3" /> {department}
                    </span>
                  )}
                  {employeeCode !== '—' && (
                    <span className="flex items-center gap-1.5 text-xs text-blue-100 bg-white/10 px-3 py-1 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> {employeeCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2">
              <div className="text-xs text-blue-200">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-200" />
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/20">
                  <CheckCircle className="w-3 h-3" /> Account Active
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Stat Cards ────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Department" value={department} color="bg-blue-500" />
          <StatCard icon={Award} label="Designation" value={designation !== '—' ? designation : '—'} color="bg-purple-500" />
          <StatCard icon={Calendar} label="Joining Date" value={joinDate} color="bg-amber-500" />
          <StatCard icon={Star} label="Skills" value={skills.length || '—'} sub={skills.length ? `${skills.slice(0, 2).join(', ')}${skills.length > 2 ? '...' : ''}` : 'Not set yet'} color="bg-emerald-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Profile Card ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5"
          >
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Personal Info
            </h2>

            <div className="space-y-3">
              {[
                { icon: Mail, label: 'Email', val: user?.email || '—' },
                { icon: Phone, label: 'Phone', val: profile?.phone || '—' },
                { icon: MapPin, label: 'Location', val: profile?.workLocation || '—' },
                { icon: Briefcase, label: 'Type', val: profile?.employmentType?.replace(/_/g, ' ') || '—' },
                { icon: Clock, label: 'Status', val: profile?.employmentStatus?.replace(/_/g, ' ') || 'Active' },
              ].map(({ icon: Ic, label, val }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Ic className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">{label}</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200 font-medium leading-tight">{val}</p>
                  </div>
                </div>
              ))}
            </div>

            {profile?.managerId && (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-2">Reporting Manager</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {profile.managerId.firstName[0]}{profile.managerId.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{profile.managerId.firstName} {profile.managerId.lastName}</p>
                    <p className="text-xs text-zinc-400">{profile.managerId.designationId?.title || 'Manager'}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Quick Actions ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 space-y-4"
          >
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Quick Access
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {quickActions.map((a) => (
                <QuickAction key={a.href} {...a} />
              ))}
            </div>

            {/* Skills strip */}
            {skills.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm"
              >
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> My Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </RoleGuard>
  );
}
