import { useState, useEffect } from 'react';

const PUSH_SUBSCRIBE_URL = import.meta.env.VITE_EKKO_PUSH_SUBSCRIBE_URL;

export function PushNotificationButton() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      alert('Push notifications are not supported in this browser');
      return;
    }

    setIsSubscribing(true);

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;

        // Get existing subscription or create new one
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // Create new subscription
          // Note: In production, you'd need a VAPID public key
          // For now, we'll just log that subscription would be created
          console.log('Push subscription would be created here');
          
          // If PUSH_SUBSCRIBE_URL is set, we'd POST the subscription
          if (PUSH_SUBSCRIBE_URL) {
            // In a real implementation, you'd do:
            // const subscription = await registration.pushManager.subscribe({
            //   userVisibleOnly: true,
            //   applicationServerKey: VAPID_PUBLIC_KEY,
            // });
            // await fetch(PUSH_SUBSCRIBE_URL, {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(subscription),
            // });
            console.log('Push subscription would be sent to:', PUSH_SUBSCRIBE_URL);
          }
        } else {
          console.log('Push subscription already exists');
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('Failed to enable notifications. Please check your browser settings.');
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  if (permission === 'granted') {
    return (
      <div className="text-sm text-green-600 dark:text-green-400">
        ✓ Notifications enabled
      </div>
    );
  }

  return (
    <button
      onClick={requestPermission}
      disabled={isSubscribing}
      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
    </button>
  );
}


