// src/services/locale.ts
"use server";

import { cookies } from "next/headers";
import { Locale, defaultLocale, locales } from "@/i18n/config";

const COOKIE_NAME = "NEXT_LOCALE";

export async function getUserLocale(): Promise<Locale> {
    const cookie = await cookies();
    const stored = cookie.get(COOKIE_NAME)?.value;
    return locales.includes(stored as Locale) ? (stored as Locale) : defaultLocale;
}

export async function setUserLocale(locale: Locale) {
    (await cookies()).set(COOKIE_NAME, locale);
}