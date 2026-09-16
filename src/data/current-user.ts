// Identidad mock de cabecera/sidebar (todavía no viene del perfil real).
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
