"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import Sidebar from "@/components/sidebar";
import Composer from "@/components/composer";
import NewPostModal, { type PostKid } from "@/components/new-post-modal";
import PostCard from "@/components/post-card";
import { currentUser } from "@/data/current-user";
import { loadMorePosts } from "@/app/feed/actions";
import type { FeedPost } from "@/lib/post-types";
import { dayKey, formatDayLabel } from "@/lib/date-format";

interface FeedClientProps {
  initialPosts: FeedPost[];
  canPublish: boolean;
  currentUserId: string;
  kids: PostKid[];
  roomId: string | null;
  roomName: string;
}

const PAGE_SIZE = 10;

// Feed: estado del modal, lista de publicaciones y paginación por cursor.
// Renderiza el sidebar, el composer y la lista (arquitectura elegida en el spec).
export default function FeedClient({
  initialPosts,
  canPublish,
  currentUserId,
  kids,
  roomId,
  roomName,
}: FeedClientProps) {
  const [newPostOpen, setNewPostOpen] = useState(false);
  // Páginas extra de "Ver más"; la primera viene del servidor.
  const [extraPosts, setExtraPosts] = useState<FeedPost[]>([]);
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const openNewPost = useCallback(() => setNewPostOpen(true), []);
  const closeNewPost = useCallback(() => setNewPostOpen(false), []);

  // Une la página del servidor con las de "Ver más", sin duplicar ids.
  // Al publicar, `router.refresh()` actualiza `initialPosts` y el post nuevo aparece primero.
  const posts = useMemo(() => {
    const seen = new Set<string>();
    const merged: FeedPost[] = [];
    for (const post of [...initialPosts, ...extraPosts]) {
      if (seen.has(post.id)) continue;
      seen.add(post.id);
      merged.push(post);
    }
    return merged;
  }, [initialPosts, extraPosts]);

  async function handleLoadMore() {
    const last = posts[posts.length - 1];
    if (!last) return;

    setIsLoadingMore(true);
    try {
      const next = await loadMorePosts({ publishedAt: last.publishedAt, id: last.id });
      setExtraPosts((prev) => [...prev, ...next]);
      setHasMore(next.length === PAGE_SIZE);
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar onNewPost={openNewPost} canPublish={canPublish} />

      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
          {/* Cabecera (identidad mock: fuera del alcance de esta spec) */}
          <div className="mb-6">
            <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-accent">
              GUARDERÍA · {currentUser.classroom.toUpperCase()}
            </div>
            <h1 className="m-0 font-display text-[30px] font-semibold text-ink">
              Buenas, {currentUser.name.split(" ")[0]}
            </h1>
            <p className="mt-[5px] text-[14.5px] text-ink-muted">12 niños · martes 17 jun</p>
          </div>

          <Composer onOpen={openNewPost} canPublish={canPublish} />

          {posts.length === 0 ? (
            <EmptyState canPublish={canPublish} onOpen={openNewPost} />
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map((post, index) => {
                const previous = posts[index - 1];
                const showDayDivider = !previous || dayKey(post.publishedAt) !== dayKey(previous.publishedAt);
                return (
                  <Fragment key={post.id}>
                    {showDayDivider && <DayDivider label={formatDayLabel(post.publishedAt)} />}
                    <PostCard post={post} currentUserId={currentUserId} />
                  </Fragment>
                );
              })}
            </div>
          )}

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="rounded-[14px] border border-line bg-surface px-[22px] py-[11px] text-[14.5px] font-extrabold text-ink-nav disabled:opacity-60"
              >
                {isLoadingMore ? "Cargando…" : "Ver más"}
              </button>
            </div>
          )}
        </div>
      </main>

      <NewPostModal
        open={newPostOpen}
        onClose={closeNewPost}
        kids={kids}
        roomId={roomId}
        roomName={roomName}
        canPublishWholeRoom={roomId !== null}
      />
    </div>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-[14px] pb-1 pt-2">
      <span className="text-[12.5px] font-extrabold tracking-[.8px] text-divider-label">{label}</span>
      <span className="h-px flex-1 bg-divider-strong" />
    </div>
  );
}

function EmptyState({ canPublish, onOpen }: { canPublish: boolean; onOpen: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-[20px] border border-dashed border-photo-line bg-surface px-6 py-14 text-center">
      <p className="m-0 text-[15.5px] text-ink-muted">Todavía no hay publicaciones.</p>
      {canPublish && (
        <button
          type="button"
          onClick={onOpen}
          className="rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-5 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
        >
          Crear publicación
        </button>
      )}
    </div>
  );
}
