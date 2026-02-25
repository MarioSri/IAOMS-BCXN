import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

/**
 * Timeout-aware fetch wrapper.
 *
 * Auth and token-refresh calls use a longer timeout (30 s) so they are never
 * aborted mid-flight.  All other API calls keep the previous 15 s ceiling to
 * prevent the "Fetching data from database" UI from getting stuck.
 *
 * We detect auth calls by inspecting the URL path.
 */
const fetchWithTimeout: typeof fetch = (input, init) => {
    const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
    // Auth endpoints (token refresh, sign-in, sign-out, …) need more headroom
    const isAuthCall = url.includes('/auth/v1/');
    const timeoutMs = isAuthCall ? 30_000 : 15_000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // If the caller already supplied a signal, chain them so the first one
    // to fire wins (requires AbortSignal.any() — available in all modern
    // browsers; gracefully falls back to ours only if unavailable).
    let signal: AbortSignal = controller.signal;
    if (init?.signal) {
        try {
            signal = AbortSignal.any([controller.signal, init.signal as AbortSignal]);
        } catch {
            // AbortSignal.any not available — use controller signal only
        }
    }

    return fetch(input, {
        ...init,
        signal,
    }).finally(() => clearTimeout(timeoutId));
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: fetchWithTimeout,
    },
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        /**
         * Scoped storage key — prevents session collisions if the domain hosts
         * multiple Supabase-backed apps (e.g. dev vs. prod on the same origin).
         */
        storageKey: 'iaoms-supabase-auth',
    },
});
