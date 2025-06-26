// TypeScript declarations for browser APIs

interface Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

interface Navigator {
  vibrate: (pattern: number | number[]) => boolean;
}
