import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/consts/queryKeys";
import { useAuth } from "@/hooks/use-auth";
import {
  updateOwnTeamMemberProfile,
  type UpdateOwnTeamMemberProfileInput,
} from "@/services/teamMemberProfileService";

export function useUpdateOwnTeamMemberProfile() {
  const queryClient = useQueryClient();
  const { user, refetchProfile } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateOwnTeamMemberProfileInput) => {
      if (!user) throw new Error("Usuário não autenticado.");
      await updateOwnTeamMemberProfile(user.id, input);
    },
    onSuccess: async () => {
      await refetchProfile();
      void queryClient.invalidateQueries({ queryKey: queryKeys.backoffice.member() });
    },
  });
}
