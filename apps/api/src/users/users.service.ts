import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async syncProfile(dto: CreateProfileDto) {
    try {
      return await this.prisma.user.upsert({
        where: { id: dto.id },
        update: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          ...(dto.username && { username: dto.username }),
        },
        create: {
          id: dto.id,
          email: dto.email,
          username: dto.username || `user_${Math.random().toString(36).substring(2, 7)}`,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Username or email already exists in the system.');
      }
      throw error;
    }
  }

  async getProfile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}