export const RESET_TICKET_EXPIRES_IN = '10m';

// The website and dashboard are separate frontends that both call this
// same backend. On localhost they're only distinguished by port, which the
// browser's cookie jar ignores entirely (cookies are host-scoped, not
// port-scoped) — so a single shared cookie name meant logging into one app
// silently overwrote the other's session. Each frontend sends an explicit
// `X-Client-App` header (set in its fetchUrl.ts) so we can give them
// separate refresh-token cookies instead.
export const CLIENT_APP_HEADER = 'x-client-app';

export type ClientApp = 'website' | 'dashboard';

export const getClientApp = (clientAppHeader: unknown): ClientApp =>
  clientAppHeader === 'dashboard' ? 'dashboard' : 'website';

export const getRefreshTokenCookieName = (clientApp: ClientApp): string =>
  clientApp === 'dashboard' ? 'tiu_refresh_token_dashboard' : 'tiu_refresh_token_website';
