import { useQuery } from "@tanstack/react-query";
import * as feedApi from "../api/feed";
import type { FeedType } from "../api/feed";

export const useFeed = (type: FeedType, page: number, enabled = true) =>
  useQuery({
    queryKey: ["feed", type, page],
    queryFn: () => feedApi.getFeed(type, page),
    enabled,
  });
