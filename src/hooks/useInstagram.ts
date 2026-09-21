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
