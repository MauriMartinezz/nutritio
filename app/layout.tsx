import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Suspense } from "react";
import { AppNav, Brand } from "@/modules/identity/components/app-nav";
import { themeInitScript } from "@/modules/theme/theme";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Nutritio",
  description: "Nutrition plans and progress tracking for nutritionists and their clients",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
      // The theme script sets data-theme before hydration.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col md:flex-row">
        {/* Sidebar on desktop (240px), top bar on mobile. */}
        <nav
          aria-label="Main"
          className="relative flex flex-col gap-4 border-b border-line bg-surface px-4 py-4 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:gap-8 md:border-r md:border-b-0 md:px-[18px] md:py-7"
        >
          <Brand />
          <Suspense fallback={null}>
            <AppNav />
          </Suspense>
        </nav>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
