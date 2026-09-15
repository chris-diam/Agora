import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as interestsApi from "../api/interests";

export const useInterests = () => useQuery({ queryKey: ["interests"], queryFn: () => interestsApi.listInterests() });

export const useSetMyInterests = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (interestIds: string[]) => interestsApi.setMyInterests(interestIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
};
