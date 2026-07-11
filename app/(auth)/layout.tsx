export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex-1 flex flex-col min-h-dvh w-screen bg-obsidian text-on-surface">
      {children}
    </div>
  );
}
