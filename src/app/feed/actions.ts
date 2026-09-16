"use server";

import { revalidatePath } from "next/cache";
import type { Json } from "@/lib/database.types";
import type { FeedPost, PostType } from "@/lib/post-types";
import { postTypes } from "@/lib/post-types";
import { createClient } from "@/utils/supabase/server";

// Bucket privado de imágenes de publicaciones (SPEC 14).
const BUCKET = "post-images";
// Tope de fotos por publicación (mismo que valida el modal).
const MAX_PHOTOS = 10;
// Misma cota que el bucket (10MB): falla con un mensaje claro antes de subir.
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/webp", "image/jpeg", "image/png"];
// TTL de las URLs firmadas (1h); se re-firman en cada página del cursor.
const SIGNED_URL_TTL_SECONDS = 60 * 60;
// Tamaño de página del feed.
const FEED_PAGE_SIZE = 10;
// Nombre de respaldo cuando RLS no deja leer al autor (caso del padre).
const FALLBACK_AUTHOR_NAME = "Equipo";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface CreatePostState {
  error?: string;
  success?: boolean;
}

// Última publicación de la página: define el keyset (published_at, id).
export interface FeedCursor {
  publishedAt: string;
  id: string;
}

// Meta de cada foto enviada por el modal, alineada por índice con los archivos.
interface PhotoMeta {
  width: number | null;
  height: number | null;
}

function isPostType(value: string): value is PostType {
  return (postTypes as string[]).includes(value);
}

// El modal manda la meta como JSON; si viene rota, se guardan dimensiones nulas.
function parsePhotoMeta(raw: string): PhotoMeta[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => {
      const meta = item as { width?: unknown; height?: unknown };
      return {
        width: typeof meta.width === "number" ? meta.width : null,
        height: typeof meta.height === "number" ? meta.height : null,
      };
    });
  } catch {
    return [];
  }
}

function photoFiles(formData: FormData): File[] {
  return formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

// Borra objetos de Storage: compensación cuando falla una subida o el RPC.
async function removeObjects(supabase: Supabase, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(BUCKET).remove(paths);
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function buildAudienceLabel(isRoomAnnouncement: boolean, childNames: string[]): string {
  if (isRoomAnnouncement) return "Para: toda la sala";
  if (childNames.length === 0) return "Para: la familia";
  return `Para: familia de ${childNames.join(", ")}`;
}

// Publica: valida, sube las imágenes y recién entonces llama al RPC transaccional.
// Si algo falla, borra lo subido y no se guarda ninguna fila (todo o nada).
export async function createPost(
  _prevState: CreatePostState,
  formData: FormData
): Promise<CreatePostState> {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const authorId = claims?.claims?.sub;
  if (!authorId) {
    return { error: "Tu sesión expiró. Volvé a ingresar." };
  }

  const type = String(formData.get("type") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const roomIdRaw = String(formData.get("roomId") ?? "").trim();
  const roomId = roomIdRaw === "" ? null : roomIdRaw;
  const childIds = formData
    .getAll("childIds")
    .map((value) => String(value))
    .filter((value) => value !== "");
  const photos = photoFiles(formData);
  const photoMeta = parsePhotoMeta(String(formData.get("photoMeta") ?? "[]"));

  // Validaciones (mismas reglas que el RPC create_post, para dar el error antes de subir).
  if (!isPostType(type)) {
    return { error: "Elegí un tipo de publicación." };
  }
  if (body === "") {
    return { error: "La descripción es obligatoria." };
  }
  if (roomId !== null && childIds.length > 0) {
    return { error: "Elegí niños o toda la sala, no ambos." };
  }
  if (roomId === null && childIds.length === 0) {
    return { error: "Elegí al menos un destinatario." };
  }
  if (photos.length > MAX_PHOTOS) {
    return { error: `Podés subir hasta ${MAX_PHOTOS} fotos.` };
  }
  if (type === "photo" && photos.length === 0) {
    return { error: "El tipo Foto requiere al menos una imagen." };
  }
  for (const file of photos) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { error: "Formato de imagen no permitido (WebP, JPEG o PNG)." };
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return { error: "Cada imagen debe pesar menos de 10MB." };
    }
  }

  // El primer segmento del path tiene que ser el daycare del autor (policy de Storage).
  const { data: daycareId, error: daycareError } = await supabase.rpc("current_daycare_id");
  if (daycareError || !daycareId) {
    return { error: "No pudimos identificar tu guardería." };
  }

  const postId = crypto.randomUUID();
  const uploaded: { path: string; width: number | null; height: number | null; position: number }[] = [];

  for (let index = 0; index < photos.length; index++) {
    const file = photos[index];
    const path = `${daycareId}/${postId}/${crypto.randomUUID()}.webp`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: "image/webp" });

    if (uploadError) {
      await removeObjects(supabase, uploaded.map((item) => item.path));
      return { error: "No pudimos subir las imágenes. Intentá de nuevo." };
    }

    uploaded.push({
      path,
      width: photoMeta[index]?.width ?? null,
      height: photoMeta[index]?.height ?? null,
      position: index,
    });
  }

  // El generador de tipos pierde la nulabilidad de los argumentos: `roomId` puede ser null.
  const { error: rpcError } = await supabase.rpc("create_post", {
    p_type: type,
    p_body: body,
    p_room_id: roomId as string,
    p_child_ids: childIds,
    p_photos: uploaded as unknown as Json,
  });

  if (rpcError) {
    await removeObjects(supabase, uploaded.map((item) => item.path));
    return { error: "No pudimos guardar la publicación. Intentá de nuevo." };
  }

  revalidatePath("/");
  return { success: true };
}

// Resuelve una página del feed (misma consulta para la carga inicial y "Ver más").
async function resolveFeedPage(cursor: FeedCursor | null): Promise<FeedPost[]> {
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("id, type, body, published_at, author_id, room_id")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(FEED_PAGE_SIZE);

  if (cursor) {
    // Keyset (published_at, id) < cursor. Ver Risk: el `.or()` con timestamptz es frágil.
    query = query.or(
      `published_at.lt."${cursor.publishedAt}",and(published_at.eq."${cursor.publishedAt}",id.lt."${cursor.id}")`
    );
  }

  const { data: posts, error } = await query;
  if (error || !posts || posts.length === 0) return [];

  const postIds = posts.map((post) => post.id);
  const authorIds = [...new Set(posts.map((post) => post.author_id))];

  const [{ data: links }, { data: photos }, { data: authors }] = await Promise.all([
    supabase.from("post_children").select("post_id, child_id").in("post_id", postIds),
    supabase
      .from("post_photos")
      .select("post_id, url, width, height, position")
      .in("post_id", postIds)
      .order("position"),
    supabase.from("users").select("id, full_name").in("id", authorIds),
  ]);

  const childIds = [...new Set((links ?? []).map((link) => link.child_id))];
  const childrenById = new Map<string, string>();
  if (childIds.length > 0) {
    const { data: children } = await supabase
      .from("children")
      .select("id, full_name")
      .in("id", childIds);
    for (const child of children ?? []) {
      childrenById.set(child.id, child.full_name);
    }
  }

  const authorsById = new Map((authors ?? []).map((author) => [author.id, author.full_name]));

  // Firma las URLs del bucket privado; si falla, la foto conserva solo el path.
  const paths = [...new Set((photos ?? []).map((photo) => photo.url))];
  const signedByPath = new Map<string, string | null>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    for (const item of signed ?? []) {
      if (item.path) signedByPath.set(item.path, item.signedUrl ?? item.signedURL ?? null);
    }
  }

  return posts.map((post) => {
    const isRoomAnnouncement = post.room_id !== null;
    const childNames = (links ?? [])
      .filter((link) => link.post_id === post.id)
      .map((link) => childrenById.get(link.child_id))
      .filter((name): name is string => Boolean(name))
      .map(firstName);

    return {
      id: post.id,
      type: post.type,
      body: post.body,
      publishedAt: post.published_at,
      authorId: post.author_id,
      authorName: authorsById.get(post.author_id) ?? FALLBACK_AUTHOR_NAME,
      isRoomAnnouncement,
      audienceLabel: buildAudienceLabel(isRoomAnnouncement, childNames),
      photos: (photos ?? [])
        .filter((photo) => photo.post_id === post.id)
        .map((photo) => ({
          path: photo.url,
          width: photo.width,
          height: photo.height,
          signedUrl: signedByPath.get(photo.url) ?? null,
        })),
      likes: 0,
      comments: 0,
    };
  });
}

// "Ver más": siguiente página del feed a partir del último post cargado.
export async function loadMorePosts(cursor: FeedCursor | null): Promise<FeedPost[]> {
  return resolveFeedPage(cursor);
}
