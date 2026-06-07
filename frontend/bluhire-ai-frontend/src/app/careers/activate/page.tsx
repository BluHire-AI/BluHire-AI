'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store/auth';
import { Sparkles, KeyRound, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

function ActivationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuthStore();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Activation token is missing from url parameter.');
      setLoading(false);
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await api.get('/auth/verify-magic-token', { params: { token } });
        setDetails(res.data?.data || null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Token is invalid or has expired.');
      } finally {
        setLoading(false);
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Password fields cannot be blank.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await api.post('/auth/activate-candidate', { token, password });
      const { user, accessToken, refreshToken } = res.data?.data || {};

      setSuccess(true);
      
      // Auto login
      setTimeout(() => {
        login(user, accessToken, refreshToken);
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to activate account. Try again.');
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin" />
        <p className="text-xs text-white/50 font-medium">Validating activation link...</p>
      </div>
    );
  }

  if (error && !details) {
    return (
      <Card className="bg-red-500/5 border-red-500/20 rounded-[24px] p-6 text-center max-w-md mx-auto">
        <CardHeader className="pb-3 flex flex-col items-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-2 animate-bounce" />
          <CardTitle className="text-red-400 text-lg font-bold">Verification Failed</CardTitle>
          <CardDescription className="text-white/40 text-xs">The link is either incorrect or expired.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-white/60">
          <p>{error}</p>
          <Button onClick={() => router.push('/')} variant="outline" className="w-full border-white/10 rounded-xl">
            Go back to Home
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="bg-emerald-500/5 border-emerald-500/20 rounded-[24px] p-8 text-center max-w-md mx-auto">
        <CardHeader className="pb-3 flex flex-col items-center">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mb-2" />
          <CardTitle className="text-emerald-400 text-lg font-bold">Account Activated</CardTitle>
          <CardDescription className="text-white/40 text-xs">Your credentials have been successfully configured.</CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-white/60">
          <p className="animate-pulse">Redirecting you to your candidate workspace dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  const candidate = details?.candidate;
  const job = details?.job;

  return (
    <Card className="bg-white/[0.02] border-white/10 rounded-[24px] shadow-2xl max-w-md mx-auto relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-tr from-[#8B5CF6]/0 via-[#8B5CF6]/0 to-[#8B5CF6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <CardHeader className="text-center pb-2">
        <div className="w-10 h-10 bg-white/[0.04] border border-white/10 rounded-xl flex items-center justify-center mx-auto text-[#8B5CF6] mb-3">
          <KeyRound className="w-5 h-5" />
        </div>
        <CardTitle className="text-2xl text-white font-bold">Set Your Password</CardTitle>
        <CardDescription className="text-white/40 text-xs">
          Configure security credentials to access your secure workspace.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-4">
        {/* Candidate Invite Context */}
        <div className="p-3.5 mb-6 rounded-xl border border-white/10 bg-white/[0.01] text-xs text-white/70 space-y-2">
          <div>
            <span className="text-white/40">Candidate:</span> <span className="font-semibold text-white">{candidate?.firstName} {candidate?.lastName}</span>
          </div>
          <div>
            <span className="text-white/40">Position:</span> <span className="font-semibold text-white">{job?.title}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-white/40">Job Code:</span> <Badge variant="outline" className="text-[10px] py-0.5 px-2 bg-white/[0.03] text-white/80">{job?.jobCode}</Badge>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Enter Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl bg-white/[0.03] border-white/10 text-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-xl bg-white/[0.03] border-white/10 text-white"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#8B5CF6] hover:bg-[#A855F7] text-white font-semibold text-xs h-10 mt-6 shadow-lg shadow-[#8B5CF6]/10 border-0 cursor-pointer"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Activate My Workspace
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ActivationPage() {
  return (
    <div className="py-24 px-4 max-w-7xl mx-auto flex items-center justify-center">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin" />
          <p className="text-xs text-white/50 font-medium">Loading activation content...</p>
        </div>
      }>
        <ActivationForm />
      </Suspense>
    </div>
  );
}
