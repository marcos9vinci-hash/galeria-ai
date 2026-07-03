import { useState } from "react";

export const useSyncStatus = () => {
  const [loadingBuffer, setLoadingBuffer] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  return { loadingBuffer, setLoadingBuffer, isPlanning, setIsPlanning };
};
