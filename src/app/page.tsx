import Sidebar from "@/components/sidebar";
import Composer from "@/components/composer";
import PostCard from "@/components/post-card";
import { posts } from "@/data/posts";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
          {/* Cabecera */}
          <div className="mb-6">
            <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-accent">
              GUARDERÍA · SALA SOLES
            </div>
            <h1 className="m-0 font-display text-[30px] font-semibold text-ink">Buenas, Caro</h1>
            <p className="mt-[5px] text-[14.5px] text-ink-muted">12 niños · martes 17 jun</p>
          </div>

          <Composer />

          {/* Separador PUBLICADO HOY */}
          <div className="mb-[14px] flex items-center gap-[14px]">
            <span className="text-[12.5px] font-extrabold tracking-[.8px] text-divider-label">PUBLICADO HOY</span>
            <span className="h-px flex-1 bg-divider-strong" />
          </div>

          {/* Lista de publicaciones */}
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}