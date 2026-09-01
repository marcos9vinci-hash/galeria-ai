import { useState, useEffect } from "react";
import { instagramService } from "@/services/instagramService";

export const useInstagram = () => {
  const [igConnected, setIgConnected] = useState(false);
  const [hasPublishPerm, setHasPublishPerm] = useState(false);
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [showIgModal, setShowIgModal] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState("instagram");

  const checkConnection = async () => {
    const data = await instagramService.getAccountInfo();
    if (data && data.connected) {
      setIgConnected(true);
      setProfileInfo(data.profile);
      setHasPublishPerm(data.hasPublishPerm);
    } else {
      setIgConnected(false);
      setProfileInfo(null);
      setHasPublishPerm(false);
    }
  };

  // Handle fb_token from URL hash (OAuth callback) - runs on mount AND hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const fbToken = params.get("fb_token");
      const error = params.get("error");

      if (fbToken) {
        // Save token as cookie for Edge Function authentication
        document.cookie = `fb_access_token=${fbToken}; Path=/; Secure; SameSite=Lax; Max-Age=5184000`; // 60 days
        
        // Clean URL hash
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        
        // Check connection after saving token
        checkConnection();
      } else if (error) {
        console.error("OAuth error:", error);
      }
    };

    // Check on mount
    handleHashChange();
    
    // Listen for hash changes (OAuth callback returns with #fb_token=...)
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    checkConnection();
    const handleAuthSuccess = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkConnection();
      }
    };
    window.addEventListener('message', handleAuthSuccess);
    return () => window.removeEventListener('message', handleAuthSuccess);
  }, []);

  return { igConnected, setIgConnected, hasPublishPerm, setHasPublishPerm, profileInfo, setProfileInfo, showIgModal, setShowIgModal, modalInitialTab, setModalInitialTab, checkConnection };
};