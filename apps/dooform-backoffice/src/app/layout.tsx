import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./global.css";
import { AuthProvider } from "@dooform/shared/auth/context";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-sans-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Dooform Backoffice",
  description: "Admin console for Dooform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="light" style={{ colorScheme: "light" }}>
      <body className={`${ibmPlexSansThai.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
