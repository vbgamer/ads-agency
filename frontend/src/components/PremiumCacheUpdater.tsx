import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function PremiumCacheUpdater() {
  const { profile, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && profile) {
      // Cache premium status for next splash screen
      const isPremium = profile.is_premium ? 'true' : 'false';
      localStorage.setItem('isPremiumUser', isPremium);
      
      // Update the theme data attribute in real-time
      const theme = profile.is_premium ? 'premium' : 'free';
      document.documentElement.setAttribute('data-user-theme', theme);
    }
  }, [profile, isLoading]);
  
  return null; // This component renders nothing
}
