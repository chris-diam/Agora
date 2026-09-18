import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { Pagination } from "../components/Pagination";
import { useArtists } from "../hooks/useUsers";

export function ArtistsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useArtists({ page });
  const artists = data?.data ?? [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <section className="rounded-3xl border border-agora-border bg-agora-surface/80 p-6 shadow-sm shadow-black/20 backdrop-blur-xl">
        <h1 className="text-3xl font-semibold text-agora-text">Artists</h1>
        <p className="mt-1 text-agora-muted">
          People on KYMA who've added a profession to their profile — musicians, designers, and other creators.
        </p>
      </section>

      {isLoading && <p className="text-agora-muted">Loading artists...</p>}
      {isError && <p className="text-red-500">Could not load artists.</p>}
      {!isLoading && artists.length === 0 && (
        <p className="text-agora-muted">No one has added a profession to their profile yet.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {artists.map((artist) => (
          <Link
            key={artist.id}
            to={`/profile/${artist.id}`}
            className="flex items-center gap-3 rounded-2xl border border-agora-border bg-agora-surface/80 p-4 shadow-sm shadow-black/20 backdrop-blur-xl hover:bg-agora-surface"
          >
            <Avatar name={artist.displayName} imageUrl={artist.profileImageUrl} size="md" />
            <div className="min-w-0">
              <p className="truncate font-medium text-agora-text">{artist.displayName}</p>
              <p className="truncate text-sm text-agora">{artist.profession}</p>
            </div>
          </Link>
        ))}
      </div>

      {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
