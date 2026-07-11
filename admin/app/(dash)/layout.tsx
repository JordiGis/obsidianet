import Sidebar from "@/components/Sidebar";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  const docmostUrl = process.env.DOCMOST_URL || "http://localhost:3000";
  return (
    <div className="flex min-h-screen bg-white text-notion-text">
      <Sidebar docmostUrl={docmostUrl} />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
