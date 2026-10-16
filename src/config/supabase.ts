/** Configuration publique, utilisable par l'UI sans créer de client réseau. */
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseUrl !== 'https://placeholder.supabase.co'
);
