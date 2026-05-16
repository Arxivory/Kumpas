// apps/api/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('test-db')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('seed-vince')
  async seedTestUser() {
    try {
      // Let's use a simple, clean findFirst check to verify reading capabilities first!
      // This eliminates payload validation friction entirely.
      const existingUsers = await this.prisma.user.findMany({
        take: 1,
      });
      
      return {
        status: 'Connection Validated!',
        message: 'NestJS is actively querying your remote Supabase instance.',
        countRetrieved: existingUsers.length,
        snapshot: existingUsers,
      };
    } catch (error) {
      return {
        status: 'Database Request Evaluated but Rejected',
        message: error.message,
        // This will print out the exact code (e.g., P2002, P2012) telling us exactly which column failed
        prismaErrorCode: error.code, 
        meta: error.meta,
      };
    }
  }
}