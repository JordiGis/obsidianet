import { listPages } from "@/lib/queries";
import { PageTitle } from "@/components/ui";
import { ago } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const pages = await listPages();
  const docmost = process.env.DOCMOST_URL || "http://localhost:3000";

  return (
    <div>
      <PageTitle title="Documentos" subtitle={`${pages.length} páginas`} />
      <div className="bg-white border border-notion-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-notion-muted border-b border-notion-border">
              <th className="px-4 py-2.5 font-medium">Título</th>
              <th className="px-4 py-2.5 font-medium">Espacio</th>
              <th className="px-4 py-2.5 font-medium">Autor</th>
              <th className="px-4 py-2.5 font-medium">Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-notion-muted">Sin documentos todavía</td></tr>
            )}
            {pages.map((p: any) => (
              <tr key={p.id} className="border-b border-notion-border last:border-0 hover:bg-notion-hover/50">
                <td className="px-4 py-2.5 font-medium">
                  <a href={`${docmost}/s/${p.slug_id || ""}`} target="_blank" rel="noreferrer" className="hover:text-notion-blue">
                    <span className="mr-1.5">{p.icon || "📄"}</span>{p.title || "Sin título"}
                  </a>
                </td>
                <td className="px-4 py-2.5 text-notion-muted">{p.space || "—"}</td>
                <td className="px-4 py-2.5 text-notion-muted">{p.creator || "—"}</td>
                <td className="px-4 py-2.5 text-notion-muted">{ago(p.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
