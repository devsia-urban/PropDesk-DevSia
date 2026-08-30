import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981",
};
import { Poppins, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevSia | Best Real Estate CRM & Property Management Software in India",
  description: "DevSia is India's top-rated Real Estate CRM and property management software. Designed for brokers and agencies to automate lead matching, team tracking, and close deals faster.",
  openGraph: {
    title: "DevSia | Best Real Estate CRM & Property Management Software in India",
    description: "DevSia is India's top-rated Real Estate CRM and property management software. Designed for brokers and agencies to automate lead matching, team tracking, and close deals faster.",
    type: "website",
    url: "https://theDevSia.in",
    siteName: "DevSia"
  },
  twitter: {
    card: "summary_large_image",
    title: "DevSia | Best Real Estate CRM & Property Management Software",
    description: "DevSia is India's top-rated Real Estate CRM and property management software."
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DevSia",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "DevSia",
  "operatingSystem": "Web",
  "applicationCategory": "BusinessApplication",
  "description": "The best Real Estate CRM and Property Management Software designed specifically for real estate brokers, property managers, and agencies in India. Manage leads, properties, and teams with AI-powered matching.",
  "offers": {
    "@type": "Offer",
    "price": "499",
    "priceCurrency": "INR"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "1250"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${poppins.variable} ${playfair.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
