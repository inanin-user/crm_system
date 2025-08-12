import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalNavigation from "./components/ConditionalNavigation";
import ConditionalMain from "./components/ConditionalMain";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM 系統",
  description: "活動出席管理系統",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${inter.variable} antialiased bg-gray-50`}
      >
        <AuthProvider>
          <SidebarProvider>
            <div 
              className="min-h-screen bg-gray-50"
              style={{
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              <ConditionalNavigation />
              <ConditionalMain>
                {children}
              </ConditionalMain>
            </div>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
