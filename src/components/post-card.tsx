import type { Post, PostType } from "@/data/posts";
import { HeartIcon, ImageIcon, MegaphoneIcon, MessageIcon } from "@/components/icons";

// Tema del badge por tipo de publicación: clave en inglés (PostType), etiqueta visual en español
const badgeTheme: Record<PostType, { label: string; background: string; dot: string; text: string }> = {
  achievement: { label: "LOGRO", background: "var(--color-success-soft)", dot: "var(--color-success)", text: "var(--color-success)" },
  activity: { label: "ACTIVIDAD", background: "var(--color-info-soft)", dot: "var(--color-info)", text: "var(--color-info)" },
  announcement: { label: "ANUNCIO", background: "var(--color-announcement-soft)", dot: "var(--color-announcement)", text: "var(--color-announcement)" },
};

export default function PostCard({ post }: { post: Post }) {
  const theme = badgeTheme[post.type];
  const { author } = post;

  return (
    <article className="rounded-[20px] border border-line bg-surface px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      {/* Cabecera: avatar, autor y badge */}
      <div className="mb-[14px] flex items-center gap-3">
        <div
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full font-display text-[17px] font-semibold"
          style={{ backgroundColor: author.avatarBackground, color: author.avatarForeground }}
        >
          {author.avatarIcon === "megaphone" ? <MegaphoneIcon /> : author.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[16.5px] font-semibold leading-tight text-ink">{author.name}</div>
          <div className="text-[12.5px] text-ink-faint">{post.time} · publicado por vos</div>
        </div>
        <div
          className="flex items-center gap-[7px] rounded-full px-3 py-1.5"
          style={{ backgroundColor: theme.background, color: theme.text }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.dot }} />
          <span className="text-xs font-extrabold tracking-[.5px]">{theme.label}</span>
        </div>
      </div>

      {/* Audiencia y cuerpo */}
      <div className="mb-2.5 text-[12.5px] text-ink-faint">{post.audienceLabel}</div>
      <p className="m-0 text-[15.5px] leading-[1.55] text-ink-body">{post.body}</p>

      {/* Placeholder de foto */}
      {post.photo && (
        <a
          href="#"
          className="mt-3.5 flex h-[200px] flex-col items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-dashed border-photo-line bg-photo-bg text-photo-ink"
        >
          <ImageIcon />
          <span className="text-[13.5px]">{post.photo.label}</span>
        </a>
      )}

      {/* Reacciones y editar */}
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