// Removed reference to vite/client as it cannot be found in the current environment
// /// <reference types="vite/client" />

// Augment NodeJS namespace to add API_KEY to ProcessEnv.
// This prevents the "Cannot redeclare block-scoped variable 'process'" error 
// which occurs when 'process' is already defined globally (e.g. by @types/node).
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}

// Wake Lock API Types
interface WakeLockSentinel extends EventTarget {
  readonly released: boolean;
  readonly type: 'screen';
  release(): Promise<void>;
  onrelease: ((this: WakeLockSentinel, ev: Event) => any) | null;
}

interface WakeLock {
  request(type?: 'screen'): Promise<WakeLockSentinel>;
}

interface Navigator {
  readonly wakeLock: WakeLock;
}
