import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { auth, signOut } from "@/auth";
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

  const session = await auth()
  const userInitial =
    session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase()

  return (
    <html lang="en" className={`${bricolage.variable} h-full antialiased`}>
      <body className="font-sans antialiased">
        <div className="flex min-h-dvh">
          <Sidebar signOutAction={doSignOut} userInitial={userInitial} />
          <main className="min-w-0 flex-1 px-4 pb-[100px] pt-5 rail:px-9 rail:py-8">
            <div className="mx-auto max-w-[1200px]">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
