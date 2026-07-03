import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postService } from "@/services/postService";
import { useAuth } from "@/contexts/AuthContext";

export const usePosts = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['posts', user?.id],
    queryFn: ({ pageParam }) => postService.loadPosts(user!.id, 10, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (lastPage.posts.length < 10) return undefined;
      return (lastPageParam as number) + 10;
    },
    enabled: !!user,
  });

  const posts = data?.pages.flatMap(page => page.posts) ?? [];

  const mutation = useMutation({
    mutationFn: (post: any) => postService.savePost(user!.id, post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', user?.id] });
    }
  });

  const setPosts = (newPosts: any[]) => {
      // For now, simple override of cache
      queryClient.setQueryData(['posts', user?.id], (oldData: any) => {
          if (!oldData) return oldData;
          return {
              ...oldData,
              pages: [{ posts: newPosts }]
          };
      });
  };

  return { posts, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, savePosts: mutation.mutate, setPosts, quotaWarning: false };
};
