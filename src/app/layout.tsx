import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventory",
  description: "Shoe & clothing resale inventory",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} min-h-screen font-mono text-bp-text antialiased`}>
        <header className="sticky top-0 z-10 border-b border-bp-line bg-bp-bg/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.2em]">
              <span className="grid h-7 w-9 place-items-center border border-bp-accent/70 text-[10px] tracking-normal text-bp-accent">INV</span>
              <span>Inventory</span>
              <span className="hidden text-bp-muted/70 sm:inline">/ Sheet 01</span>
            </Link>
            <Link href="/items/new" className="rounded-sm border border-bp-accent/70 bg-bp-accent/15 px-3.5 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-bp-accent hover:bg-bp-accent/25">
              + Add item
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
