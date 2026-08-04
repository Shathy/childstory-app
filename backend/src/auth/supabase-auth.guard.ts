import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';

/**
 * Passwordless auth: the frontend uses Supabase's built-in magic-link
 * (supabase.auth.signInWithOtp) to sign the user in. The client then sends
 * the resulting access token as: Authorization: Bearer <token>
 * This guard just verifies that token with Supabase and attaches the user.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data?.user) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    request.user = data.user; // { id, email, ... }
    return true;
  }
}
