require("dotenv").config();

module.exports = {
  expo: {
    name: "Moment Tracker",
    slug: "moment-tracker",
    scheme: "momenttracker",
    version: "1.5.1",
    orientation: "portrait",
    icon: "./assets/icon.jpg",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#1C2127",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.shadev.momenttracker",
      entitlements: {
        "com.apple.security.application-groups": [
          "group.com.shadev.momenttracker",
        ],
      },
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          "Choose a photo as the background for your moments.",
        GADApplicationIdentifier: "ca-app-pub-5852582960793521~7118166594",
        NSUserTrackingUsageDescription:
          "This allows us to show you relevant ads and support Moment Tracker.",
        LSApplicationQueriesSchemes: ["googlegmail", "ms-outlook"],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/splash-icon.png",
        backgroundColor: "#1C2127",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.RECORD_AUDIO",
        "com.google.android.gms.permission.AD_ID",
      ],
      package: "com.shadev.momenttracker",
    },
    web: {
      favicon: "./assets/icon.jpg",
    },
    extra: {
      revenueCatApiKeyIos:
        process.env.REVENUECAT_API_KEY_IOS ?? process.env.REVENUECAT_API_KEY,
      revenueCatApiKeyAndroid:
        process.env.REVENUECAT_API_KEY_ANDROID ??
        process.env.REVENUECAT_API_KEY,
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          backgroundColor: "#1C2127",
          image: "./assets/splash-icon.png",
          imageWidth: 180,
          resizeMode: "contain",
        },
      ],
      "expo-sqlite",
      "expo-mail-composer",
      "@react-native-community/datetimepicker",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow Moment Tracker to use photos for your moment backgrounds.",
        },
      ],
      "expo-font",
      [
        "react-native-android-widget",
        {
          widgets: [
            {
              name: "Preview",
              label: "Moment Tracker",
              description: "Choose a moment to show on your home screen",
              minWidth: "110dp",
              minHeight: "110dp",
              targetCellWidth: 2,
              targetCellHeight: 2,
              resizeMode: "none",
              updatePeriodMillis: 0,
              widgetFeatures: "reconfigurable|configuration_optional",
            },
          ],
        },
      ],
      "expo-tracking-transparency",
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: "ca-app-pub-5852582960793521~3595564418",
          iosAppId: "ca-app-pub-5852582960793521~7118166594",
        },
      ],
    ],
  },
};
