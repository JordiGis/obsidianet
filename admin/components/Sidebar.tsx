"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "Resumen", icon: "📊" },
  { href: "/users", label: "Usuarios", icon: "👥" },
  { href: "/documents", label: "Documentos", icon: "📄" },
  { href: "/files", label: "Archivos", icon: "🖼️" },
];

export default function Sidebar({ docmostUrl }: { docmostUrl: string }) {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 bg-notion-sidebar border-r border-notion-border flex flex-col h-screen sticky top-0">
      <div className="px-4 py-4 flex items-center gap-2 border-b border-notion-border">
        <span className="text-lg">🗄️</span>
        <div>
          <div className="text-sm font-semibold text-notion-text leading-tight">obsidianet</div>
          <div className="text-[11px] text-notion-muted">admin</div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                active ? "bg-notion-hover text-notion-text font-medium" : "text-notion-muted hover:bg-notion-hover"
              }`}
            >
              <span className="text-base">{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-notion-border space-y-0.5">
        <a
          href={docmostUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-notion-muted hover:bg-notion-hover"
        >
          <span className="text-base">↗</span> Abrir la app
        </a>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-notion-muted hover:bg-notion-hover"
        >
          <span className="text-base">⎋</span> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
