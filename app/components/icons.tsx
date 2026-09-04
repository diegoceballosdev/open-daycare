import type { PropsWithChildren } from "react";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

interface IconTemplateProps extends PropsWithChildren<IconProps> {
  size: number;
  strokeWidth?: string | number;
}

// Plantilla base: atributos comunes de los SVG del mock (trazo, esquinas redondeadas, hereda el color actual)
function IconTemplate({ children, size, strokeWidth = 2, ...props }: IconTemplateProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

// Icono de home (nav "Feed")
export function HomeIcon(props: IconProps) {
  return (
    <IconTemplate size={19} {...props}>
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </IconTemplate>
  );
}

// Icono de usuarios (nav "Niños")
export function UsersIcon(props: IconProps) {
  return (
    <IconTemplate size={19} {...props}>
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
    </IconTemplate>
  );
}

// Icono de campana (nav "Avisos")
export function BellIcon(props: IconProps) {
  return (
    <IconTemplate size={19} {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
    </IconTemplate>
  );
}

// Icono de usuario (nav "Mi cuenta")
export function UserIcon(props: IconProps) {
  return (
    <IconTemplate size={19} {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </IconTemplate>
  );
}

// Icono de cerrar sesión
export function LogoutIcon(props: IconProps) {
  return (
    <IconTemplate size={16} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </IconTemplate>
  );
}

// Icono de más (botón "Nueva publicación")
export function PlusIcon(props: IconProps) {
  return (
    <IconTemplate size={17} strokeWidth={2.4} {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconTemplate>
  );
}

// Icono de cámara (composer)
export function CameraIcon(props: IconProps) {
  return (
    <IconTemplate size={19} {...props}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </IconTemplate>
  );
}

// Icono de corazón (me gusta, relleno salmón como en el mock)
export function HeartIcon(props: IconProps) {
  return (
    <IconTemplate size={19} fill="#E0654A" {...props}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </IconTemplate>
  );
}

// Icono de mensaje (comentarios)
export function MessageIcon(props: IconProps) {
  return (
    <IconTemplate size={18} {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
    </IconTemplate>
  );
}

// Icono de megáfono (avatar del anuncio)
export function MegaphoneIcon(props: IconProps) {
  return (
    <IconTemplate size={20} {...props}>
      <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </IconTemplate>
  );
}

// Icono de sol (marca OpenDayCare)
export function SunIcon(props: IconProps) {
  return (
    <IconTemplate size={21} strokeWidth={2.2} stroke="#fff" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </IconTemplate>
  );
}

// Icono de imagen (placeholder de foto)
export function ImageIcon(props: IconProps) {
  return (
    <IconTemplate size={30} strokeWidth={1.7} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
    </IconTemplate>
  );
}