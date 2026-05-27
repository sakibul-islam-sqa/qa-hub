'use client';

import * as React from 'react';
import type { AiSettings } from './types';
import { subscribeSettings } from './settingsStore';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Subscribes to the signed-in user's AI settings doc in Firestore.
 * Returns `{}` while the user is anonymous or settings are loading.
 */
export function useAiSettings(): AiSettings {
  const { user } = useAuth();
  const [settings, setSettings] = React.useState<AiSettings>({});

  React.useEffect(() => {
    if (!user) {
      setSettings({});
      return;
    }
    const unsub = subscribeSettings(user.uid, setSettings);
    return unsub;
  }, [user]);

  return settings;
}
