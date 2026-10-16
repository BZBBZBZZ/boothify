import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.info(
      '💡 Supabase belum dikonfigurasi. Tambahkan NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local untuk menghubungkan database Supabase.'
    );
  }
}

// Inisialisasi Supabase Client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// Helper untuk mengecek konektivitas database Supabase
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  eventCount?: number;
}> {
  try {
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
      return {
        connected: false,
        message: 'Kunci NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di file .env.local'
      };
    }
    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { connected: false, message: `Gagal query Supabase: ${error.message}` };
    }
    return {
      connected: true,
      message: 'Koneksi ke Supabase berhasil terhubung!',
      eventCount: count ?? 0
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { connected: false, message: `Kesalahan jaringan: ${msg}` };
  }
}
