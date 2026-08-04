import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): SupabaseClient => {
        const url = config.get<string>('SUPABASE_URL');
        const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
        if (!url || !key) {
          throw new Error('Supabase env vars are missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
        }
        // service role key -> used only on the server, never exposed to the client
        return createClient(url, key);
      },
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
