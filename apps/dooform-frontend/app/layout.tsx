import {
  IBM_Plex_Sans_Thai,
  IBM_Plex_Sans_Thai_Looped,
  Prompt,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@dooform/shared/auth/context";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-sans-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexSansThaiLooped = IBM_Plex_Sans_Thai_Looped({
  variable: "--font-ibm-plex-sans-thai-looped",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
});

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="light" style={{ colorScheme: "light" }}>
      <body
        className={`${ibmPlexSansThai.variable} ${ibmPlexSansThaiLooped.variable} ${prompt.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
