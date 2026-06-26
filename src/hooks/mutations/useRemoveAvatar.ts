import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/consts/queryKeys";
import { useAuth } from "@/hooks/use-auth";
import { removeUserAvatar } from "@/services/avatarService";

export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  const { user, profile, refetchProfile } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado.");
      await removeUserAvatar(user.id, profile?.avatar_path);
    },
    onSuccess: async () => {
      await refetchProfile();
      void queryClient.invalidateQueries({ queryKey: queryKeys.backoffice.member() });
    },
  });
}
