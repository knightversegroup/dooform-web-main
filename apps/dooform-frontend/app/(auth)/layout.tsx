export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      <div className="w-full py-4 md:py-8 flex flex-col min-h-screen">
        <div className="flex-1 max-w-md mx-auto flex flex-col px-4 sm:px-6 w-full">
          {children}
        </div>
        <div className="text-center text-sm text-muted-foreground py-4 px-4">
          © {new Date().getFullYear()} Dooform - All rights reserved.
        </div>
      </div>
    </div>
  );
}
