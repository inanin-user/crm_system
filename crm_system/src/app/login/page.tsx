"use client";

import { useEffect, useMemo, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import Avatar from "@/app/components/Avatar";
import { pandaAvatar, getGlancePosition } from "@/lib/avatar";


import { useAuth } from "@/contexts/AuthContext";
import { withBasePath } from "@/lib/basePath";

/* ------------------------------------------------------------------ */
/* Animated Avatar                                                    */
/* ------------------------------------------------------------------ */

function LoginAvatar({
  glanceProgress,
  coveringEyes,
}: {
  glanceProgress: number;
  coveringEyes: boolean;
}) {
  const targetPosition = useMemo(
    () => getGlancePosition(glanceProgress, pandaAvatar.eyes.glancePath),
    [glanceProgress, pandaAvatar.eyes.glancePath],
  );

  /*
   * Spring makes the eyes follow the target position naturally
   * instead of jumping whenever the username changes.
   */
  const eyeX = useSpring(targetPosition.x, {
    stiffness: 420,
    damping: 28,
    mass: 0.45,
  });

  const eyeY = useSpring(targetPosition.y, {
    stiffness: 420,
    damping: 28,
    mass: 0.45,
  });

  /*
   * Update the spring targets whenever username length changes.
   */
  useEffect(() => {
    eyeX.set(targetPosition.x);
    eyeY.set(targetPosition.y);
  }, [targetPosition, eyeX, eyeY]);

  return (
    <motion.div
      className="relative mx-auto h-32 w-32"
      initial={{
        opacity: 0,
        y: 12,
        scale: 0.92,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: coveringEyes ? 1.03 : 1,
      }}
      transition={{
        duration: 0.45,
        ease: "easeOut",
      }}
    >
      <Avatar
        config={pandaAvatar}
        eyeX={eyeX}
        eyeY={eyeY}
        coveringEyes={coveringEyes}
      />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Login form                                                         */
/* ------------------------------------------------------------------ */

function LoginForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, login } = useAuth();

  const redirectUrl = searchParams.get("redirect") || withBasePath("/"); 

  /* -------------------------------------------------------------- */
  /* Username → eye progress                                        */
  /* -------------------------------------------------------------- */

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const [usernameInputWidth, setUsernameInputWidth] = useState(0);
  const [usernameTextWidth, setUsernameTextWidth] = useState(0);

  /*
   * Measure the actual input width.
   *
   * The input uses px-4 on both sides, so the usable text area is:
   *
   * input width - 32px
   */
  useEffect(() => {
    const updateWidth = () => {
      if (usernameInputRef.current) {
        setUsernameInputWidth(usernameInputRef.current.clientWidth);
      }
    };

    updateWidth();

    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  /*
   * Measure the actual rendered width of the username.
   *
   * This is better than using username.length because:
   *
   * "iiiiiiii"
   *
   * and
   *
   * "WWWWWWWW"
   *
   * have different visual widths.
   */
  useEffect(() => {
    if (measureRef.current) {
      setUsernameTextWidth(measureRef.current.getBoundingClientRect().width);
    }
  }, [formData.username]);

  /*
   * Calculate how far the username has travelled
   * through the usable width of the input.
   *
   * 0   = beginning
   * 0.5 = halfway
   * 1   = maximum
   */
  const usernameUsableWidth = Math.max(usernameInputWidth - 32, 1);

  const glanceProgress = Math.min(usernameTextWidth / usernameUsableWidth, 1);

  /* -------------------------------------------------------------- */
  /* Session expired message                                        */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    const message = searchParams.get("message");

    if (message === "session_expired") {
      setError("會話已過期，請重新登錄");
    }
  }, [searchParams]);

  /* -------------------------------------------------------------- */
  /* Already logged in                                              */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  /* -------------------------------------------------------------- */
  /* Input                                                          */
  /* -------------------------------------------------------------- */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    /*
     * If the user edits the username while an
     * old login error is displayed, remove it.
     */
    if (name === "username" && error) {
      setError("");
    }
  };

  /* -------------------------------------------------------------- */
  /* Login                                                          */
  /* -------------------------------------------------------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(withBasePath("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <motion.div
        className="w-full max-w-sm rounded-2xl bg-white px-8 py-10 shadow-sm"
        initial={{
          opacity: 0,
          y: 24,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* -------------------------------------------------------- */}
        {/* Avatar                                                   */}
        {/* -------------------------------------------------------- */}

        <LoginAvatar
          glanceProgress={glanceProgress}

          coveringEyes={passwordFocused}
        />

        {/* -------------------------------------------------------- */}
        {/* Form                                                     */}
        {/* -------------------------------------------------------- */}

        <motion.form
          className="mt-8 space-y-5"
          onSubmit={handleSubmit}
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.15,
            duration: 0.35,
          }}
        >
          {/* ------------------------------------------------------ */}
          {/* Username                                               */}
          {/* ------------------------------------------------------ */}

          <motion.div
            initial={{
              opacity: 0,
              x: -8,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 0.2,
            }}
          >
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-semibold text-[#1B4965]"
            >
              使用者名稱
            </label>

            {/*
             * Hidden text measurement element.
             *
             * It uses the same text size as the input so that
             * its width represents the actual rendered username.
             */}
            <span
              ref={measureRef}
              className="pointer-events-none absolute invisible whitespace-pre text-base"
              aria-hidden="true"
            >
              {formData.username}
            </span>

            <motion.input
              ref={usernameInputRef}
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
              whileFocus={{
                scale: 1.01,
              }}
              transition={{
                duration: 0.15,
              }}
            />
          </motion.div>

          {/* ------------------------------------------------------ */}
          {/* Password                                               */}
          {/* ------------------------------------------------------ */}

          <motion.div
            initial={{
              opacity: 0,
              x: -8,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 0.27,
            }}
          >
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-semibold text-[#1B4965]"
            >
              密碼
            </label>

            <motion.input
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
              whileFocus={{
                scale: 1.01,
              }}
              transition={{
                duration: 0.15,
              }}
            />
          </motion.div>

          {/* ------------------------------------------------------ */}
          {/* Error                                                  */}
          {/* ------------------------------------------------------ */}

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{
                  opacity: 0,
                  height: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  y: -5,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="overflow-hidden text-center text-sm text-red-600"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ------------------------------------------------------ */}
          {/* Login button                                           */}
          {/* ------------------------------------------------------ */}

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#4FA8D8] py-3 text-base font-semibold text-white transition hover:bg-[#3d92c2] disabled:cursor-not-allowed disabled:bg-[#9FD3EC]"
            whileHover={
              !loading
                ? {
                    scale: 1.015,
                  }
                : undefined
            }
            whileTap={
              !loading
                ? {
                    scale: 0.98,
                  }
                : undefined
            }
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.span
                  key="loading"
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  className="inline-flex items-center gap-2"
                >
                  <motion.span
                    className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  登錄中...
                </motion.span>
              ) : (
                <motion.span
                  key="login"
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                >
                  Log in
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.div
            className="pt-12 text-center text-xs text-slate-300"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.4,
            }}
          >
            <a
              href="https://inanin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-slate-500 hover:underline"
            >
              by iNandiN management Ltd
            </a>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
