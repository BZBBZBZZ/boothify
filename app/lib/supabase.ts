import { createClient, type SupportedStorage } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.info(
      '💡 Supabase belum dikonfigurasi. Tambahkan NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local untuk menghubungkan database Supabase.'
    );
  }
}

/*
 * Login berakhir saat web ditutup.
 *
 * Bawaan Supabase menyimpan token login di localStorage, yang tidak pernah hilang walau
 * browser ditutup, jadi akun tetap "nyantol". Di sini token disimpan di sessionStorage,
 * yang dihapus browser begitu tab ditutup (refresh halaman tetap aman).
 *
 * sessionStorage hanya milik satu tab. Supaya tab baru (misalnya tombol "Lihat sebagai
 * tenant" yang membuka tab baru) tetap login, tab baru bertanya ke tab Boothify lain yang
 * masih terbuka lewat BroadcastChannel. Kalau tidak ada tab yang menjawab, berarti semua
 * tab sudah ditutup, dan pengguna harus masuk lagi.
 *
 * Pengaman tambahan: Chrome/Edge dengan "Continue where you left off" (dan "buka lagi tab
 * yang ditutup") ikut memulihkan sessionStorage, sehingga login bisa kembali. Karena itu tiap
 * tab yang terbuka mencatat "masih hidup" tiap beberapa detik. Kalau halaman dibuka (bukan
 * refresh) dan catatan terakhir sudah lama, token di tab ini dianggap sisa pemulihan browser
 * dan dibuang. Tab lain yang masih terbuka tetap bisa membagikan login lewat BroadcastChannel.
 */
const SHARE_CHANNEL = 'boothify-auth-share';
const ASK_TIMEOUT_MS = 250;
const ALIVE_KEY = 'boothify_tab_alive_at';
const HEARTBEAT_MS = 5000;
// Lebih lama dari jeda wajar saat pindah halaman, jauh lebih pendek dari "browser ditutup lalu dibuka lagi"
const STALE_AFTER_MS = 20000;

type ShareMessage =
  | { type: 'ask'; id: string; key: string }
  | { type: 'answer'; id: string; key: string; value: string }
  | { type: 'set'; key: string; value: string }
  | { type: 'remove'; key: string };

function createTabSessionStorage(): SupportedStorage | undefined {
  if (typeof window === 'undefined') return undefined;
  const win = window;

  // Hapus token lama yang tersimpan di localStorage sebelum perbaikan ini
  try {
    const oldKeys: string[] = [];
    for (let i = 0; i < win.localStorage.length; i++) {
      const key = win.localStorage.key(i);
      if (key && key.startsWith('sb-') && key.includes('auth-token')) oldKeys.push(key);
    }
    oldKeys.forEach((key) => win.localStorage.removeItem(key));
  } catch {
    /* storage tidak tersedia */
  }

  // Token yang dipulihkan browser setelah semua tab ditutup: buang dari tab ini saja (tanpa broadcast,
  // supaya tab lain yang masih terbuka tidak ikut keluar)
  try {
    const nav = win.performance?.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
    const isReload = nav?.type === 'reload';
    const lastAlive = Number(win.localStorage.getItem(ALIVE_KEY)) || 0;
    if (!isReload && Date.now() - lastAlive > STALE_AFTER_MS) {
      const restored: string[] = [];
      for (let i = 0; i < win.sessionStorage.length; i++) {
        const key = win.sessionStorage.key(i);
        if (key && key.startsWith('sb-')) restored.push(key);
      }
      restored.forEach((key) => win.sessionStorage.removeItem(key));
    }
  } catch {
    /* storage tidak tersedia */
  }

  // Tanda bahwa masih ada tab Boothify yang terbuka
  const markAlive = () => {
    try {
      win.localStorage.setItem(ALIVE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };
  markAlive();
  win.setInterval(markAlive, HEARTBEAT_MS);
  win.addEventListener('pagehide', markAlive);
  win.addEventListener('visibilitychange', markAlive);

  const read = (key: string): string | null => {
    try {
      return win.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const write = (key: string, value: string) => {
    try {
      win.sessionStorage.setItem(key, value);
    } catch {
      /* storage penuh atau diblokir */
    }
  };
  const remove = (key: string) => {
    try {
      win.sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  };

  const channel = 'BroadcastChannel' in win ? new BroadcastChannel(SHARE_CHANNEL) : null;
  // Key yang sudah ditanyakan dan tidak ada yang menjawab: jangan tanya lagi tiap request
  const askedWithoutAnswer = new Set<string>();

  channel?.addEventListener('message', (event: MessageEvent<ShareMessage>) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'ask') {
      const value = read(msg.key);
      if (value !== null) channel.postMessage({ type: 'answer', id: msg.id, key: msg.key, value } satisfies ShareMessage);
    } else if (msg.type === 'set') {
      // Token diperbarui atau login di tab lain: ikut disimpan di tab ini
      write(msg.key, msg.value);
      askedWithoutAnswer.delete(msg.key);
    } else if (msg.type === 'remove') {
      // Keluar di satu tab berarti keluar di semua tab
      remove(msg.key);
    }
  });

  return {
    getItem: (key: string) => {
      const own = read(key);
      if (own !== null || !channel || askedWithoutAnswer.has(key)) return own;

      // Tab baru: tanya tab lain yang masih terbuka
      return new Promise<string | null>((resolve) => {
        const id = Math.random().toString(36).slice(2);
        const onMessage = (event: MessageEvent<ShareMessage>) => {
          const msg = event.data;
          if (msg?.type !== 'answer' || msg.id !== id) return;
          win.clearTimeout(timer);
          channel.removeEventListener('message', onMessage);
          write(key, msg.value);
          resolve(msg.value);
        };
        const timer = win.setTimeout(() => {
          channel.removeEventListener('message', onMessage);
          askedWithoutAnswer.add(key);
          resolve(null);
        }, ASK_TIMEOUT_MS);
        channel.addEventListener('message', onMessage);
        channel.postMessage({ type: 'ask', id, key } satisfies ShareMessage);
      });
    },
    setItem: (key: string, value: string) => {
      write(key, value);
      askedWithoutAnswer.delete(key);
      channel?.postMessage({ type: 'set', key, value } satisfies ShareMessage);
    },
    removeItem: (key: string) => {
      remove(key);
      channel?.postMessage({ type: 'remove', key } satisfies ShareMessage);
    },
  };
}

// Inisialisasi Supabase Client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: createTabSessionStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  }
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