import {
  ActionSheetIOS,
  Alert,
  Linking,
  Platform,
} from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as MailComposer from "expo-mail-composer";
import * as StoreReview from "expo-store-review";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CustomerInfo } from "react-native-purchases";
import { ENTITLEMENT_PRO, PRODUCT_ID_UNLOCK } from "@/constants/revenueCat";

export const APP_NAME = "Moment Tracker";
const CONTACT_EMAIL = "moment-tracker@oktayshakirov.com";
const APP_STORE_ID = "6777827650";
const ANDROID_PACKAGE = "com.shadev.momenttracker";
const RATED_FLAG_KEY = "momenttracker_hasRequestedReview";
const APP_VERSION = Constants.expoConfig?.version ?? "—";

/** Human-readable plan label. The only paid product is a lifetime unlock. */
export function getPlanLabel(
  customerInfo: CustomerInfo | null,
  isDevPro: boolean,
): string {
  if (isDevPro) return "Pro (Dev)";
  const entitlement = customerInfo?.entitlements?.active?.[ENTITLEMENT_PRO];
  const productId = (entitlement as { productIdentifier?: string } | undefined)
    ?.productIdentifier;
  if (productId === PRODUCT_ID_UNLOCK) return "Lifetime";
  const ownsUnlock = customerInfo?.nonSubscriptionTransactions?.some(
    (tx) => tx.productIdentifier === PRODUCT_ID_UNLOCK,
  );
  if (ownsUnlock) return "Lifetime";
  return "Pro";
}

/** Opens the public store listing where the user can read or leave a review. */
function openStoreListing() {
  const url =
    Platform.OS === "ios"
      ? `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`
      : `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
  Linking.openURL(url).catch(() => undefined);
}

interface MailOption {
  name: string;
  open: () => Promise<void>;
}

// Several mail clients (notably Gmail on iOS) only render line breaks in a
// URL-encoded body when they are CRLF; a bare "\n" collapses the whole template
// onto one line. Templates keep plain "\n" as the source of truth and we
// normalize to CRLF only when building a mail URL.
const crlf = (s: string) => s.replace(/\r?\n/g, "\r\n");

/** Opens the user's default mail handler (or, on Android, the system chooser). */
function openMailto(subject: string, body: string): Promise<void> {
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(crlf(body))}`;
  return Linking.openURL(mailto);
}

/** Last resort when no mail app exists: let the user copy our address. */
function showCopyAddressFallback() {
  Alert.alert(
    "No email app found",
    `Copy our address and send your message from any email app:\n\n${CONTACT_EMAIL}`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Copy address",
        onPress: () => {
          Clipboard.setStringAsync(CONTACT_EMAIL).catch(() => undefined);
        },
      },
    ],
  );
}

async function sendMail(subject: string, body: string) {
  // Android resolves mailto: to its own app chooser (incl. Gmail), so there's
  // nothing to detect — just open it.
  if (Platform.OS !== "ios") {
    try {
      await openMailto(subject, body);
    } catch {
      showCopyAddressFallback();
    }
    return;
  }

  // iOS: detect installed mail apps, with Gmail prioritized first.
  const enc = (s: string) => encodeURIComponent(s);
  // Body needs CRLF line breaks to render correctly in Gmail/Outlook.
  const encBody = (s: string) => encodeURIComponent(crlf(s));
  const options: MailOption[] = [];

  // Gmail — note the three-slash "/co" compose path required by the app.
  const gmailUrl = `googlegmail:///co?to=${CONTACT_EMAIL}&subject=${enc(
    subject,
  )}&body=${encBody(body)}`;
  try {
    if (await Linking.canOpenURL(gmailUrl)) {
      options.push({ name: "Gmail", open: () => Linking.openURL(gmailUrl) });
    }
  } catch {
    // Ignore detection failure.
  }

  // Outlook
  const outlookUrl = `ms-outlook://compose?to=${CONTACT_EMAIL}&subject=${enc(
    subject,
  )}&body=${encBody(body)}`;
  try {
    if (await Linking.canOpenURL(outlookUrl)) {
      options.push({
        name: "Outlook",
        open: () => Linking.openURL(outlookUrl),
      });
    }
  } catch {
    // Ignore detection failure.
  }

  // Apple Mail — only when an account is configured (so Send actually works).
  try {
    if (await MailComposer.isAvailableAsync()) {
      options.push({
        name: "Apple Mail",
        open: async () => {
          await MailComposer.composeAsync({
            recipients: [CONTACT_EMAIL],
            subject,
            body,
          });
        },
      });
    }
  } catch {
    // Ignore detection failure.
  }

  // No mail app detected: try the default handler, then copy-address fallback.
  if (options.length === 0) {
    try {
      await openMailto(subject, body);
    } catch {
      showCopyAddressFallback();
    }
    return;
  }

  // Exactly one app: open it directly, no need to ask.
  if (options.length === 1) {
    await options[0].open();
    return;
  }

  // Several apps: ask the user which one to use (Gmail listed first).
  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: "Send feedback with",
      options: [...options.map((o) => o.name), "Cancel"],
      cancelButtonIndex: options.length,
    },
    (index) => {
      if (index < options.length) {
        options[index].open().catch(() => showCopyAddressFallback());
      }
    },
  );
}

export function handleBugReport() {
  const deviceModel = Device.modelName ?? "Unknown device";
  const osVersion =
    `${Device.osName ?? Platform.OS} ${Device.osVersion ?? ""}`.trim();
  sendMail(
    `[Bug Report] ${APP_NAME}`,
    `Describe the bug:\n\n\nSteps to reproduce:\n1.\n2.\n3.\n\n--- App info ---\nVersion: ${APP_VERSION}\nDevice: ${deviceModel}\nOS: ${osVersion}\n`,
  );
}

export function handleFeatureRequest() {
  sendMail(
    `[Feature Request] ${APP_NAME}`,
    `What feature would you like to see?\n\n\nWhy would this be useful?\n\n`,
  );
}

export function handlePartnership() {
  sendMail(
    `[Partnership] ${APP_NAME}`,
    `Hi ${APP_NAME} team,\n\nI'd like to explore a partnership opportunity.\n\nCompany / Name:\nWebsite:\nProposal:\n\n`,
  );
}

export async function handleRateApp() {
  // The native in-app review prompt is silent and rate-limited by the OS: it
  // resolves successfully even when nothing is shown (e.g. the user already
  // rated or the yearly cap is hit), and there is no API to detect that.
  // So we only use it the first time, then fall back to the store listing,
  // which always works and shows the user their existing review if any.
  let alreadyRequested = false;
  try {
    alreadyRequested = (await AsyncStorage.getItem(RATED_FLAG_KEY)) === "1";
  } catch {
    // Treat storage failure as "not requested yet".
  }

  const canPrompt = !alreadyRequested && (await StoreReview.isAvailableAsync());

  if (canPrompt) {
    try {
      await StoreReview.requestReview();
      await AsyncStorage.setItem(RATED_FLAG_KEY, "1");
    } catch {
      openStoreListing();
    }
    return;
  }

  // Already prompted before (or native prompt unavailable): give clear feedback
  // and a reliable way to reach the listing.
  Alert.alert(
    "Thanks for your support! 💛",
    `If you've already rated ${APP_NAME}, you're awesome. Want to update your review or leave one now?`,
    [
      { text: "Not now", style: "cancel" },
      { text: "Open store", onPress: openStoreListing },
    ],
  );
}
