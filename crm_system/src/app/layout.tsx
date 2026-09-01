import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalNavigation from "./components/ConditionalNavigation";
import ConditionalMain from "./components/ConditionalMain";
import MobileClickInitializer from "./components/MobileClickInitializer";
import DebugClickHelper from "./components/DebugClickHelper";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { getUserLocale } from "@/services/locale";
import GPULayerWrapper from "./components/GPULayerWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM 系統",
  description: "活動出席管理系統",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const locale = await getUserLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} antialiased bg-gray-50 gpu-layer`}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <SidebarProvider>
              <MobileClickInitializer />
              <DebugClickHelper />
              <GPULayerWrapper>
                <ConditionalNavigation />
                <ConditionalMain>
                  {children}
                </ConditionalMain>
              </GPULayerWrapper>
            </SidebarProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
