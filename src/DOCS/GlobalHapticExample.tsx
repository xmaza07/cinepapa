// --- Live Example: Using HapticProvider and useHaptic ---

// Example button component that uses haptic feedback
function HapticButton({ onClick, children }: { onClick?: (e: React.MouseEvent) => void; children: React.ReactNode }) {
  const { triggerHaptic } = useHaptic();
  const handleClick = (e: React.MouseEvent) => {
    triggerHaptic();
    onClick?.(e);
  };
  return <button onClick={handleClick}>{children}</button>;
}

// Example app content
function ExampleAppContent() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Haptic Feedback Example</h2>
      <HapticButton>Click me for haptic feedback</HapticButton>
    </div>
  );
}

// Example root usage
function HapticExampleRoot() {
  return (
    <HapticProvider>
      <ExampleAppContent />
    </HapticProvider>
  );
}

// To render this example, you can use:
// ReactDOM.render(<HapticExampleRoot />, document.getElementById('root'));
/**
 * This file demonstrates how to apply haptic feedback globally to the entire application.
 * This is an example implementation and can be modified as needed.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import App from '../App'; // Your main App component
import { enhanceAppWithHaptics } from '../utils/add-haptic-to-buttons.tsx';
import { HapticProvider, useHaptic } from '../hooks/useHaptic';
// Method 1: Enhance the entire App with haptic feedback
// const HapticApp = enhanceAppWithHaptics(App);

// ReactDOM.render(
//   <React.StrictMode>
//     <HapticApp />
//   </React.StrictMode>,
//   document.getElementById('root')
// );

// Method 2: Alternative approach - Create a HapticProvider
// This allows more control over which parts of the app receive haptic feedback



// HapticProvider and useHaptic are now imported from '../hooks/useHaptic'

// Example usage in App.tsx:
/*
function App() {
  return (
    <HapticProvider>
      <YourAppContent />
    </HapticProvider>
  );
}

// Then in any component:
function Button({ onClick, children }) {
  const { triggerHaptic } = useHaptic();
  
  const handleClick = (e) => {
    triggerHaptic();
    onClick?.(e);
  };
  
  return <button onClick={handleClick}>{children}</button>;
}
*/
