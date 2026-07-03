import { useState } from "react";

export const usePostEditor = () => {
  const [editorState, setEditorState] = useState<any>(null);
  const [draggedPostId, setDraggedPostId] = useState<number | null>(null);

  return { editorState, setEditorState, draggedPostId, setDraggedPostId };
};
