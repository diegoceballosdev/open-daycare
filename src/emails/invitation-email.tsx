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

interface InvitationEmailProps {
  childFirstName: string;
  code: string;
  intendedEmail: string;
  origin?: string;
}

// Plantilla del correo de invitación para vincular a un padre con su hijo.
// Fuente visual: references/pantallas/activar-cuenta.dc.html (misma identidad de marca).
export default function InvitationEmail({
  childFirstName,
  code,
  intendedEmail,
  origin = "http://localhost:3000",
}: InvitationEmailProps) {
  const activateUrl = new URL("/activar", origin);
  activateUrl.searchParams.set("code", code);
  activateUrl.searchParams.set("email", intendedEmail);

  return (
    <Html lang="es">
      <Preview>
        Te invitaron a seguir el día de {childFirstName}. Activá tu cuenta con
        este código.
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
            Te invitamos a seguir el día de {childFirstName}. Activá tu cuenta
            con el siguiente código.
          </Text>

          <Text style={intendedEmailNote}>
            El código de abajo corresponde a la cuenta{" "}
            <strong>{intendedEmail}</strong>. Si ese email no es tuyo, podés
            ignorar este correo.
          </Text>

          {/* Código destacado */}
          <Section style={codeBox}>
            <Text style={codeLabel}>CÓDIGO DE INVITACIÓN</Text>
            <Text style={codeValue}>{code}</Text>
            <Text style={codeHint}>Vence en 7 días</Text>
          </Section>

          <Button href={activateUrl.toString()} style={button}>
            Activar mi cuenta
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            Si no esperabas esta invitación, podés ignorar este correo.
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
  fontFamily:
    "'Nunito', 'Segoe UI', Arial, Helvetica, sans-serif",
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

const intendedEmailNote = {
  margin: "0 0 24px",
  fontSize: "13px",
  lineHeight: "1.5",
  color: "#94887b",
  textAlign: "center" as const,
};

const codeBox = {
  margin: "0 0 22px",
  padding: "20px",
  border: "1.5px solid #E6D08A",
  borderRadius: "16px",
  background: "#fbf1d6",
  textAlign: "center" as const,
};

const codeLabel = {
  margin: "0 0 6px",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "1px",
  color: "#a88526",
};

const codeValue = {
  margin: "0 0 4px",
  fontSize: "34px",
  fontWeight: 700,
  letterSpacing: "8px",
  color: "#8a7234",
  fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif",
};

const codeHint = {
  margin: "0",
  fontSize: "12.5px",
  color: "#a88526",
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
