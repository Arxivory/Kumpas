import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private sessionCache = new Map<string, { user: { userId: string; email: string }; expiresAt: number }>();
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];

    const cachedSession = this.sessionCache.get(token);
    if (cachedSession && Date.now() < cachedSession.expiresAt) {
      request.user = cachedSession.user;
      return true;
    }

    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/auth/v1/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'ApiKey': process.env.VITE_SUPABASE_ANON_KEY as string,
          'X-Client-IP': request.ip,
          'User-Agent': request.headers['user-agent'] || ''
        },
      });

      if (!response.ok) {
        throw new UnauthorizedException('Invalid or expired remote session');
      }

      const supabaseUser = await response.json();
      
      request.user = {
        userId: supabaseUser.id,
        email: supabaseUser.email,
      };

      this.sessionCache.set(token, {
        user: request.user,
        expiresAt: Date.now() + 120000,
      });

      return true;
    } catch (error) {
      throw new UnauthorizedException('Remote token validation failed');
    }
  }
}