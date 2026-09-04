export type PostType = "achievement" | "activity" | "announcement";

export interface Author {
  name: string;
  initials: string;
  avatarBackground: string;
  avatarForeground: string;
  avatarIcon?: "megaphone";
}

export interface Post {
  id: string;
  type: PostType;
  author: Author;
  time: string;
  audienceLabel: string;
  body: string;
  photo?: { label: string };
  likes: number;
  comments: number;
}

export interface CurrentUser {
  name: string;
  initials: string;
  role: string;
  classroom: string;
}

export const currentUser: CurrentUser = {
  name: "Caro Giménez",
  initials: "C",
  role: "Maestra · Soles",
  classroom: "Sala Soles",
};

export const posts: Post[] = [
  {
    id: "logro-orinal",
    type: "achievement",
    author: {
      name: "Mateo",
      initials: "M",
      avatarBackground: "#A9D9E8",
      avatarForeground: "#1F7A93",
    },
    time: "14:20",
    audienceLabel: "Para: familia de Mateo",
    body: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "actividad-temperas",
    type: "activity",
    author: {
      name: "Mateo",
      initials: "M",
      avatarBackground: "#A9D9E8",
      avatarForeground: "#1F7A93",
    },
    time: "09:40",
    audienceLabel: "Para: familia de Mateo",
    body: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photo: { label: "Foto · pintando con témperas" },
    likes: 5,
    comments: 2,
  },
  {
    id: "anuncio-parque",
    type: "announcement",
    author: {
      name: "Anuncio general",
      initials: "",
      avatarBackground: "#CCD8F4",
      avatarForeground: "#4E72C8",
      avatarIcon: "megaphone",
    },
    time: "07:50",
    audienceLabel: "Para: toda la sala",
    body: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];