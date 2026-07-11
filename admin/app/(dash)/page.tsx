import { getStats, usersByMonth, storageByType, pagesBySpace } from "@/lib/queries";
import { StatTile, Card, PageTitle } from "@/components/ui";
import { UsersArea, SpaceBars, StoragePie } from "@/components/Charts";
import { bytes } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const [stats, byMonth, byType, bySpace] = await Promise.all([
    getStats(), usersByMonth(), storageByType(), pagesBySpace(),
  ]);

  return (
    <div>
      <PageTitle title="Resumen" subtitle="Visión general de la app" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <StatTile label="Usuarios" value={stats.users} sub={stats.deactivated ? `${stats.deactivated} desactivados` : "activos"} />
        <StatTile label="Documentos" value={stats.pages} sub={`${stats.spaces} espacios`} />
        <StatTile label="Archivos" value={stats.files} />
        <StatTile label="Almacenamiento" value={bytes(stats.storageBytes)} sub="uso en disco" />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Card title="Usuarios por mes">
          <UsersArea data={byMonth.map((r: any) => ({ month: r.month, count: Number(r.count) }))} />
        </Card>
        <Card title="Almacenamiento por tipo">
          <StoragePie data={byType.map((r: any) => ({ kind: r.kind, bytes: Number(r.bytes), count: Number(r.count) }))} />
        </Card>
        <Card title="Documentos por espacio">
          <SpaceBars data={bySpace.map((r: any) => ({ space: r.space, count: Number(r.count) }))} />
        </Card>
        <Card title="Detalle de almacenamiento">
          <div className="space-y-2 text-sm">
            <Row k="Tamaño en base de datos" v={bytes(stats.fileBytes)} />
            <Row k="Tamaño en disco" v={bytes(stats.diskBytes)} />
            <Row k="Nº de archivos" v={String(stats.files)} />
            <Row k="Nº de páginas" v={String(stats.pages)} />
            <Row k="Nº de espacios" v={String(stats.spaces)} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-notion-border last:border-0">
      <span className="text-notion-muted">{k}</span>
      <span className="font-medium tabular-nums">{v}</span>
    </div>
  );
}
