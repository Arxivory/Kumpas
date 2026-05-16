import { Controller, Post, Get, Body, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateProfileDto } from './dto/create-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('profile')
  async syncUserProfile(@Body() createProfileDto: CreateProfileDto) {
    const profile = await this.usersService.syncProfile(createProfileDto);
    return {
      success: true,
      message: 'User profile synchronized successfully.',
      user: profile,
    };
  }

  @Get('profile/:id')
  async getUserProfile(@Param('id') id: string) {
    const user = await this.usersService.getProfile(id);
    if (!user) {
      throw new NotFoundException(`User profile with ID ${id} not found.`);
    }
    return user;
  }
}