# 🐟 Fish Freshness Detection App - UI Design Documentation

A modern, ocean-inspired React Native mobile app built with **Expo SDK 56**, **NativeWind (Tailwind CSS v4)**, **TypeScript**, and **Expo Router** for detecting fish freshness via QR code scanning.

## ✨ Design Features

### Design Philosophy

- **Ocean-Inspired Palette**: Blues, teals, cyans, and whites for a cohesive aquatic theme
- **Modern UI**: Rounded cards, soft shadows, gradient headers, and smooth animations
- **Dark Mode Support**: Full dark mode implementation using `dark:` prefix
- **Accessible**: Clear visual hierarchy, readable typography, and intuitive navigation

### Key UI Components

#### 1. **Home Screen** (`src/app/index.tsx`)

- **Gradient Header**: Ocean-themed teal-to-cyan gradient with wave decorations
- **Fish Species List**: Scrollable list with 5 mock fish species
- **Fish Cards**:
  - Horizontal layout with fish image on left, info on right
  - Shows: Name, scientific name, description
  - "Scan" badge indicating quick action
  - Fade-in animation on load with staggered delay
  - Press scale effect on tap
- **Info Footer**: Educational tip about freshness indicators

#### 2. **Scan Screen** (`src/app/scan/[id].tsx`)

- **Selected Fish Display**: Shows which fish species is being scanned
- **Circular Scanner Preview**:
  - Stylish 288x288px circular frame
  - Decorative corner brackets
  - Animated scanning line effect
  - Phone icon with "Scanner preview would appear here" text
  - Mock design only - no actual camera implementation
- **Processing Indicator**:
  - Animated progress bar
  - Percentage display
  - Auto-navigates to results when "scan" completes
  - Cancel button to stop the mock scan
- **Action Buttons**:
  - "Start Scan" button (gradient teal-to-cyan)
  - "Cancel" button (hidden until scan starts)
  - "Back to Home" button (bordered style)
- **Info Box**: Instructions for positioning the QR code

#### 3. **Result Screen** (`src/app/result.tsx`)

- **Freshness Badge**: Color-coded large badge showing:
  - 🟢 **Fresh** (emerald green)
  - 🟡 **Moderate** (amber/yellow)
  - 🔴 **Spoiled** (rose/red)
  - Includes relevant emoji
- **Fish Info Card**: Recap of the scanned fish species
- **Batch ID Display**: Mock QR value (e.g., "BATCH#12345")
- **Confidence Score**:
  - Displays percentage (mock: 75-95%)
  - Animated progress bar
  - AI-Analyzed label
- **Storage & Handling Advice**: Contextual storage tips based on fish type
- **Pro Tips**: Additional freshness indicators and storage best practices
- **Action Buttons**:
  - "Scan Again" (randomly selects another fish)
  - "Back to Home"

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── _layout.tsx              # Root stack layout (no tabs)
│   │   ├── index.tsx                # Home screen (fish list)
│   │   ├── result.tsx               # Result screen (freshness display)
│   │   └── scan/
│   │       └── [id].tsx             # Dynamic scan screen (per fish)
│   ├── components/
│   │   ├── fish-card.tsx            # Reusable fish card component
│   │   ├── freshness-badge.tsx      # Color-coded freshness badge
│   │   ├── gradient-header.tsx      # Ocean-inspired header
│   │   ├── themed-text.tsx          # (existing)
│   │   ├── themed-view.tsx          # (existing)
│   │   └── ... (other existing components)
│   └── constants/
│       ├── fishData.ts              # Mock fish species & scan results
│       └── theme.ts                 # (existing)
├── tailwind.config.js               # NativeWind configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies
└── app.json                         # Expo configuration
```

## 🎨 Color Palette

### Teal Series (Primary Ocean Color)

- `teal-50` to `teal-900`: Full spectrum for layering

### Cyan Series (Secondary Ocean Color)

- `cyan-50` to `cyan-900`: Gradient and accent colors

### Supporting Colors

- **Success**: Emerald (green) for "Fresh"
- **Warning**: Amber (yellow) for "Moderate"
- **Danger**: Rose (red) for "Spoiled"
- **Backgrounds**: White, gray-900 (dark mode)

## 🧩 Reusable Components

### FishCard (`src/components/fish-card.tsx`)

Displays a single fish species with tap-to-scan functionality.

```tsx
<FishCard
  id="1"
  name="Milkfish"
  scientificName="Chanos chanos"
  description="Versatile white fish..."
  image="https://placehold.co/120x120/..."
  index={0}
/>
```

### FreshnessBadge (`src/components/freshness-badge.tsx`)

Color-coded badge showing freshness level with emoji.

```tsx
<FreshnessBadge
  level="Fresh"
  emoji="✨"
  size="lg" // 'sm' | 'md' | 'lg'
/>
```

### GradientHeader (`src/components/gradient-header.tsx`)

Ocean-themed header with optional wave decorations.

```tsx
<GradientHeader
  title="🐟 Fresh Check"
  subtitle="Scan fish QR codes..."
  showWaves={true}
/>
```

## 🎬 Animation Effects

### Libraries Used

- **react-native-reanimated**: All animation effects
- No external animation configuration needed

### Animation Types Implemented

1. **Fade In Down** (`FadeInDown`)
   - Used for: Cards on home screen, buttons, result sections
   - Delay: Staggered by 100-600ms for cascade effect

2. **Zoom In** (`ZoomIn`)
   - Used for: Freshness badge (pops into view)
   - Spring effect for bouncy feel

3. **Fade In** (`FadeIn`)
   - Used for: Header, general content blocks
   - Immediate appearance with fade effect

4. **Scale on Press**
   - Built into Pressable components
   - Visual feedback with `active:opacity-90` and `active:shadow-md`

## 📱 Mock Data

### Fish Species (5 varieties)

- **Milkfish** (Chanos chanos)
- **Barramundi** (Lates calcarifer)
- **Tilapia** (Oreochromis niloticus)
- **Mackerel** (Scomber scombrus)
- **Grouper** (Epinephelus coioides)

### Mock Scan Results

Each fish has different freshness levels and storage advice:

- Milkfish: Fresh (92%)
- Barramundi: Fresh (88%)
- Tilapia: Moderate (75%)
- Mackerel: Moderate (78%)
- Grouper: Fresh (95%)

## 🚀 Getting Started

### Installation

```bash
npm install
# or
yarn install
```

### Optional: Linear Gradient Enhancement

To add actual linear gradient support (currently using color-based gradient):

```bash
npx expo install expo-linear-gradient
```

Then import and use in `gradient-header.tsx`:

```tsx
import { LinearGradient } from "expo-linear-gradient";
// Replace View with LinearGradient
<LinearGradient
  colors={["#0d9488", "#06b6d4"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
>
  {/* content */}
</LinearGradient>;
```

### Running the App

```bash
# Start Expo development server
npm start

# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 🎯 Navigation Flow

```
Home (index.tsx)
  ↓ [Tap any fish card]
Scan Screen (scan/[id].tsx)
  ├─ [Tap "Start Scan"] → Auto-processes
  ├─ [Tap "Cancel"] → Stop processing
  ├─ [Tap "Back to Home"] → Home
  └─ [Processing completes] → Result Screen ↓
Result Screen (result.tsx)
  ├─ [Tap "Scan Again"] → Random fish scan screen
  └─ [Tap "Back to Home"] → Home
```

## 🎯 Design Specifications

### Typography

- **Titles**: Bold, 24-36px, teal-700 (dark: teal-300)
- **Headings**: Bold, 18-20px
- **Body**: Regular, 14-16px, gray-700 (dark: gray-300)
- **Small**: 12-13px, gray-600 (dark: gray-400)

### Spacing

- **Card Padding**: 16px (p-4)
- **Section Gap**: 20px (mb-6)
- **Screen Padding**: 16px (px-6)
- **Component Gap**: 12px (gap-3)

### Border Radius

- **Cards**: 16px (rounded-2xl)
- **Buttons**: 16px (rounded-2xl)
- **Small elements**: 8-12px (rounded-lg to rounded-xl)
- **Circles**: 50% (rounded-full)

### Shadows

- **Light Mode**: Soft gray shadows
- **Dark Mode**: Stronger shadows for depth
- **Active State**: Reduced shadow for pressed effect

## 🔒 Important Notes

### What's NOT Implemented

❌ No actual camera functionality
❌ No QR code scanning
❌ No real API calls or backend integration
❌ No freshness detection algorithms
❌ No database storage
❌ No authentication

### What IS Implemented

✅ Complete static UI design
✅ Mock navigation between screens
✅ Mock scanning animation (visual only)
✅ Mock results with different data per fish
✅ Full dark mode support
✅ Smooth animations and transitions
✅ Responsive layout
✅ TypeScript type safety

## 🛠️ Future Enhancement Ideas

When adding real functionality:

1. **Camera Integration**: Use `expo-camera` for actual QR scanning
2. **Backend API**: Connect to real freshness detection service
3. **Storage**: Use `AsyncStorage` or SQLite for scan history
4. **Authentication**: Add user accounts and saved preferences
5. **Real Images**: Replace placeholder images with actual fish photos
6. **Notifications**: Push notifications for storage reminders
7. **Sharing**: Share results with friends or social media
8. **Export**: Generate PDF reports of scan history

## 📝 File Descriptions

| File                                 | Purpose                               |
| ------------------------------------ | ------------------------------------- |
| `src/app/_layout.tsx`                | Root layout with stack navigation     |
| `src/app/index.tsx`                  | Home screen with scrollable fish list |
| `src/app/scan/[id].tsx`              | Dynamic scan screen for each fish     |
| `src/app/result.tsx`                 | Results display with freshness badge  |
| `src/components/fish-card.tsx`       | Reusable fish card component          |
| `src/components/freshness-badge.tsx` | Color-coded freshness indicator       |
| `src/components/gradient-header.tsx` | Ocean-themed header                   |
| `constants/fishData.ts`              | Mock data for fish species & results  |
| `tailwind.config.js`                 | NativeWind configuration              |

## 📚 Resources

- [Expo SDK 56 Documentation](https://docs.expo.dev/versions/v56.0.0/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Expo Router](https://expo.dev/router)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Status**: UI/UX Complete - Ready for Backend Integration
