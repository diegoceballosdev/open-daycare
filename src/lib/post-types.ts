// Mapeo entre los tipos de publicación de la base (`post_type`) y la UI en español.
// Replica los colores de references/pantallas/crear-publicacion.dc.html y feed.dc.html.

export type PostType = "meal" | "nap" | "activity" | "achievement" | "photo" | "announcement";

// Orden de los chips TIPO en el modal; "Ánimo" no existe en la base y se retira.
export const postTypes: PostType[] = ["meal", "nap", "activity", "achievement", "photo", "announcement"];

// Etiqueta en español de cada tipo (modal y badge del feed).
export const typeLabel: Record<PostType, string> = {
  meal: "Comida",
  nap: "Siesta",
  activity: "Actividad",
  achievement: "Logro",
  photo: "Foto",
  announcement: "Anuncio",
};

export interface PostTypeTheme {
  // Chip inactivo del modal (fondo suave y texto)
  softBackground: string;
  softText: string;
  // Chip activo del modal
  filledBackground: string;
}

export const typeTheme: Record<PostType, PostTypeTheme> = {
  meal: { softBackground: "#F7E7A6", softText: "#9A7B1E", filledBackground: "#9A7B1E" },
  nap: { softBackground: "#E7DCF6", softText: "#7B5FC0", filledBackground: "#7B5FC0" },
  activity: { softBackground: "#C7E7F1", softText: "#2E89A6", filledBackground: "#2E89A6" },
  achievement: { softBackground: "#CFEBD8", softText: "#3E9B6C", filledBackground: "#3E9B6C" },
  photo: { softBackground: "#FBD8CC", softText: "#D9684A", filledBackground: "#D9684A" },
  announcement: { softBackground: "#CCD8F4", softText: "#4E72C8", filledBackground: "#4E72C8" },
};

export interface FeedPhoto {
  path: string;
  width: number | null;
  height: number | null;
  signedUrl: string | null;
}

export interface FeedPost {
  id: string;
  type: PostType;
  body: string;
  publishedAt: string;
  authorId: string;
  authorName: string;
  isRoomAnnouncement: boolean;
  audienceLabel: string;
  photos: FeedPhoto[];
  likes: number;
  comments: number;
}
