// src/i18n/config.ts
export const locales = ["en", "zh-HK", "zh-CN"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "zh-HK";