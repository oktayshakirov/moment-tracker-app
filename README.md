# ⏱️ Time Keeper

Time Keeper is a beautiful countdown and elapsed-time tracker built with React Native and Expo. Create personal **moments** for milestones, anniversaries, goals, and memories — then watch time pass with live counters, rich backgrounds, and home screen widgets.

> Transform your phone into a personal time capsule. Time Keeper combines elegant dark UI with flexible display units, categories, and native widgets so the moments that matter stay visible every day.

Whether you are counting down to a big day, tracking how long something has lasted, or keeping a milestone on your home screen, Time Keeper makes it simple to create, organize, and revisit the dates that define your life.

## Demo

![Time Keeper — Countdown & Elapsed Time Tracker](https://oktayshakirov.com/assets/images/projects/coming-soon.jpeg "Time Keeper")

<p align="center">
  <a href="">
    ➥ Get it on Google Play
  </a>
   ·
  <a href="">
    ➥ Download on the App Store
  </a>
</p>

## Features

- ⏱️ **Since & Until** — Automatically shows elapsed time for past dates and countdowns for future ones
- 📂 **Categories** — Group moments with custom titles and accent colors
- 🎨 **Rich backgrounds** — Solid colors, gradients, camera roll photos, or Unsplash search
- 📐 **Display units** — Auto or fixed units from seconds through years
- 🏠 **Home screen widgets** — Pin any moment on iOS (WidgetKit) and Android
- 📋 **Organized list** — Sectioned home screen with swipe actions and pull-to-refresh
- 🔗 **Deep linking** — Open moments via `timekeeper://` URLs
- 📱 **Cross-platform** — Native experience on Android and iOS

## ⚙️ Installation

After downloading the project, install the prerequisites below. Then you can run the app locally or build for production.

### 🔧 Install prerequisites (once for a machine)

- **Node.js:** [Install Node.js](https://nodejs.org/en/download/) [Recommended LTS version]
- **Expo CLI:** `npm install -g expo-cli` (optional, but recommended)
- **Android Studio:** [Install Android Studio](https://developer.android.com/studio) (for Android development)
- **Xcode:** [Install Xcode](https://developer.apple.com/xcode/) (for iOS development, macOS only)

### 🖥️ Local setup

After installing those dependencies, open this project in your IDE ([VS Code](https://code.visualstudio.com/) recommended), then open the integrated terminal (`Ctrl/Cmd + \``).

- Copy environment variables

```sh
cp .env.example .env
```

Set `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY` in `.env` if you want Unsplash background search in the moment editor.

- Install dependencies

```sh
# Using npm
npm install

# OR using Yarn
yarn install
```

- Start Metro bundler

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

- Run on Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

- Run on iOS (macOS only)

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

- Run on Web

```sh
# Using npm
npm run web

# OR using Yarn
yarn web
```

The app will open in your Android emulator, iOS Simulator, web browser, or connected device. Metro live-reloads when you save source files.

> **Widgets:** iOS home screen widgets and the Android preview widget require a native build (`yarn ios` / `yarn android`), not Expo Go alone.

## 🏗️ Production Build

After customization, create a production build with the commands below.

### Android

```sh
# Using Expo Application Services (EAS)
eas build --platform android

# OR build locally (requires Android Studio setup)
cd android
./gradlew assembleRelease
```

### iOS

```sh
# Using Expo Application Services (EAS)
eas build --platform ios

# OR build locally (requires macOS and Xcode)
# Build through Xcode or use:
cd ios
xcodebuild -workspace TimeKeeper.xcworkspace -scheme TimeKeeper -configuration Release
```

## 📲 How to Use

1. **Create a moment**: Tap the add button on the home screen
2. **Set the date**: Pick a target date and time (minute precision)
3. **Customize**: Choose a category, background, and display unit
4. **Save**: Your moment appears in the list — **Since** if the date is in the past, **Until** if it is in the future
5. **View details**: Tap a moment for the full-screen view
6. **Add a widget**: Long-press the home screen, add the Time Keeper widget, and pick a moment to display

## 🧩 Moment basics

- **Since** — Time elapsed since a past target date
- **Until** — Time remaining until a future target date
- **Display unit** — `auto` picks a human-friendly unit; fixed units always show seconds, minutes, hours, days, weeks, months, or years
- **Background** — Solid color, multi-stop gradient, device photo, or Unsplash image (with attribution when applicable)

## 🔧 Development

### Project layout

```
src/
├── app/              # App shell, navigation, database provider
├── features/
│   ├── moments/      # Domain, repository, screens, formatters
│   └── categories/   # Domain, repository, editor modal
├── shared/           # Theme, UI primitives, SQLite persistence
└── widgets/          # Widget snapshots, bindings, iOS/Android sync
```

### Key files

- App entry & widget registration: `index.ts`
- Root component: `src/app/App.tsx`
- Navigation: `src/app/navigation/RootNavigator.tsx`
- Moment domain & validation: `src/features/moments/domain/moment.ts`
- Time formatting: `src/features/moments/domain/momentFormatters.ts`
- SQLite migrations: `src/shared/persistence/migrations.ts`
- Widget sync: `src/widgets/syncWidgets.ts`

### Deep links

| Route           | URL                             |
| --------------- | ------------------------------- |
| Home            | `timekeeper://`                 |
| Moment detail   | `timekeeper://moment/:momentId` |
| New / edit form | `timekeeper://moment-form`      |

## 🛠️ Tech Stack

- **React Native** (0.81.5) — Cross-platform mobile framework
- **Expo** (~54.0.33) — Development platform and tooling
- **TypeScript** (~5.9.2) — Type-safe JavaScript
- **React Navigation** (^7) — Stack navigation and deep linking
- **expo-sqlite** — Local persistence with migrations
- **Zod** (^4.3.6) — Runtime schema validation
- **date-fns** (^4.1.0) — Date math and formatting
- **react-native-android-widget** — Android home screen widgets
- **WidgetKit** (iOS) — Native widget extension in `ios/TimeKeeperWidget`

## Troubleshooting

If the setup steps above fail, see the [Expo Troubleshooting](https://docs.expo.dev/troubleshooting/clear-cache/) page or [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

Common issues:

- **Metro bundler cache**: Clear with `expo start -c` or `npm start -- --reset-cache`
- **Node modules**: Delete `node_modules` and lockfile, then reinstall
- **iOS widgets not updating**: Rebuild the native app (`yarn ios`) so `WidgetSnapshotBridge` is linked
- **Unsplash backgrounds**: Ensure `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY` is set in `.env` and restart Metro

## License

This project is provided for viewing purposes only. All rights are reserved. No part of this project may be copied, modified, or redistributed without explicit written permission from the author.

---

Made with ❤️ for the moments that matter.
