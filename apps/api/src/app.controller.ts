import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('test-db')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

}