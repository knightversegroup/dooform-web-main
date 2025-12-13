import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      {/* Header */}
      <header className="h-11 flex items-center px-4">
        <Link href="/" className="inline-block">
          <Image src="/logo.svg" alt="Dooform" width={80} height={16} />
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="h-11 flex items-center justify-center">
        <p className="text-[10px] text-black/30">
          © {new Date().getFullYear()} Dooform
        </p>
      </footer>
    </div>
  );
}
