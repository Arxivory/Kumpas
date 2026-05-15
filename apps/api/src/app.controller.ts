import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('test-db')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('seed-vince')
  async seedTestUser() {
    try {
      const testUser = await this.prisma.user.upsert({
        where: { email: 'vince.test@kumpas.dev' },
        update: {},
        create: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          email: 'vince.test@kumpas.dev',
          username: 'vince_monorepo_test',
          firstName: 'Vince',
          lastName: 'Dev',
        },
      });
      
      return {
        status: 'Success!',
        message: 'NestJS successfully talked to Supabase using Prisma 7!',
        data: testUser,
      };
    } catch (error) {
      return {
        status: 'Database Connection Error',
        error: error.message,
      };
    }
  }
}