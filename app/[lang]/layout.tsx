import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { lang } from "next/root-params";
import { Suspense } from "react";
import { LocaleProvider } from "@/lib/i18n/client";
import { LOCALES, isLocale, DEFAULT_LOCALE } from "@/lib/i18n/negotiate";
import { getMessages } from "@/lib/i18n/server";
import { navMessages } from "@/modules/identity/nav-messages";
import { AppNav } from "@/modules/identity/components/app-nav";
import { themeInitScript } from "@/modules/theme/theme";
import { Toast } from "@/modules/ui/components/toast";
import "../globals.css";

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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages(navMessages);
  return { title: "Nutritio", description: t.appDescription };
}

// Both languages are prerendered; proxy.ts picks one per request.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ lang: locale }));
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const value = await lang();
  const locale = isLocale(value) ? value : DEFAULT_LOCALE;
  return (
    <html
      lang={locale}
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
      // The theme script sets data-theme before hydration.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col md:flex-row">
        <LocaleProvider locale={locale}>
        {/* Signed in only: sidebar on desktop (240px), top bar on mobile. */}
        <Suspense fallback={null}>
          <AppNav />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        <Suspense fallback={null}>
          <Toast />
        </Suspense>
        </LocaleProvider>
      </body>
    </html>
  );
}
