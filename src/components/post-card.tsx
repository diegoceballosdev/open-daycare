import type { FeedPost } from "@/lib/post-types";
import { typeLabel, typeTheme } from "@/lib/post-types";
import { formatTime } from "@/lib/date-format";
import { HeartIcon, MegaphoneIcon, MessageIcon } from "@/components/icons";

interface PostCardProps {
  post: FeedPost;
  // Id del usuario logueado: define el "publicado por vos" del subtítulo.
  currentUserId: string;
}

// Iniciales del autor a partir de su nombre completo (máximo dos letras).
function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

// Tarjeta de una publicación del feed: réplica del mock references/pantallas/feed.dc.html.
export default function PostCard({ post, currentUserId }: PostCardProps) {
  const theme = typeTheme[post.type];
  const isAnnouncement = post.isRoomAnnouncement;
  const title = isAnnouncement ? "Anuncio general" : post.authorName;
  const authorLabel = post.authorId === currentUserId ? "publicado por vos" : post.authorName;

  return (
    <article className="rounded-[20px] border border-line bg-surface px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      {/* Cabecera: avatar, autor y badge de tipo */}
      <div className="mb-[14px] flex items-center gap-3">
        {isAnnouncement ? (
          <div
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full"
            style={{ backgroundColor: "#CCD8F4", color: "#4E72C8" }}
          >
            <MegaphoneIcon />
          </div>
        ) : (
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand font-display text-[17px] font-semibold text-white">
            {initials(post.authorName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-display text-[16.5px] font-semibold leading-tight text-ink">{title}</div>
          <div className="text-[12.5px] text-ink-faint">
            {formatTime(post.publishedAt)} · {authorLabel}
          </div>
        </div>
        <div
          className="flex items-center gap-[7px] rounded-full px-3 py-1.5"
          style={{ backgroundColor: theme.softBackground, color: theme.softText }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.softText }} />
          <span className="text-xs font-extrabold uppercase tracking-[.5px]">{typeLabel[post.type]}</span>
        </div>
      </div>

      {/* Audiencia y cuerpo */}
      <div className="mb-2.5 text-[12.5px] text-ink-faint">{post.audienceLabel}</div>
      <p className="m-0 text-[15.5px] leading-[1.55] text-ink-body">{post.body}</p>

      {/* Imágenes desde URLs firmadas del bucket privado */}
      {post.photos.length > 0 && (
        <div className="mt-3.5 flex flex-col gap-2.5">
          {post.photos.map((photo) =>
            photo.signedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.path}
                src={photo.signedUrl}
                alt=""
                className="w-full rounded-[16px] border border-line object-cover"
              />
            ) : null
          )}
        </div>
      )}

      {/* Reacciones (contadores en 0 en esta spec) y Editar inerte */}
      <div className="mt-4 flex items-center gap-[18px] border-t border-divider pt-3.5">
        <span className="flex items-center gap-[7px] text-sm font-bold text-accent-strong">
          <HeartIcon />
          {post.likes}
        </span>
        <a href="#" className="flex items-center gap-[7px] text-sm font-bold text-ink-muted">
          <MessageIcon />
          {post.comments}
        </a>
        <span className="flex-1" />
        <a href="#" className="text-sm font-extrabold text-accent-edit">
          Editar
        </a>
      </div>
    </article>
  );
}
