/**
 * Free-tier limits. Pro users (the `momenttracker_unlock` entitlement) are
 * unrestricted. Keep these in one place so gating stays consistent across the
 * app, the widget config flow, and the native widget extension.
 */

/** Maximum number of moments a free user can create. */
export const FREE_MOMENT_LIMIT = 5;

/** Maximum number of home-screen widgets a free user can bind/keep. */
export const FREE_WIDGET_LIMIT = 1;
