import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import {
  type AdminBlockView,
  AdminBlockService,
} from './admin-block.service.js';
import { CreateBlockDto } from './dto/block.dto.js';

@Controller('api/admin/blocks')
@UseGuards(SessionAuthGuard)
export class AdminBlockController {
  constructor(private readonly blocks: AdminBlockService) {}

  @Get()
  list(): Promise<AdminBlockView[]> {
    return this.blocks.list();
  }

  @Post()
  create(@Body() dto: CreateBlockDto): Promise<{ id: string }> {
    return this.blocks.create(dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ ok: true }> {
    await this.blocks.remove(id);
    return { ok: true };
  }
}
