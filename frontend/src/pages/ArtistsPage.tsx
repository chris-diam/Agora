import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { MicIcon } from "../components/icons";
import { Pagination } from "../components/Pagination";
import { useArtists } from "../hooks/useUsers";

export function ArtistsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useArtists({ page });
  const artists = data?.data ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <section className="relative overflow-hidden rounded-3xl border border-agora-border bg-agora-surface/80 p-6 shadow-sm shadow-black/20 backdrop-blur-xl">
        <div
          aria-hidden
          className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20 blur-2xl"
          style={{ background: "var(--color-agora)" }}
        />
        <MicIcon className="mb-3 h-8 w-8 text-agora" />
        <h1 className="text-3xl font-semibold text-agora-text" style={{ fontFamily: "Wellfleet, serif" }}>
          Artists
        </h1>
        <p className="mt-1 text-agora-muted">
          People on KYMA who've added a profession to their profile — musicians, designers, and other creators.
        </p>
      </section>

      {isLoading && <p className="text-agora-muted">Loading artists...</p>}
      {isError && <p className="text-red-500">Could not load artists.</p>}
      {!isLoading && artists.length === 0 && (
        <p className="text-agora-muted">No one has added a profession to their profile yet.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist) => (
          <Link
            key={artist.id}
            to={`/profile/${artist.id}`}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-agora-border bg-agora-surface/80 p-5 text-center shadow-sm shadow-black/20 backdrop-blur-xl transition-colors hover:border-agora/50"
          >
            <Avatar name={artist.displayName} imageUrl={artist.profileImageUrl} size="lg" />
            <p className="truncate font-medium text-agora-text" style={{ fontFamily: "Wellfleet, serif" }}>
              {artist.displayName}
            </p>
            {artist.profession && (
              <span className="rounded-full bg-agora-light px-2.5 py-0.5 text-xs text-agora-muted group-hover:bg-agora group-hover:text-agora-on">
                {artist.profession}
              </span>
            )}
            {(artist.city || artist.country) && (
              <p className="truncate text-xs text-agora-dim">{[artist.city, artist.country].filter(Boolean).join(", ")}</p>
            )}
          </Link>
        ))}
      </div>

      {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
