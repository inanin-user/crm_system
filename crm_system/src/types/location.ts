// src/types/location.ts
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export const LocationCode = {
  WC: "WC",
  SM: "SM",
  DM: "DM",
  WTS: "WTS",
} as const;

export type LocationCode = (typeof LocationCode)[keyof typeof LocationCode];
// Client component hook — call inside a "use client" component's render.
export function useLocation() {
  const t = useTranslations("location");
  return {
    label: (code: string): string => {
      try {
        return t(code);
      } catch {
        return code; // unknown code falls back to raw value, never throws
      }
    },
  };
}

// Server component / route handler helper — call with `await`.
export async function getLocation() {
  const t = await getTranslations("location");
  return {
    label: (code: string): string => {
      try {
        return t(code);
      } catch {
        return code;
      }
    },
  };
}