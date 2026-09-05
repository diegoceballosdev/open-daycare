// Datos mock de la invitación a una familia.
// Fuente: references/pantallas/activar-cuenta.dc.html

export interface Invitation {
  childInitials: string; // "M"
  childName: string; // "Mateo · Sala Soles"
  code: string; // "7K4P9"
  email: string; // "lucia.fernandez@gmail.com"
}

export const invitation: Invitation = {
  childInitials: "M",
  childName: "Mateo · Sala Soles",
  code: "7K4P9",
  email: "lucia.fernandez@gmail.com",
};
