import { useEffect, useRef, useState } from 'react';

export const useWakeLock = (enabled: boolean) => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const requestWakeLock = async () => {
      if (!enabled) {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
          setIsLocked(false);
        }
        return;
      }

      try {
        // Cast to unknown then Navigator to satisfy TypeScript with our custom interface
        const nav = navigator as unknown as Navigator;
        if ('wakeLock' in nav && !wakeLockRef.current) {
          const wakeLock = await nav.wakeLock.request('screen');
          wakeLockRef.current = wakeLock;
          setIsLocked(true);

          wakeLock.addEventListener('release', () => {
            wakeLockRef.current = null;
            setIsLocked(false);
          });
        }
      } catch (err) {
        console.error('Wake Lock failed:', err);
      }
    };

    requestWakeLock();
    
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
      }
    };
  }, [enabled]);

  return isLocked;
};