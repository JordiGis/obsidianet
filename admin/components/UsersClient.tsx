"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageTitle } from "./ui";

type U = {
  id: string; name: string; email: string; role: string;
  last_login_at: string | null; deactivated_at: string | null; created_at: string;
};

function ago(d: string | null) {
  if (!d) return "—";
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d`;
  return new Date(d).toLocaleDateString();
}

const roleBadge: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  member: "bg-gray-100 text-gray-600",
};

export default function UsersClient({ initial }: { initial: U[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageTitle
        title="Usuarios"
        subtitle={`${initial.length} usuarios · creados solo por el admin`}
        action={
          <button onClick={() => setOpen(true)} className="px-3 py-1.5 rounded-md bg-notion-blue text-white text-sm font-medium hover:opacity-90">
            + Crear usuario
          </button>
        }
      />

      <div className="bg-white border border-notion-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-notion-muted border-b border-notion-border">
              <th className="px-4 py-2.5 font-medium">Nombre</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Rol</th>
              <th className="px-4 py-2.5 font-medium">Últ. acceso</th>
              <th className="px-4 py-2.5 font-medium">Estado</th>
              <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {initial.map((u) => (
              <tr key={u.id} className="border-b border-notion-border last:border-0 hover:bg-notion-hover/50">
                <td className="px-4 py-2.5 font-medium">{u.name || "—"}</td>
                <td className="px-4 py-2.5 text-notion-muted">{u.email}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleBadge[u.role] || roleBadge.member}`}>{u.role}</span>
                </td>
                <td className="px-4 py-2.5 text-notion-muted">{ago(u.last_login_at)}</td>
                <td className="px-4 py-2.5">
                  {u.deactivated_at
                    ? <span className="text-xs text-red-600">Desactivado</span>
                    : <span className="text-xs text-green-600">Activo</span>}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <RowActions u={u} onDone={() => router.refresh()} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && <CreateModal onClose={() => setOpen(false)} onDone={() => { setOpen(false); router.refresh(); }} />}
    </div>
  );
}

function RowActions({ u, onDone }: { u: U; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !!u.deactivated_at }),
    });
    setBusy(false); onDone();
  }
  async function del() {
    if (!confirm(`¿Eliminar a ${u.email}? Se borran sus accesos.`)) return;
    setBusy(true);
    const r = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    setBusy(false);
    if (!r.ok) { const j = await r.json().catch(() => ({})); alert(j.error || "Error"); return; }
    onDone();
  }
  return (
    <span className="inline-flex gap-2">
      <button disabled={busy} onClick={toggle} className="text-xs text-notion-muted hover:text-notion-text">
        {u.deactivated_at ? "Activar" : "Desactivar"}
      </button>
      <button disabled={busy} onClick={del} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
    </span>
  );
}

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ name: "", email: "", password: "", role: "member" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function gen() {
    const p = Array.from(crypto.getRandomValues(new Uint8Array(12))).map((b) => "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789".charAt(b % 56)).join("");
    setF({ ...f, password: p });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    });
    setBusy(false);
    if (r.ok) onDone();
    else { const j = await r.json().catch(() => ({})); setErr(j.error || "Error"); }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-notion-border w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Crear usuario</h2>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nombre">
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="inp" placeholder="Opcional" />
          </Field>
          <Field label="Email *">
            <input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="inp" />
          </Field>
          <Field label="Contraseña *">
            <div className="flex gap-2">
              <input required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="inp flex-1" placeholder="mín. 8 caracteres" />
              <button type="button" onClick={gen} className="px-2 rounded-md border border-notion-border text-xs hover:bg-notion-hover">Generar</button>
            </div>
          </Field>
          <Field label="Rol">
            <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} className="inp">
              <option value="member">member</option>
              <option value="admin">admin</option>
              <option value="owner">owner</option>
            </select>
          </Field>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md text-sm text-notion-muted hover:bg-notion-hover">Cancelar</button>
            <button disabled={busy} className="px-3 py-1.5 rounded-md bg-notion-blue text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {busy ? "Creando…" : "Crear"}
            </button>
          </div>
        </form>
      </div>
      <style>{`.inp{width:100%;padding:0.5rem 0.75rem;border:1px solid #e9e8e4;border-radius:0.375rem;font-size:0.875rem;outline:none}.inp:focus{border-color:#2383e2}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-notion-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
