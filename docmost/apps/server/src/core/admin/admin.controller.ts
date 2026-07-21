import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthWorkspace } from '../../common/decorators/auth-workspace.decorator';
import { User, Workspace } from '@docmost/db/types/entity.types';
import { FastifyReply } from 'fastify';
import { promises as fs } from 'fs';
import * as path from 'path';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  private storageRoot: string;

  constructor(private readonly adminService: AdminService) {
    this.storageRoot = process.env.STORAGE_PATH || '/app/data/storage';
  }

  private checkAdmin(user: User) {
    if (user.role !== 'owner' && user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
  }

  // ─────────────────────────── dashboard stats ───────────────────────────────

  @HttpCode(HttpStatus.OK)
  @Post('stats')
  async getStats(
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    this.checkAdmin(user);
    return this.adminService.getStats(workspace.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('stats/charts')
  async getChartData(
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    this.checkAdmin(user);
    const [usersByMonth, storageByType, pagesBySpace] = await Promise.all([
      this.adminService.usersByMonth(workspace.id),
      this.adminService.storageByType(workspace.id),
      this.adminService.pagesBySpace(workspace.id),
    ]);
    return { usersByMonth, storageByType, pagesBySpace };
  }

  // ─────────────────────────── users ─────────────────────────────────────────

  @HttpCode(HttpStatus.OK)
  @Post('users')
  async listUsers(
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    this.checkAdmin(user);
    return this.adminService.listUsers(workspace.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('users/create')
  async createUser(
    @Body()
    body: { name?: string; email: string; password: string; role?: string },
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    this.checkAdmin(user);
    if (!body.email || !body.password) {
      throw new ForbiddenException('Email and password are required');
    }
    if (String(body.password).length < 8) {
      throw new ForbiddenException('Password must be at least 8 characters');
    }
    return this.adminService.createUser(
      {
        name: body.name || '',
        email: body.email,
        password: body.password,
        role: body.role || 'member',
      },
      workspace.id,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('users/toggle-active')
  async toggleUserActive(
    @Body() body: { userId: string; active: boolean },
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    this.checkAdmin(user);
    if (!body.userId) throw new ForbiddenException('userId is required');
    await this.adminService.setUserActive(
      body.userId,
      body.active,
      workspace.id,
    );
    return { ok: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('users/delete')
  async deleteUser(
    @Body() body: { userId: string },
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    this.checkAdmin(user);
    if (!body.userId) throw new ForbiddenException('userId is required');
    await this.adminService.deleteUser(body.userId, workspace.id);
    return { ok: true };
  }

  // ─────────────────────────── pages ─────────────────────────────────────────

  @HttpCode(HttpStatus.OK)
  @Post('pages')
  async listPages(
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    this.checkAdmin(user);
    return this.adminService.listPages(workspace.id);
  }

  // ─────────────────────────── storage per user ──────────────────────────────

  @HttpCode(HttpStatus.OK)
  @Post('storage-by-user')
  async getStorageByUser(
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    this.checkAdmin(user);
    return this.adminService.storageByUser(workspace.id);
  }

  // ─────────────────────────── files / attachments ───────────────────────────

  @HttpCode(HttpStatus.OK)
  @Post('files')
  async listFiles(
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    this.checkAdmin(user);
    return this.adminService.listFiles(workspace.id);
  }

  @Get('files/:id')
  async getFile(
    @Param('id') id: string,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    this.checkAdmin(user);
    const attachment = await this.adminService.getAttachment(id, workspace.id);
    if (!attachment) {
      throw new NotFoundException('File not found');
    }

    const rel = attachment.filePath.replace(/^\/+/, '');
    const full = path.resolve(this.storageRoot, rel);

    if (!full.startsWith(path.resolve(this.storageRoot))) {
      throw new ForbiddenException('Access denied');
    }

    try {
      const data = await fs.readFile(full);
      res.header('Content-Type', attachment.mimeType || 'application/octet-stream');
      res.header('Cache-Control', 'private, max-age=300');
      return res.send(data);
    } catch {
      throw new NotFoundException('File not available on disk');
    }
  }
}
