import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { signOut } from "@/auth";
import { Sidebar } from "@/components/ui/sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "greenleaf",
  description: "Household utility bill splitting",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = (await cookies()).get("theme")?.value;

  async function doSignOut() {
    'use server'
    await signOut({ redirectTo: '/signin' })
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${
        theme === "light" ? "" : "dark"
      }`}
    >
      <body className="antialiased">
        <div className="flex min-h-dvh">
          <Sidebar signOutAction={doSignOut} />
          <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-10 md:pb-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
