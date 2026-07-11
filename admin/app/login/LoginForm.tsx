"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setBusy(false);
    if (r.ok) { router.push("/"); router.refresh(); }
    else setErr("Usuario o contraseña incorrectos");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-notion-muted mb-1">Usuario</label>
        <input
          autoFocus value={username} onChange={(e) => setU(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-notion-border focus:border-notion-blue outline-none text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-notion-muted mb-1">Contraseña</label>
        <input
          type="password" value={password} onChange={(e) => setP(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-notion-border focus:border-notion-blue outline-none text-sm"
        />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button
        disabled={busy}
        className="w-full py-2 rounded-md bg-notion-blue text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
