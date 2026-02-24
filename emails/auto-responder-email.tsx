import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

interface AutoResponderEmailProps {
  formTitle: string;
  subject: string;
  message: string;
}

export default function AutoResponderEmail({
  formTitle,
  subject,
  message,
}: AutoResponderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            margin: "40px auto",
            padding: "32px",
            borderRadius: "8px",
            maxWidth: "600px",
          }}
        >
          <Heading style={{ fontSize: "24px", fontWeight: "700" }}>
            {subject}
          </Heading>
          <Text
            style={{
              fontSize: "16px",
              lineHeight: "1.6",
              color: "#333",
              whiteSpace: "pre-wrap",
            }}
          >
            {message}
          </Text>
          <Text style={{ color: "#999", fontSize: "12px", marginTop: "32px" }}>
            This is an automated response from "{formTitle}" on GudForm.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
