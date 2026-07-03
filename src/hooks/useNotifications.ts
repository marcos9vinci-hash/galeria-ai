import { useState } from "react";

export const useNotifications = () => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [dismissedNotifs, setDismissedNotifs] = useState<(number | string)[]>([]);
  return { showNotifs, setShowNotifs, dismissedNotifs, setDismissedNotifs };
};
