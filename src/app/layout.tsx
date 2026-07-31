import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { signOut } from "@/auth";
import { Sidebar } from "@/components/ui/sidebar";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Greenleaf",
  description: "Household utility bill splitting",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  async function doSignOut() {
    'use server'
    await signOut({ redirectTo: '/signin' })
  }

  return (
    <html lang="en" className={`${bricolage.variable} h-full antialiased`}>
      <body className="font-sans antialiased">
        <div className="flex min-h-dvh">
          <Sidebar signOutAction={doSignOut} />
          <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-10 md:pb-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
