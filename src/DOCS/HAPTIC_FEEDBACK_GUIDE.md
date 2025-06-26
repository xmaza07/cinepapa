# Haptic Feedback Implementation Guide

This guide describes how to implement consistent haptic feedback throughout the application.

## Overview

Haptic feedback provides tactile responses to user interactions, making the application feel more responsive and engaging, particularly on mobile devices. Our implementation uses the Web Vibration API, which is supported on most modern mobile browsers.

## Components

We've created the following components and utilities to simplify haptic feedback implementation:

1. **HapticButton**: A drop-in replacement for the Button component that automatically adds haptic feedback
2. **HapticHTMLButton**: A drop-in replacement for HTML button elements
3. **withButtonHaptics**: A higher-order function for wrapping onClick handlers

## How to Use

### 1. Use Haptic UI Components

Replace existing Button components with HapticButton:

```tsx
// Before
import { Button } from '@/components/ui/button';

<Button onClick={handleClick}>Click Me</Button>

// After
import { HapticButton } from '@/components/ui/haptic-ui';

<HapticButton onClick={handleClick}>Click Me</HapticButton>
```

Replace standard HTML buttons with HapticHTMLButton:

```tsx
// Before
<button onClick={handleClick}>Click Me</button>

// After
import { HapticHTMLButton } from '@/components/ui/haptic-ui';

<HapticHTMLButton onClick={handleClick}>Click Me</HapticHTMLButton>
```

### 2. Use withButtonHaptics HOF

For existing onClick handlers, wrap them with withButtonHaptics:

```tsx
// Before
<Button onClick={() => handleSomething()}>Click Me</Button>

// After
import { withButtonHaptics } from '@/utils/haptic-feedback';

<Button onClick={withButtonHaptics(() => handleSomething())}>Click Me</Button>
```

For simple cases without callback logic:

```tsx
<button onClick={withButtonHaptics()}>Just Haptic Feedback</button>
```

### 3. Use Direct Haptic Functions

For more granular control, use the direct haptic feedback functions:

```tsx
import { 
  triggerHapticFeedback, 
  triggerHapticPattern,
  triggerSuccessHaptic,
  triggerErrorHaptic 
} from '@/utils/haptic-feedback';

// Standard feedback (15-25ms is good for most button presses)
triggerHapticFeedback(15);

// Success feedback (for confirmations, completed actions)
triggerSuccessHaptic();

// Error feedback (for errors, warnings)
triggerErrorHaptic();

// Custom patterns (alternating vibration/pause in ms)
triggerHapticPattern([10, 20, 30]);
```

## Feedback Intensity Guidelines

For consistency across the application, follow these guidelines:

- **Light Feedback (10-15ms)**: For minor actions like navigation, tab switching
- **Medium Feedback (20ms)**: For standard actions like button clicks, form submissions
- **Strong Feedback (25-30ms)**: For primary actions like playing content or downloading
- **Success Pattern**: For confirmations and positive actions
- **Failure Pattern**: For errors and negative interactions

## Browser Compatibility

The Vibration API is supported on:
- Chrome for Android
- Firefox for Android
- Opera Mobile
- Samsung Internet

It is NOT supported on:
- iOS Safari
- Most desktop browsers

Our implementation gracefully degrades when the API is not available, so it's safe to use on all platforms.

## Best Practices

1. Don't overuse haptic feedback; too much can be annoying
2. Use consistent durations for similar actions
3. Make haptic feedback subtle and complementary to visual feedback
4. Always provide proper error handling for the Vibration API
5. Test on actual mobile devices, as vibration can feel different across devices
