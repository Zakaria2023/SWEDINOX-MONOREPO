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

interface CompanyWelcomeEmailProps {
  companyName: string;
}

const CompanyWelcomeEmail = ({ companyName }: CompanyWelcomeEmailProps) => (
  <Html lang="en">
    <Head />
    <Preview>Welcome — {companyName} is now a Swedinox partner</Preview>
    <Body style={body}>
      <Container style={container}>
        <Section>
          <Heading as="h1" style={heading}>
            Welcome aboard!
          </Heading>
          <Text style={text}>
            We are delighted to welcome <strong>{companyName}</strong> as a
            partner of Swedinox. Your company has been registered in our system,
            and we look forward to working together.
          </Text>
          <Text style={text}>
            If you have any questions, simply reply to this email — we are happy
            to help.
          </Text>
          <Hr style={divider} />
          <Text style={footer}>Warm regards, The Swedinox Team</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

CompanyWelcomeEmail.PreviewProps = {
  companyName: "Example Company AB",
} satisfies CompanyWelcomeEmailProps;

export default CompanyWelcomeEmail;

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
  margin: "0 0 12px",
};

const divider = {
  borderColor: "#e5e5e5",
  margin: "20px 0 16px",
};

const footer = {
  color: "#777777",
  fontSize: "13px",
  lineHeight: "20px",
  margin: 0,
};
