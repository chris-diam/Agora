import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import * as communitiesApi from "../api/communities";

export const useCommunities = (params: communitiesApi.ListCommunitiesParams) =>
  useQuery({ queryKey: ["communities", params], queryFn: () => communitiesApi.listCommunities(params) });

export const useCommunity = (id: string) =>
  useQuery({
    queryKey: ["communities", id],
    queryFn: () => communitiesApi.getCommunity(id),
    enabled: Boolean(id),
  });

export const useCreateCommunity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: communitiesApi.CreateCommunityInput) => communitiesApi.createCommunity(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
  });
};

const invalidateCommunity = (queryClient: QueryClient, id: string) => {
  queryClient.invalidateQueries({ queryKey: ["communities"] });
  queryClient.invalidateQueries({ queryKey: ["communities", id] });
};

export const useJoinCommunity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communitiesApi.joinCommunity(id),
    onSuccess: (_result, id) => invalidateCommunity(queryClient, id),
  });
};

export const useLeaveCommunity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communitiesApi.leaveCommunity(id),
    onSuccess: (_result, id) => invalidateCommunity(queryClient, id),
  });
};
