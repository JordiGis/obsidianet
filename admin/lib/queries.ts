import { q } from "./db";
import bcrypt from "bcryptjs";
import { execFile } from "child_process";

// ─────────────────────────── stats / overview ──────────────────────────────
export async function getStats() {
  const [row] = await q<any>(`
    select
      (select count(*) from users where deleted_at is null) as users,
      (select count(*) from users where deleted_at is null and deactivated_at is not null) as deactivated,
      (select count(*) from pages where deleted_at is null) as pages,
      (select count(*) from spaces where deleted_at is null) as spaces,
      (select count(*) from attachments where deleted_at is null) as files,
      (select coalesce(sum(file_size),0) from attachments where deleted_at is null) as file_bytes
  `);
  const disk = await diskBytes();
  return {
    users: Number(row.users),
    deactivated: Number(row.deactivated),
    pages: Number(row.pages),
    spaces: Number(row.spaces),
    files: Number(row.files),
    fileBytes: Number(row.file_bytes),
    diskBytes: disk,
    storageBytes: Math.max(Number(row.file_bytes), disk),
  };
}

function diskBytes(): Promise<number> {
  const path = process.env.STORAGE_PATH || "/docmost-storage";
  return new Promise((resolve) => {
    execFile("du", ["-sk", path], (err, stdout) => {
      if (err) return resolve(0);
      const kb = parseInt(String(stdout).trim().split(/\s+/)[0], 10);
      resolve(Number.isFinite(kb) ? kb * 1024 : 0);
    });
  });
}

// charts
export async function usersByMonth() {
  return q<any>(`
    select to_char(date_trunc('month', created_at), 'YYYY-MM') as month, count(*)::int as count
    from users where deleted_at is null
    group by 1 order by 1
  `);
}
export async function storageByType() {
  return q<any>(`
    select coalesce(nullif(split_part(mime_type,'/',1),''),'other') as kind,
           coalesce(sum(file_size),0)::bigint as bytes, count(*)::int as count
    from attachments where deleted_at is null
    group by 1 order by 2 desc
  `);
}
export async function pagesBySpace() {
  return q<any>(`
    select coalesce(s.name,'(none)') as space, count(p.id)::int as count
    from pages p left join spaces s on s.id = p.space_id
    where p.deleted_at is null
    group by 1 order by 2 desc limit 12
  `);
}

// ─────────────────────────── users ─────────────────────────────────────────
export async function listUsers() {
  return q<any>(`
    select id, name, email, role, avatar_url,
           last_login_at, deactivated_at, created_at
    from users where deleted_at is null
    order by created_at desc
  `);
}

export async function createUser(input: {
  name: string; email: string; password: string; role: string;
}) {
  const email = input.email.trim().toLowerCase();
  const name = (input.name || "").trim() || email.split("@")[0];
  const role = ["owner", "admin", "member"].includes(input.role) ? input.role : "member";
  const hash = await bcrypt.hash(input.password, 12);

  // single-workspace deployment: use the first workspace + its default space
  const [ws] = await q<any>(`select id, default_space_id from workspaces order by created_at asc limit 1`);
  if (!ws) throw new Error("no workspace found");

  const dup = await q<any>(`select 1 from users where lower(email)=$1 and workspace_id=$2 and deleted_at is null`, [email, ws.id]);
  if (dup.length) throw new Error("email already exists");

  const [u] = await q<any>(
    `insert into users (name, email, password, role, workspace_id, email_verified_at, has_generated_password)
     values ($1,$2,$3,$4,$5, now(), false) returning id`,
    [name, email, hash, role, ws.id]
  );
  if (ws.default_space_id) {
    await q(
      `insert into space_members (user_id, space_id, role) values ($1,$2,$3)`,
      [u.id, ws.default_space_id, "member"]
    );
  }
  return { id: u.id };
}

export async function setActive(id: string, active: boolean) {
  await q(`update users set deactivated_at = $2, updated_at = now() where id = $1`, [
    id,
    active ? null : new Date().toISOString(),
  ]);
}

export async function deleteUser(id: string) {
  // guard: never delete the last owner
  const [owner] = await q<any>(`select role from users where id=$1`, [id]);
  if (owner?.role === "owner") {
    const [c] = await q<any>(`select count(*)::int as n from users where role='owner' and deleted_at is null`);
    if (Number(c.n) <= 1) throw new Error("cannot delete the last owner");
  }
  await q(`update users set deleted_at = now(), updated_at = now() where id = $1`, [id]);
}

// ─────────────────────────── documents ─────────────────────────────────────
export async function listPages() {
  return q<any>(`
    select p.id, p.title, p.icon, p.slug_id, p.updated_at, p.created_at,
           s.name as space, u.name as creator
    from pages p
    left join spaces s on s.id = p.space_id
    left join users u on u.id = p.creator_id
    where p.deleted_at is null
    order by p.updated_at desc
    limit 500
  `);
}

// ─────────────────────────── attachments / files ───────────────────────────
export async function listFiles() {
  return q<any>(`
    select a.id, a.file_name, a.file_size, a.mime_type, a.type, a.created_at,
           s.name as space, u.name as creator, a.page_id
    from attachments a
    left join spaces s on s.id = a.space_id
    left join users u on u.id = a.creator_id
    where a.deleted_at is null
    order by a.created_at desc
    limit 500
  `);
}

export async function getAttachmentPath(id: string): Promise<{ file_path: string; mime_type: string; file_name: string } | null> {
  const [a] = await q<any>(`select file_path, mime_type, file_name from attachments where id=$1 and deleted_at is null`, [id]);
  return a || null;
}
