'use client';

import * as React from 'react';
import { subscribePrompt, type PromptKey } from './promptStore';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Returns the effective system prompt for a tool: the user's saved custom
 * version (from Firestore) if present, otherwise the built-in default.
 * Live-updates when the underlying document changes.
 */
export function useCustomPrompt(key: PromptKey, defaultPrompt: string) {
  const { user } = useAuth();
  const [prompt, setPrompt] = React.useState<string>(defaultPrompt);
  const [isCustom, setIsCustom] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      setPrompt(defaultPrompt);
      setIsCustom(false);
      return;
    }
    const unsub = subscribePrompt(user.uid, key, (value) => {
      setPrompt(value ?? defaultPrompt);
      setIsCustom(value != null);
    });
    return unsub;
  }, [user, key, defaultPrompt]);

  return { prompt, isCustom };
}
