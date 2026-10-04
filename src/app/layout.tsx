import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const roman = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-roman",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SiloFocus",
  description: "A distraction-free, AI-assisted study companion.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#1C1614" },
  ],
};

/** Applies the persisted palette before first paint to avoid a theme flash. Keep in sync with useThemeStore. */
const THEME_BOOT_SCRIPT = `(function(){var r=document.documentElement;try{var s=JSON.parse(localStorage.getItem('silofocus-theme-v2')||'{}');var P=['heritage','dark-academia','wabi-sabi','nordic','obsidian'];var p=P.indexOf(s.palette)>-1?s.palette:'heritage';r.setAttribute('data-palette',p);if(['serif','sans','roman'].indexOf(s.headingFont)>-1)r.setAttribute('data-heading',s.headingFont);var d=p==='dark-academia'||p==='obsidian';if(d)r.classList.add('dark');r.style.colorScheme=d?'dark':'light';}catch(e){r.setAttribute('data-palette','heritage');}})();`;

const DEFAULT_FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#FAF8F5"/><circle cx="16" cy="16" r="11" fill="none" stroke="#B08D57" stroke-width="4"/></svg>`,
  );

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-palette="heritage"
      suppressHydrationWarning
      className={`${serif.variable} ${sans.variable} ${roman.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <link id="silo-favicon" rel="icon" type="image/svg+xml" href={DEFAULT_FAVICON} />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
