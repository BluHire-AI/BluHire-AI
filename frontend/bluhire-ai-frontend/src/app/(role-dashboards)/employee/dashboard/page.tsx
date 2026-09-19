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

// ── Canonical Stat Card ───────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="bg-card/85 dark:bg-[#0e101e]/85 backdrop-blur-2xl border border-border dark:border-white/10 rounded-[20px] p-5 shadow-xs hover:border-border dark:hover:border-white/20 transition-all flex items-start gap-4"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary dark:text-[#8B5CF6]">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl sm:text-2xl font-extrabold text-foreground dark:text-white mt-1 leading-none truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground dark:text-zinc-500 mt-1 truncate">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Canonical Quick Action ─────────────────────────────────────────────────
function QuickAction({ href, icon: Icon, label, desc }: {
  href: string; icon: React.ElementType; label: string; desc: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="bg-card/85 dark:bg-[#0e101e]/85 backdrop-blur-2xl border border-border dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-xs cursor-pointer group hover:border-primary/50 hover:bg-primary/5 transition-all"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary group-hover:scale-105 transition-transform">
          <Icon className="w-4.5 h-4.5" />
        </div>
        <p className="text-sm font-bold text-foreground dark:text-zinc-100 group-hover:text-primary transition-colors">{label}</p>
        <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-0.5 leading-snug">{desc}</p>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 mt-2 transition-all" />
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
      // GET /api/v1/users/me — strictly accessible by all authenticated roles
      const res = await api.get('/users/me');
      const userData = res.data.data;

      // Try to find the matching employee record if available for this specific user
      try {
        const empRes = await api.get('/employees', { params: { search: userData.email, limit: 1 } });
        const emp = empRes.data?.data?.data?.[0];
        if (emp) {
          setProfile({ ...emp });
          return;
        }
      } catch {
        // Fall back to User data if employee record is not linked yet
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
    { href: '/dashboard/directory', icon: Users, label: 'Directory', desc: 'Browse employee contacts' },
    { href: '/dashboard/profile', icon: User, label: 'My Profile', desc: 'View & edit your profile' },
    { href: '/dashboard/org-chart', icon: Layers, label: 'Org Chart', desc: 'See team hierarchy' },
    { href: '/dashboard/attendance', icon: Clock, label: 'Attendance', desc: 'Check in / attendance log' },
    { href: '/dashboard/performance', icon: TrendingUp, label: 'Performance', desc: 'Goals & reviews' },
    { href: '/dashboard/knowledge', icon: FileText, label: 'Knowledge Base', desc: 'Company docs & policies' },
  ];

  return (
    <RoleGuard allowedRoles={['EMPLOYEE', 'MANAGEMENT_ADMIN', 'SENIOR_MANAGER', 'HR_RECRUITER']}>
      <div className="space-y-8 max-w-7xl mx-auto">

        {/* ── Welcome Header Card ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[24px] bg-card/85 dark:bg-[#0e101e]/85 backdrop-blur-2xl border border-border dark:border-white/10 p-6 sm:p-8 text-foreground dark:text-white shadow-xl group"
        >
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 z-10">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold flex items-center justify-center text-2xl border border-border dark:border-white/20 shrink-0 shadow-md">
                {profile?.profileImage
                  ? <img src={profile.profileImage} alt="avatar" className="w-full h-full object-cover rounded-2xl" />
                  : initials
                }
              </div>
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">Welcome back 👋</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground dark:text-white">{firstName} {lastName}</h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                  {designation !== '—' && (
                    <span className="flex items-center gap-1.5 text-xs text-foreground/80 dark:text-zinc-300 bg-muted/60 dark:bg-white/[0.04] px-3 py-1 rounded-full border border-border dark:border-white/10">
                      <Briefcase className="w-3.5 h-3.5 text-primary" /> {designation}
                    </span>
                  )}
                  {department !== '—' && (
                    <span className="flex items-center gap-1.5 text-xs text-foreground/80 dark:text-zinc-300 bg-muted/60 dark:bg-white/[0.04] px-3 py-1 rounded-full border border-border dark:border-white/10">
                      <Building2 className="w-3.5 h-3.5 text-primary" /> {department}
                    </span>
                  )}
                  {employeeCode !== '—' && (
                    <span className="flex items-center gap-1.5 text-xs text-foreground/80 dark:text-zinc-300 bg-muted/60 dark:bg-white/[0.04] px-3 py-1 rounded-full border border-border dark:border-white/10 font-mono">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" /> {employeeCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              <div className="text-xs text-muted-foreground dark:text-zinc-400 font-medium">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ACCOUNT ACTIVE
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Stat Cards ────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Department" value={department} />
          <StatCard icon={Award} label="Designation" value={designation !== '—' ? designation : '—'} />
          <StatCard icon={Calendar} label="Joining Date" value={joinDate} />
          <StatCard icon={Star} label="Skills" value={skills.length || '—'} sub={skills.length ? `${skills.slice(0, 2).join(', ')}${skills.length > 2 ? '...' : ''}` : 'Not set yet'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

          {/* ── Profile Card ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/85 dark:bg-[#0e101e]/85 backdrop-blur-2xl border border-border dark:border-white/10 rounded-[24px] p-6 shadow-xs space-y-5"
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Personal Info
            </h2>

            <div className="space-y-3.5">
              {[
                { icon: Mail, label: 'Email', val: user?.email || '—' },
                { icon: Phone, label: 'Phone', val: profile?.phone || '—' },
                { icon: MapPin, label: 'Location', val: profile?.workLocation || '—' },
                { icon: Briefcase, label: 'Type', val: profile?.employmentType?.replace(/_/g, ' ') || 'Full Time' },
                { icon: Clock, label: 'Status', val: profile?.employmentStatus?.replace(/_/g, ' ') || 'Active' },
              ].map(({ icon: Ic, label, val }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-muted/60 dark:bg-white/[0.04] border border-border dark:border-white/5 flex items-center justify-center shrink-0">
                    <Ic className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground dark:text-zinc-500 uppercase tracking-wider font-semibold">{label}</p>
                    <p className="text-sm text-foreground dark:text-zinc-200 font-medium leading-tight truncate">{val}</p>
                  </div>
                </div>
              ))}
            </div>

            {profile?.managerId && (
              <div className="pt-4 border-t border-border dark:border-white/10">
                <p className="text-[10px] text-muted-foreground dark:text-zinc-500 uppercase tracking-wider font-semibold mb-2">Reporting Manager</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                    {profile.managerId.firstName?.[0]}{profile.managerId.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground dark:text-zinc-100">{profile.managerId.firstName} {profile.managerId.lastName}</p>
                    <p className="text-xs text-muted-foreground dark:text-zinc-400">{profile.managerId.designationId?.title || 'Manager'}</p>
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
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Quick Access
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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
                className="bg-card/85 dark:bg-[#0e101e]/85 backdrop-blur-2xl border border-border dark:border-white/10 rounded-[24px] p-5 shadow-xs"
              >
                <h3 className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> My Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-violet-300 border border-primary/20 font-medium"
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
