import { listFiles } from "@/lib/queries";
import { PageTitle } from "@/components/ui";
import { bytes, ago } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  const files = await listFiles();
  const total = files.reduce((a: number, f: any) => a + Number(f.file_size || 0), 0);
  const images = files.filter((f: any) => (f.mime_type || "").startsWith("image/"));

  return (
    <div>
      <PageTitle title="Archivos" subtitle={`${files.length} archivos · ${bytes(total)} · ${images.length} imágenes`} />

      {images.length > 0 && (
        <>
          <div className="text-sm font-medium mb-2">Imágenes</div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
            {images.map((f: any) => (
              <a key={f.id} href={`/api/file/${f.id}`} target="_blank" rel="noreferrer"
                 className="group block border border-notion-border rounded-lg overflow-hidden hover:shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/file/${f.id}`} alt={f.file_name} className="w-full h-24 object-cover bg-notion-sidebar" loading="lazy" />
                <div className="px-2 py-1.5">
                  <div className="text-[11px] truncate">{f.file_name}</div>
                  <div className="text-[10px] text-notion-muted">{bytes(Number(f.file_size))}</div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      <div className="text-sm font-medium mb-2">Todos los archivos</div>
      <div className="bg-white border border-notion-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-notion-muted border-b border-notion-border">
              <th className="px-4 py-2.5 font-medium">Nombre</th>
              <th className="px-4 py-2.5 font-medium">Tipo</th>
              <th className="px-4 py-2.5 font-medium">Tamaño</th>
              <th className="px-4 py-2.5 font-medium">Espacio</th>
              <th className="px-4 py-2.5 font-medium">Subido por</th>
              <th className="px-4 py-2.5 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-notion-muted">Sin archivos todavía</td></tr>
            )}
            {files.map((f: any) => (
              <tr key={f.id} className="border-b border-notion-border last:border-0 hover:bg-notion-hover/50">
                <td className="px-4 py-2.5 font-medium">
                  <a href={`/api/file/${f.id}`} target="_blank" rel="noreferrer" className="hover:text-notion-blue truncate block max-w-xs">{f.file_name}</a>
                </td>
                <td className="px-4 py-2.5 text-notion-muted">{f.mime_type || f.type || "—"}</td>
                <td className="px-4 py-2.5 text-notion-muted tabular-nums">{bytes(Number(f.file_size))}</td>
                <td className="px-4 py-2.5 text-notion-muted">{f.space || "—"}</td>
                <td className="px-4 py-2.5 text-notion-muted">{f.creator || "—"}</td>
                <td className="px-4 py-2.5 text-notion-muted">{ago(f.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
