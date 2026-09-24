"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

import { useAuth } from "@/contexts/AuthContext";
import { withBasePath } from "@/lib/basePath";
import yetiEyeAnimation from "@public/animations/yeti-face-eyes-only-glance.json";

function LoginAvatar({
  glanceProgress,
  coveringEyes,
}: {
  glanceProgress: number;
  coveringEyes: boolean;
}) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (!lottieRef.current) return;

    // 5-position eye-glance animation:
    // frame 0  -> position 1
    // frame 12 -> position 2
    // frame 24 -> position 3
    // frame 36 -> position 4
    // frame 48 -> position 5

    const frame = glanceProgress * 48;

    lottieRef.current.goToAndStop(frame, true);
  }, [glanceProgress]);

  return (
    <motion.div
      className="relative mx-auto h-44 w-44"
      animate={
        coveringEyes
          ? {
              scale: 1.04,
              rotate: [0, -1.5, 1.5, 0],
            }
          : {
              scale: 1,
              rotate: 0,
            }
      }
      transition={{
        duration: 0.35,
        ease: 'easeInOut',
      }}
    >
      {/* Original face — never modified */}
      <img
        src="/images/yeti-face.jpg"
        alt="Yeti"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />

      {/* Eye animation overlay */}
      <div className="absolute inset-0">
        <Lottie
          lottieRef={lottieRef}
          animationData={yetiEyeAnimation}
          loop={false}
          autoplay={false}
          className="h-full w-full"
        />
      </div>

      <AnimatePresence>
        {coveringEyes && (
          <motion.div
            className="pointer-events-none absolute inset-5 rounded-full bg-[#9FD3EC]/10"
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LoginForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [glanceProgress, setGlanceProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuth();

  const redirectUrl = searchParams.get("redirect") || "/";

  useEffect(() => {
    const message = searchParams.get("message");

    if (message === "session_expired") {
      setError("會話已過期，請重新登錄");
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "username") {
      const MAX_LENGTH = 20;

      const progress = Math.min(value.length / MAX_LENGTH, 1);

      setGlanceProgress(progress);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(withBasePath("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        login(data.user);
        router.push(redirectUrl);
      } else {
        setError(data.message || "登录失敗");
      }
    } catch {
      setError("登录失敗，請稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-sm items-center justify-center">
        <div className="w-full rounded-3xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/70">
          <LoginAvatar
            glanceProgress={glanceProgress}
            coveringEyes={passwordFocused}
          />

          {/* <div className="mt-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#1B4965]">
              Dance School
            </h1>
            <p className="mt-1 text-sm text-slate-400">管理系統</p>
          </div> */}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="mb-1 block text-sm font-semibold text-[#1B4965]"
              >
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
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-semibold text-[#1B4965]"
              >
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
              {loading ? "登錄中..." : "Log in"}
            </button>

            <div className="pt-2 text-center text-xs text-slate-500">
              <div className="font-medium">測試帳號：</div>
              <div>使用者名稱：test　密碼：test123</div>
            </div>
          </form>
        </div>
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
