# 🐟 Fish Freshness App - Quick Start Guide

## ✅ What's Included

This package includes a complete **static UI design** (no backend logic) for a fish freshness detection mobile app with:

### ✨ Features

- 🎨 **Ocean-Inspired Design**: Teal, cyan, and white color palette
- 🌙 **Dark Mode Support**: Full dark mode with `dark:` prefix styling
- ⚡ **Smooth Animations**: Fade-in, zoom, and scale effects using Reanimated
- 📱 **Responsive Layout**: Mobile-first design that works on all screen sizes
- 🧩 **Reusable Components**: Fish cards, freshness badges, gradient headers
- 📲 **Expo Router Navigation**: Stack-based routing with dynamic routes
- 🎯 **Mock Data**: 5 sample fish species with mock scan results
- 🔒 **TypeScript**: Full type safety throughout

### 📄 Screens

1. **Home Screen** - Scrollable list of fish species
2. **Scan Screen** - Mock QR scanner interface (dynamic per fish)
3. **Result Screen** - Mock freshness detection results

---

## 📦 Prerequisites

Before running the app, ensure you have:

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Expo CLI** (optional: `npm install -g expo-cli`)

---

## 🚀 Installation & Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
# or
yarn install
```

### Step 2: Install Linear Gradient (Optional but Recommended)

For enhanced gradient effects in the header, install:

```bash
npx expo install expo-linear-gradient
```

Then update `src/components/gradient-header.tsx` to use actual gradients instead of background colors.

### Step 3: Start Development Server

```bash
npm start
```

### Step 4: Run on Your Platform

**iOS (Mac only):**

```bash
npm run ios
# or press 'i' in the Expo CLI terminal
```

**Android:**

```bash
npm run android
# or press 'a' in the Expo CLI terminal
```

**Web:**

```bash
npm run web
# or press 'w' in the Expo CLI terminal
```

---

## 📁 Key Files & Components

### Screens

| File                    | Screen | Purpose           |
| ----------------------- | ------ | ----------------- |
| `src/app/index.tsx`     | Home   | Fish species list |
| `src/app/scan/[id].tsx` | Scan   | Mock QR scanner   |
| `src/app/result.tsx`    | Result | Freshness results |

### Components

| File                                 | Component            | Purpose                         |
| ------------------------------------ | -------------------- | ------------------------------- |
| `src/components/fish-card.tsx`       | `<FishCard />`       | Reusable fish display card      |
| `src/components/freshness-badge.tsx` | `<FreshnessBadge />` | Color-coded freshness indicator |
| `src/components/gradient-header.tsx` | `<GradientHeader />` | Ocean-themed header             |

### Data

| File                    | Content                          |
| ----------------------- | -------------------------------- |
| `constants/fishData.ts` | Mock fish species & scan results |

---

## 🎮 How to Use the App

### Home Screen

1. Open the app - you'll see the home screen with "🐟 Fresh Check" header
2. Scroll through the list of available fish species
3. Tap any fish card to navigate to the scan screen

### Scan Screen

1. Tap "📸 Start Scan" to simulate a QR code scan
2. Watch the animated progress bar (completes in ~3 seconds)
3. Result screen auto-loads when scan completes
4. Use "⏹️ Cancel" to stop an active scan
5. Use "← Back to Home" to return without scanning

### Result Screen

1. View the color-coded freshness badge (Fresh/Moderate/Spoiled)
2. See batch ID, confidence score, and storage advice
3. Tap "📸 Scan Again" to scan a different (random) fish
4. Tap "🏠 Back to Home" to return to home screen

---

## 🎨 Design Highlights

### Color Palette

- **Teal** (`#0d9488`): Primary ocean color
- **Cyan** (`#06b6d4`): Accent ocean color
- **Emerald** (`#059669`): Fresh status
- **Amber** (`#d97706`): Moderate status
- **Rose** (`#e11d48`): Spoiled status

### Dark Mode

All screens support dark mode automatically. The app will use your device's system dark mode setting.

### Animations

- Fish cards fade in with staggered delay on home screen
- Buttons scale down slightly when pressed
- Freshness badge zooms in on result screen
- Progress bar smoothly animates during "scan"

---

## 📝 Mock Data

### Sample Fish Species

1. **Milkfish** - Fresh (92% confidence)
2. **Barramundi** - Fresh (88% confidence)
3. **Tilapia** - Moderate (75% confidence)
4. **Mackerel** - Moderate (78% confidence)
5. **Grouper** - Fresh (95% confidence)

Each fish has unique storage advice based on its type.

---

## 🔒 Important Notes

### What's NOT Implemented

- ❌ Actual camera/QR code scanning
- ❌ Real backend API calls
- ❌ Freshness detection algorithms
- ❌ User authentication
- ❌ Data persistence/storage
- ❌ Push notifications

### What IS Implemented

- ✅ Complete static UI design
- ✅ Screen navigation and routing
- ✅ Mock scanning animation
- ✅ Dark mode support
- ✅ Smooth animations
- ✅ Responsive layout
- ✅ TypeScript type safety

---

## 🛠️ Troubleshooting

### App won't start?

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Dark mode not working?

- Ensure your device/simulator is set to dark mode
- The app respects system settings automatically

### Images not loading?

- The app uses placeholder.co for mock images
- In production, replace with actual fish photos or implement image upload

### TypeScript errors?

```bash
# Compile TypeScript to check for errors
npx tsc --noEmit
```

---

## 📚 Documentation

- Full design documentation: [DESIGN.md](./DESIGN.md)
- Expo Router docs: https://expo.dev/router
- NativeWind docs: https://www.nativewind.dev/
- React Native Reanimated: https://docs.swmansion.com/react-native-reanimated/

---

## 🎓 Learning Resources

### Key Concepts Used

1. **Expo Router** - File-based routing similar to Next.js
2. **Dynamic Routes** - `scan/[id].tsx` creates routes like `/scan/1`, `/scan/2`
3. **NativeWind** - Utility-first styling with Tailwind CSS
4. **React Native Reanimated** - Declarative animations
5. **TypeScript** - Type-safe component props

### File Structure Best Practices

- Screens go in `src/app/`
- Reusable components go in `src/components/`
- Shared constants go in `constants/`
- Hooks go in `src/hooks/`

---

## 🚢 Next Steps

To add real functionality to this UI:

1. **Camera Integration**

   ```bash
   npx expo install expo-camera expo-barcode-scanner
   ```

2. **Backend API**
   - Replace mock data with real API calls
   - Implement user authentication

3. **Data Persistence**

   ```bash
   npx expo install @react-native-async-storage/async-storage
   ```

4. **Real Images**
   - Replace placeholder URLs with actual fish images
   - Implement image upload if needed

---

## 💡 Tips

- Use Expo Go app on your phone for fast testing
- Hot reload works automatically when you save files
- Use `npm run lint` to check code quality
- TypeScript will catch many errors before runtime

---

**Happy coding! 🎉**

For issues or questions, refer to [DESIGN.md](./DESIGN.md) for detailed component documentation.
