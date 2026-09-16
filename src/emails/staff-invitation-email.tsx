import {
  Body,
  Button,
  Container,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

interface StaffInvitationEmailProps {
  staffName: string;
  daycareName: string;
  actionLink: string;
}

// Plantilla del correo de invitación para el alta de staff desde /equipo.
// Misma identidad visual que invitation-email.tsx (referencia: references/pantallas/activar-cuenta.dc.html).
export default function StaffInvitationEmail({
  staffName,
  daycareName,
  actionLink,
}: StaffInvitationEmailProps) {
  return (
    <Html lang="es">
      <Preview>
        Te invitaron a formar parte del equipo de {daycareName}. Definí tu
        contraseña para empezar.
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Logo OpenDayCare */}
          <Section style={logoRow}>
            <div style={logo}>
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            </div>
          </Section>

          <Text style={heading}>Bienvenida a OpenDayCare</Text>
          <Text style={subheading}>
            Hola {staffName}, fuiste invitado a formar parte del equipo de{" "}
            <strong>{daycareName}</strong>. Definí tu contraseña para entrar.
          </Text>

          <Text style={note}>
            Si no esperabas esta invitación, podés ignorar este correo.
          </Text>

          <Button href={actionLink} style={button}>
            Definir mi contraseña
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            Por seguridad, el enlace vence en poco tiempo. Si expira, pedile al
            administrador que te reenvíe la invitación.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  margin: 0,
  padding: "40px 16px",
  backgroundColor: "#fbf4ec",
  fontFamily: "'Nunito', 'Segoe UI', Arial, Helvetica, sans-serif",
};

const container = {
  maxWidth: "440px",
  margin: "0 auto",
};

const logoRow = {
  textAlign: "center" as const,
  marginBottom: "22px",
};

const logo = {
  display: "inline-block",
  width: "58px",
  height: "58px",
  borderRadius: "18px",
  background: "linear-gradient(155deg, #F8C3A8, #F2937A)",
  boxShadow: "0 12px 26px -10px rgba(238,129,100,.65)",
};

const heading = {
  margin: "0 0 8px",
  fontSize: "30px",
  fontWeight: 700,
  color: "#3f362e",
  textAlign: "center" as const,
};

const subheading = {
  margin: "0 0 24px",
  fontSize: "15px",
  lineHeight: "1.55",
  color: "#94887b",
  textAlign: "center" as const,
};

const note = {
  margin: "0 0 24px",
  fontSize: "13px",
  lineHeight: "1.5",
  color: "#94887b",
  textAlign: "center" as const,
};

const button = {
  display: "block",
  margin: "0 auto",
  padding: "15px 24px",
  borderRadius: "15px",
  background: "linear-gradient(180deg, #F4977E, #EE8164)",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 800,
  textDecoration: "none",
  textAlign: "center" as const,
  boxShadow: "0 10px 22px -8px rgba(238,129,100,.7)",
};

const hr = {
  margin: "26px 0 14px",
  borderColor: "#ece0d0",
};

const footer = {
  margin: "0",
  fontSize: "13px",
  lineHeight: "1.5",
  color: "#a89a8b",
  textAlign: "center" as const,
};
