import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface FormNotificationEmailProps {
  formTitle: string;
  responseCount: number;
  answers: { question: string; answer: string }[];
}

export default function FormNotificationEmail({
  formTitle,
  responseCount,
  answers,
}: FormNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New response on "{formTitle}"</Preview>
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
            New Form Response
          </Heading>
          <Text style={{ color: "#666", fontSize: "16px" }}>
            You received a new response on <strong>{formTitle}</strong>. This is
            response #{responseCount}.
          </Text>
          <Hr style={{ margin: "24px 0" }} />
          <Section>
            {answers.map((a, i) => (
              <div key={i} style={{ marginBottom: "16px" }}>
                <Text
                  style={{
                    fontSize: "13px",
                    color: "#999",
                    margin: "0 0 4px",
                  }}
                >
                  {a.question}
                </Text>
                <Text
                  style={{
                    fontSize: "16px",
                    color: "#333",
                    margin: "0",
                    fontWeight: "500",
                  }}
                >
                  {a.answer || "—"}
                </Text>
              </div>
            ))}
          </Section>
          <Hr style={{ margin: "24px 0" }} />
          <Text style={{ color: "#999", fontSize: "12px" }}>
            Sent by GudForm
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
