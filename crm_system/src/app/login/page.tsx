'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { withBasePath } from '@/lib/basePath';

/* ------------------------------------------------------------------ */
/*  Animated avatar                                                    */
/*  - "glance" state: eyes flick side to side while the email is typed */
/*  - "cover" state: hands rise to cover the eyes while the password   */
/*    field is focused                                                 */
/* ------------------------------------------------------------------ */

function LoginAvatar({
  glanceTrigger,
  coveringEyes,
}: {
  glanceTrigger: number;
  coveringEyes: boolean;
}) {
  return (
    <div className="relative mx-auto h-32 w-32">
      <svg viewBox="0 0 200 200" className="h-full w-full">
        {/* background circle */}
        <circle cx="100" cy="100" r="98" fill="#9FD3EC" stroke="#1B4965" strokeWidth="3" />

        {/* shoulders / body, clipped to the circle */}
        <clipPath id="avatarClip">
          <circle cx="100" cy="100" r="98" />
        </clipPath>
        <g clipPath="url(#avatarClip)">
          <ellipse cx="100" cy="215" rx="70" ry="55" fill="#E4F2FB" stroke="#1B4965" strokeWidth="3" />

          {/* head */}
          <circle cx="100" cy="110" r="52" fill="#F4FAFE" stroke="#1B4965" strokeWidth="3" />

          {/* ears */}
          <circle cx="52" cy="112" r="10" fill="#F4FAFE" stroke="#1B4965" strokeWidth="3" />
          <circle cx="148" cy="112" r="10" fill="#F4FAFE" stroke="#1B4965" strokeWidth="3" />

          {/* hair */}
          <path
            d="M55 90 Q60 35 100 40 Q140 35 145 90 Q130 60 118 85 Q108 50 100 82 Q92 50 82 85 Q70 60 55 90Z"
            fill="#F4FAFE"
            stroke="#1B4965"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* eyes: animate a small horizontal glance whenever glanceTrigger changes */}
          <motion.g
            key={glanceTrigger}
            initial={{ x: 0 }}
            animate={{ x: [0, -4, 4, 0] }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
          >
            <circle cx="82" cy="108" r="5" fill="#1B4965" />
            <circle cx="118" cy="108" r="5" fill="#1B4965" />
          </motion.g>

          {/* mouth */}
          <path
            d="M85 128 Q100 140 115 128"
            fill="none"
            stroke="#1B4965"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* hands: slide up from below the face to cover the eyes */}
          <motion.g
            initial={false}
            animate={{ y: coveringEyes ? 0 : 90, opacity: coveringEyes ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <circle cx="80" cy="108" r="17" fill="#F4FAFE" stroke="#1B4965" strokeWidth="3" />
            <circle cx="120" cy="108" r="17" fill="#F4FAFE" stroke="#1B4965" strokeWidth="3" />
          </motion.g>
        </g>
      </svg>
    </div>
  );
}

function LoginForm() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [glanceTrigger, setGlanceTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuth();

  const redirectUrl = searchParams.get('redirect') || '/';

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'session_expired') {
      setError('會話已過期，請重新登錄');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'username') {
      // re-trigger the "glance" animation on every keystroke
      setGlanceTrigger((n) => n + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(withBasePath('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        login(data.user);
        router.push(redirectUrl);
      } else {
        setError(data.message || '登录失敗');
      }
    } catch {
      setError('登录失敗，請稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-10 shadow-sm">
        <LoginAvatar glanceTrigger={glanceTrigger} coveringEyes={passwordFocused} />

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-semibold text-[#1B4965]">
              使用者名稱
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full rounded-lg border border-[#1B4965]/40 bg-[#F4FAFE] px-4 py-2.5 text-slate-800 placeholder-slate-400 outline-none focus:border-[#1B4965] focus:ring-2 focus:ring-[#9FD3EC]"
              placeholder="使用者名稱"
              value={formData.username}
              onChange={handleChange}
              onFocus={() => setPasswordFocused(false)}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-[#1B4965]">
              密碼
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-[#1B4965]/40 bg-[#F4FAFE] px-4 py-2.5 text-slate-800 placeholder-slate-400 outline-none focus:border-[#1B4965] focus:ring-2 focus:ring-[#9FD3EC]"
              placeholder="密碼"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              disabled={loading}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-sm text-red-600"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#4FA8D8] py-3 text-base font-semibold text-white transition hover:bg-[#3d92c2] disabled:cursor-not-allowed disabled:bg-[#9FD3EC]"
          >
            {loading ? '登錄中...' : 'Log in'}
          </button>

          <div className="pt-2 text-center text-xs text-slate-500">
            <div className="font-medium">測試帳號：</div>
            <div>使用者名稱：test　密碼：test123</div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
