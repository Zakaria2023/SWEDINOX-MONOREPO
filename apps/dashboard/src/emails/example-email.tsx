import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type ExampleEmailProps = {
  recipientName: string;
};

export const ExampleEmail = ({ recipientName }: ExampleEmailProps) => (
  <Html lang="en">
    <Head />
    <Preview>Example transactional email from Swedinox</Preview>
    <Body style={body}>
      <Container style={container}>
        <Section>
          <Heading as="h1" style={heading}>
            Hello {recipientName},
          </Heading>
          <Text style={text}>
            This is an example template. Duplicate this file in{" "}
            <code>src/emails</code> to create new emails, and preview them with{" "}
            <code>pnpm email:dev</code>.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

ExampleEmail.PreviewProps = {
  recipientName: "Adnan",
} satisfies ExampleEmailProps;

const body = {
  backgroundColor: "#f6f6f6",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px",
};

const heading = {
  fontSize: "20px",
  margin: "0 0 16px",
};

const text = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "22px",
  margin: 0,
};
