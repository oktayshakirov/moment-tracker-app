/**
 * Entitlement identifier — must match RevenueCat dashboard **exactly**.
 * If you named it differently in the dashboard, update this value.
 */
export const ENTITLEMENT_PRO = "momenttracker_unlock";

/** Product identifier — must match App Store Connect / Google Play exactly. */
export const PRODUCT_ID_UNLOCK = "momenttracker_unlock";

export const PRODUCT_IDS = [PRODUCT_ID_UNLOCK] as const;
