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
        if ('wakeLock' in navigator && !wakeLockRef.current) {
          const wakeLock = await navigator.wakeLock.request('screen');
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