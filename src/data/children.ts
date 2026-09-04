// Datos mock de los niños de la sala Soles.
// Fuente: references/pantallas/ninos.dc.html y references/pantallas/perfil-nino.dc.html

export type ParentStatus = "active" | "pending";

export interface Parent {
  name: string;
  initials: string;
  relationship: string; // "Mamá", "Papá"
  avatarBackground: string;
  avatarForeground: string;
  status: ParentStatus;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  initials: string;
  avatarBackground: string;
  avatarForeground: string;
  room: string; // "Soles"
  birthDate: string; // "12 mar 2022"
  enrollmentDate: string; // "feb 2025"
  allergiesNote?: string; // texto libre, visible solo si existe
  allergyBadge?: string; // texto corto para el badge de la lista (ej. "MANÍ")
  parents: Parent[];
}

export const children: Child[] = [
  {
    id: "mateo-fernandez",
    name: "Mateo Fernández",
    age: 3,
    initials: "M",
    avatarBackground: "#A9D9E8",
    avatarForeground: "#1F7A93",
    room: "Soles",
    birthDate: "12 mar 2022",
    enrollmentDate: "feb 2025",
    allergiesNote: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    allergyBadge: "MANÍ",
    parents: [
      {
        name: "Lucía Fernández",
        initials: "L",
        relationship: "Mamá",
        avatarBackground: "#C9B6E8",
        avatarForeground: "#FFFFFF",
        status: "active",
      },
      {
        name: "Diego Fernández",
        initials: "D",
        relationship: "Papá",
        avatarBackground: "#A9C7E8",
        avatarForeground: "#FFFFFF",
        status: "pending",
      },
    ],
  },
  {
    id: "sofia-mendez",
    name: "Sofía Méndez",
    age: 2,
    initials: "S",
    avatarBackground: "#F4B8CC",
    avatarForeground: "#C44A7A",
    room: "Soles",
    birthDate: "14 jun 2023",
    enrollmentDate: "mar 2025",
    parents: [
      {
        name: "Carolina Méndez",
        initials: "C",
        relationship: "Mamá",
        avatarBackground: "#F4B8CC",
        avatarForeground: "#FFFFFF",
        status: "active",
      },
    ],
  },
  {
    id: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    age: 3,
    initials: "B",
    avatarBackground: "#B9DEC4",
    avatarForeground: "#3E8B62",
    room: "Soles",
    birthDate: "02 sep 2022",
    enrollmentDate: "ene 2025",
    parents: [
      {
        name: "Valeria Ruiz",
        initials: "V",
        relationship: "Mamá",
        avatarBackground: "#C9B6E8",
        avatarForeground: "#FFFFFF",
        status: "active",
      },
      {
        name: "Andrés Ruiz",
        initials: "A",
        relationship: "Papá",
        avatarBackground: "#A9C7E8",
        avatarForeground: "#FFFFFF",
        status: "pending",
      },
    ],
  },
  {
    id: "valentina-soto",
    name: "Valentina Soto",
    age: 2,
    initials: "V",
    avatarBackground: "#F4DC8E",
    avatarForeground: "#9A7B1E",
    room: "Soles",
    birthDate: "20 nov 2023",
    enrollmentDate: "abr 2025",
    parents: [],
  },
  {
    id: "tomas-diaz",
    name: "Tomás Díaz",
    age: 3,
    initials: "T",
    avatarBackground: "#C9B6E8",
    avatarForeground: "#7B5FC0",
    room: "Soles",
    birthDate: "08 ene 2022",
    enrollmentDate: "feb 2025",
    allergiesNote: "Alergia a la lactosa. Evitar lácteos. Trae su propia leche.",
    allergyBadge: "LACTOSA",
    parents: [
      {
        name: "Daniela Díaz",
        initials: "D",
        relationship: "Mamá",
        avatarBackground: "#B9DEC4",
        avatarForeground: "#FFFFFF",
        status: "active",
      },
    ],
  },
  {
    id: "emma-castro",
    name: "Emma Castro",
    age: 2,
    initials: "E",
    avatarBackground: "#F4B8CC",
    avatarForeground: "#C44A7A",
    room: "Soles",
    birthDate: "25 jul 2023",
    enrollmentDate: "may 2025",
    parents: [
      {
        name: "Patricia Castro",
        initials: "P",
        relationship: "Mamá",
        avatarBackground: "#F4DC8E",
        avatarForeground: "#FFFFFF",
        status: "active",
      },
    ],
  },
  {
    id: "lucas-romero",
    name: "Lucas Romero",
    age: 3,
    initials: "L",
    avatarBackground: "#A9D9E8",
    avatarForeground: "#1F7A93",
    room: "Soles",
    birthDate: "17 abr 2022",
    enrollmentDate: "ene 2025",
    parents: [
      {
        name: "Santiago Romero",
        initials: "S",
        relationship: "Papá",
        avatarBackground: "#C9B6E8",
        avatarForeground: "#FFFFFF",
        status: "pending",
      },
    ],
  },
  {
    id: "olivia-vega",
    name: "Olivia Vega",
    age: 2,
    initials: "O",
    avatarBackground: "#B9DEC4",
    avatarForeground: "#3E8B62",
    room: "Soles",
    birthDate: "30 ago 2023",
    enrollmentDate: "mar 2025",
    parents: [
      {
        name: "Camila Vega",
        initials: "C",
        relationship: "Mamá",
        avatarBackground: "#A9C7E8",
        avatarForeground: "#FFFFFF",
        status: "active",
      },
    ],
  },
];