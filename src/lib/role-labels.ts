// Rol del usuario según el enum `user_role` de la base.
export type UserRole = "staff" | "parent" | "admin";

// Etiqueta del rol para la UI: el staff muestra su sala, el admin su rol y
// la familia el nombre del daycare (los padres no tienen sala).
export function roleLabel(role: UserRole, roomName: string | null, daycareName: string): string {
  if (role === "staff") return roomName ? `Maestra · ${roomName}` : daycareName;
  if (role === "admin") return "Administrador/a";
  return "Familia";
}
