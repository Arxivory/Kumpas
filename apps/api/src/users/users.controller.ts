import { Controller, Post, Get, Body, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './get-user.decorator';

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

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getUserProfile(@GetUser() authenticatedUser: { userId: string }) {
    return this.usersService.getProfile(authenticatedUser.userId);
  }
}