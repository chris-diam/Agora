import { useQuery } from "@tanstack/react-query";
import * as searchApi from "../api/search";

export const useSearch = (q: string) =>
  useQuery({
    queryKey: ["search", q],
    queryFn: () => searchApi.search(q),
    enabled: q.trim().length > 0,
  });
