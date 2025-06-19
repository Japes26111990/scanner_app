import { useState, useEffect } from 'react';

export const useWakeLock = () => {
  const [wakeLock, setWakeLock] = useState(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      // The Screen Wake Lock API is available only in secure contexts (https).
      if ('wakeLock' in navigator) {
        try {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
          console.log('Screen Wake Lock is active.');

          lock.addEventListener('release', () => {
            console.log('Screen Wake Lock was released.');
            setWakeLock(null);
          });

        } catch (err) {
          console.error(`${err.name}, ${err.message}`);
        }
      } else {
        console.warn('Screen Wake Lock API not supported in this browser.');
      }
    };

    requestWakeLock();

    // Cleanup function to release the lock when the component unmounts
    return () => {
      if (wakeLock !== null) {
        wakeLock.release();
        setWakeLock(null);
      }
    };
  }, []); // Run only once on mount

  return wakeLock;
};