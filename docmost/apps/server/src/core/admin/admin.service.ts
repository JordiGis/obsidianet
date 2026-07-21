import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB } from '@docmost/db/types/kysely.types';
import { sql } from 'kysely';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  // ─────────────────────────── stats / overview ──────────────────────────────
  async getStats(workspaceId: string) {
    const row = await this.db
      .selectFrom('users')
      .select((eb) => [
        this.db
          .selectFrom('users')
          .select(eb.fn.countAll<number>().as('c'))
          .where('deletedAt', 'is', null)
          .as('users'),
        this.db
          .selectFrom('users')
          .select(eb.fn.countAll<number>().as('c'))
          .where('deletedAt', 'is', null)
          .where('deactivatedAt', 'is not', null)
          .as('deactivated'),
        this.db
          .selectFrom('pages')
          .select(eb.fn.countAll<number>().as('c'))
          .where('deletedAt', 'is', null)
          .where('workspaceId', '=', workspaceId)
          .as('pages'),
        this.db
          .selectFrom('spaces')
          .select(eb.fn.countAll<number>().as('c'))
          .where('deletedAt', 'is', null)
          .where('workspaceId', '=', workspaceId)
          .as('spaces'),
        this.db
          .selectFrom('attachments')
          .select(eb.fn.countAll<number>().as('c'))
          .where('deletedAt', 'is', null)
          .where('workspaceId', '=', workspaceId)
          .as('files'),
        this.db
          .selectFrom('attachments')
          .select(sql<number>`coalesce(sum(file_size),0)::bigint`.as('s'))
          .where('deletedAt', 'is', null)
          .where('workspaceId', '=', workspaceId)
          .as('fileBytes'),
      ])
      .where('deletedAt', 'is', null)
      .where('workspaceId', '=', workspaceId)
      .executeTakeFirst();

    return {
      users: Number(row?.users ?? 0),
      deactivated: Number(row?.deactivated ?? 0),
      pages: Number(row?.pages ?? 0),
      spaces: Number(row?.spaces ?? 0),
      files: Number(row?.files ?? 0),
      fileBytes: Number(row?.fileBytes ?? 0),
    };
  }

  // charts
  async usersByMonth(workspaceId: string) {
    return this.db
      .selectFrom('users')
      .select([
        sql<string>`to_char(date_trunc('month', created_at), 'YYYY-MM')`.as(
          'month',
        ),
        sql<number>`count(*)::int`.as('count'),
      ])
      .where('deletedAt', 'is', null)
      .where('workspaceId', '=', workspaceId)
      .groupBy(sql`1`)
      .orderBy(sql`1`)
      .execute();
  }

  async storageByType(workspaceId: string) {
    return this.db
      .selectFrom('attachments')
      .select([
        sql<string>`coalesce(nullif(split_part(mime_type,'/',1),''),'other')`.as(
          'kind',
        ),
        sql<number>`coalesce(sum(file_size),0)::bigint`.as('bytes'),
        sql<number>`count(*)::int`.as('count'),
      ])
      .where('deletedAt', 'is', null)
      .where('workspaceId', '=', workspaceId)
      .groupBy(sql`1`)
      .orderBy(sql`2 desc`)
      .execute();
  }

  async pagesBySpace(workspaceId: string) {
    return this.db
      .selectFrom('pages')
      .leftJoin('spaces', 'spaces.id', 'pages.spaceId')
      .select([
        sql<string>`coalesce(spaces.name,'(none)')`.as('space'),
        sql<number>`count(pages.id)::int`.as('count'),
      ])
      .where('pages.deletedAt', 'is', null)
      .where('pages.workspaceId', '=', workspaceId)
      .groupBy(sql`1`)
      .orderBy(sql`2 desc`)
      .limit(12)
      .execute();
  }

  // ─────────────────────────── users ─────────────────────────────────────────
  async listUsers(workspaceId: string) {
    return this.db
      .selectFrom('users')
      .select([
        'id',
        'name',
        'email',
        'role',
        'avatarUrl',
        'lastLoginAt',
        'deactivatedAt',
        'createdAt',
      ])
      .where('deletedAt', 'is', null)
      .where('workspaceId', '=', workspaceId)
      .orderBy('createdAt', 'desc')
      .execute();
  }

  async createUser(
    input: {
      name: string;
      email: string;
      password: string;
      role: string;
    },
    workspaceId: string,
  ) {
    const email = input.email.trim().toLowerCase();
    const name = (input.name || '').trim() || email.split('@')[0];
    const role = ['owner', 'admin', 'member'].includes(input.role)
      ? input.role
      : 'member';
    const hash = await bcrypt.hash(input.password, 12);

    // find default space
    const ws = await this.db
      .selectFrom('workspaces')
      .select(['id', 'defaultSpaceId'])
      .where('id', '=', workspaceId)
      .executeTakeFirst();
    if (!ws) throw new BadRequestException('Workspace not found');

    const dup = await this.db
      .selectFrom('users')
      .select('id')
      .where(sql`LOWER(email)`, '=', sql`LOWER(${email})`)
      .where('workspaceId', '=', workspaceId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
    if (dup) throw new BadRequestException('A user with this email already exists in this workspace');

    const [u] = await this.db
      .insertInto('users')
      .values({
        name,
        email,
        password: hash,
        role,
        workspaceId,
        emailVerifiedAt: new Date(),
        hasGeneratedPassword: false,
      })
      .returning('id')
      .execute();

    if (ws.defaultSpaceId) {
      await this.db
        .insertInto('spaceMembers')
        .values({
          userId: u.id,
          spaceId: ws.defaultSpaceId,
          role: 'member',
        })
        .execute();
    }

    return { id: u.id };
  }

  async setUserActive(
    userId: string,
    active: boolean,
    workspaceId: string,
  ) {
    await this.db
      .updateTable('users')
      .set({
        deactivatedAt: active ? null : new Date(),
        updatedAt: new Date(),
      })
      .where('id', '=', userId)
      .where('workspaceId', '=', workspaceId)
      .where('deletedAt', 'is', null)
      .execute();
  }

  async deleteUser(userId: string, workspaceId: string) {
    // guard: never delete the last owner
    const owner = await this.db
      .selectFrom('users')
      .select('role')
      .where('id', '=', userId)
      .where('workspaceId', '=', workspaceId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
    if (owner?.role === 'owner') {
      const c = await this.db
        .selectFrom('users')
        .select(sql<number>`count(*)::int`.as('n'))
        .where('role', '=', 'owner')
        .where('workspaceId', '=', workspaceId)
        .where('deletedAt', 'is', null)
        .executeTakeFirst();
      if (Number(c?.n ?? 0) <= 1)
        throw new ForbiddenException('Cannot delete the last owner');
    }

    await this.db
      .updateTable('users')
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where('id', '=', userId)
      .where('workspaceId', '=', workspaceId)
      .execute();
  }

  // ─────────────────────────── pages ─────────────────────────────────────────
  async listPages(workspaceId: string) {
    return this.db
      .selectFrom('pages')
      .leftJoin('spaces', 'spaces.id', 'pages.spaceId')
      .leftJoin('users', 'users.id', 'pages.creatorId')
      .select([
        'pages.id',
        'pages.title',
        'pages.icon',
        'pages.slugId',
        'pages.updatedAt',
        'pages.createdAt',
        'spaces.name as spaceName',
        'users.name as creatorName',
      ])
      .where('pages.deletedAt', 'is', null)
      .where('pages.workspaceId', '=', workspaceId)
      .orderBy('pages.updatedAt', 'desc')
      .limit(500)
      .execute();
  }

  // ─────────────────────────── files / attachments ───────────────────────────
  async listFiles(workspaceId: string) {
    return this.db
      .selectFrom('attachments')
      .leftJoin('spaces', 'spaces.id', 'attachments.spaceId')
      .leftJoin('users', 'users.id', 'attachments.creatorId')
      .select([
        'attachments.id',
        'attachments.fileName',
        'attachments.fileSize',
        'attachments.mimeType',
        'attachments.type',
        'attachments.createdAt',
        'attachments.filePath',
        'spaces.name as spaceName',
        'users.name as creatorName',
        'attachments.pageId',
      ])
      .where('attachments.deletedAt', 'is', null)
      .where('attachments.workspaceId', '=', workspaceId)
      .orderBy('attachments.createdAt', 'desc')
      .limit(500)
      .execute();
  }

  async getAttachment(
    id: string,
    workspaceId: string,
  ): Promise<{ filePath: string; mimeType: string; fileName: string } | null> {
    const a = await this.db
      .selectFrom('attachments')
      .select(['filePath', 'mimeType', 'fileName'])
      .where('id', '=', id)
      .where('workspaceId', '=', workspaceId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
    return a ?? null;
  }
}
