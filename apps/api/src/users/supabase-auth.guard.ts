import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/auth/v1/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'ApiKey': process.env.VITE_SUPABASE_ANON_KEY as string,
        },
      });

      if (!response.ok) {
        throw new UnauthorizedException('Invalid or expired remote session');
      }

      const supabaseUser = await response.json();
      
      // Inject the payload into request.user so your custom @GetUser() decorator extracts it seamlessly
      request.user = {
        userId: supabaseUser.id,
        email: supabaseUser.email,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Remote token validation failed');
    }
  }
}