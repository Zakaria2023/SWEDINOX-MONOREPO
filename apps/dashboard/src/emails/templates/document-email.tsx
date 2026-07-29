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
import { CSSProperties } from "react";

export type DocumentEmailField = {
  label: string;
  value: string;
};

export type DocumentEmailTable = {
  caption?: string;
  columns: string[];
  /**
   * Index of the first numeric column. From here on cells are right-aligned,
   * so quantities and amounts line up the way they do on the printed document.
   */
  alignRightFrom?: number;
  rows: string[][];
  /** Shown in place of the table when the document has no lines of this kind. */
  emptyNote?: string;
};

export type DocumentEmailTotal = {
  label: string;
  value: string;
  /** The bottom line — ruled off and set heavier than the build-up above it. */
  emphasis?: boolean;
};

export type DocumentEmailProps = {
  /** "Purchase order", "Invoice", … — heads the email and names the document. */
  documentLabel: string;
  /** How the document identifies itself to the recipient, e.g. "PO-1042". */
  reference: string;
  /** The company the document is addressed to. */
  companyName: string;
  /** One line saying what this document is and what it means for the reader. */
  intro: string;
  fields: DocumentEmailField[];
  tables: DocumentEmailTable[];
  totals: DocumentEmailTotal[];
  /** Free-text remark carried on the document itself, when it has one. */
  remark?: string;
};

/**
 * One layout for every document we mail out — purchase order, purchase invoice,
 * sales invoice and delivery note. Each of those is the same shape underneath:
 * a header of labelled fields, one or more tables of lines, and a set of
 * totals. Keeping it generic means the four documents stay visually identical
 * and a change to the styling lands in all of them at once.
 *
 * Laid out with plain tables and inline styles rather than flex or classes,
 * which is what email clients can actually be relied on to render.
 */
const DocumentEmail = ({
  documentLabel,
  reference,
  companyName,
  intro,
  fields,
  tables,
  totals,
  remark,
}: DocumentEmailProps) => (
  <Html lang="en">
    <Head />
    <Preview>
      {documentLabel} {reference} — {companyName}
    </Preview>
    <Body style={body}>
      <Container style={container}>
        <Heading as="h1" style={heading}>
          {documentLabel} {reference}
        </Heading>
        <Text style={addressee}>{companyName}</Text>
        <Text style={text}>{intro}</Text>

        {fields.length > 0 && (
          <table style={fieldTable}>
            <tbody>
              {fields.map((field) => (
                <tr key={field.label}>
                  <td style={fieldLabelCell}>{field.label}</td>
                  <td style={fieldValueCell}>{field.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tables.map((table) => (
          <Section key={table.caption ?? table.columns.join("|")}>
            {table.caption && <Text style={caption}>{table.caption}</Text>}
            {table.rows.length === 0 ? (
              <Text style={mutedText}>{table.emptyNote ?? "No lines."}</Text>
            ) : (
              <table style={lineTable}>
                <thead>
                  <tr>
                    {table.columns.map((column, columnIndex) => (
                      <th
                        key={column}
                        style={
                          columnIndex >=
                          (table.alignRightFrom ?? table.columns.length)
                            ? headCellRight
                            : headCell
                        }
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, rowIndex) => (
                    <tr key={`${table.caption ?? "lines"}-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${table.columns[cellIndex] ?? cellIndex}`}
                          style={
                            cellIndex >=
                            (table.alignRightFrom ?? table.columns.length)
                              ? lineCellRight
                              : lineCell
                          }
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        ))}

        {totals.length > 0 && (
          <table style={totalsTable}>
            <tbody>
              {totals.map((total) => (
                <tr key={total.label}>
                  <td style={total.emphasis ? totalLabelStrong : totalLabel}>
                    {total.label}
                  </td>
                  <td style={total.emphasis ? totalValueStrong : totalValue}>
                    {total.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {remark && (
          <>
            <Text style={caption}>Remarks</Text>
            <Text style={text}>{remark}</Text>
          </>
        )}

        <Hr style={divider} />
        <Text style={footer}>
          This message was generated automatically when the document was
          created. Reply to this email if anything on it looks wrong.
        </Text>
        <Text style={footer}>Swedinox</Text>
      </Container>
    </Body>
  </Html>
);

DocumentEmail.PreviewProps = {
  documentLabel: "Invoice",
  reference: "INV-1042",
  companyName: "Example Company AB",
  intro:
    "Please find the details of invoice INV-1042 below. The amount is due by 31/08/2026.",
  fields: [
    { label: "Invoice date", value: "01/08/2026" },
    { label: "Due date", value: "31/08/2026" },
    { label: "Payment terms", value: "Within 30 days from date of invoice" },
  ],
  tables: [
    {
      caption: "Lines",
      columns: ["Product", "Description", "Quantity", "Unit price", "Amount"],
      alignRightFrom: 2,
      rows: [
        ["304-2B-1.5", "Stainless sheet 1.5 mm", "12", "€ 83.33", "€ 1,000.00"],
      ],
    },
  ],
  totals: [
    { label: "Total excl. VAT", value: "€ 1,000.00" },
    { label: "Credit restriction", value: "€ 20.00" },
    { label: "VAT", value: "€ 214.20" },
    { label: "Invoice total", value: "€ 1,234.20", emphasis: true },
  ],
} satisfies DocumentEmailProps;

export default DocumentEmail;

const body = {
  backgroundColor: "#f6f6f6",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: "24px 0",
} satisfies CSSProperties;

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "640px",
  padding: "32px",
} satisfies CSSProperties;

const heading = {
  fontSize: "20px",
  margin: "0 0 4px",
} satisfies CSSProperties;

const addressee = {
  color: "#555555",
  fontSize: "14px",
  fontWeight: 600,
  margin: "0 0 16px",
} satisfies CSSProperties;

const text = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 12px",
} satisfies CSSProperties;

const mutedText = {
  color: "#777777",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 12px",
} satisfies CSSProperties;

const caption = {
  color: "#111111",
  fontSize: "13px",
  fontWeight: 600,
  margin: "20px 0 8px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
} satisfies CSSProperties;

const fieldTable = {
  borderCollapse: "collapse",
  marginBottom: "8px",
  width: "100%",
} satisfies CSSProperties;

const fieldLabelCell = {
  color: "#777777",
  fontSize: "13px",
  padding: "4px 12px 4px 0",
  verticalAlign: "top",
  whiteSpace: "nowrap",
  width: "40%",
} satisfies CSSProperties;

const fieldValueCell = {
  color: "#333333",
  fontSize: "13px",
  padding: "4px 0",
  verticalAlign: "top",
} satisfies CSSProperties;

const lineTable = {
  borderCollapse: "collapse",
  width: "100%",
} satisfies CSSProperties;

const headCell = {
  borderBottom: "1px solid #dddddd",
  color: "#777777",
  fontSize: "12px",
  fontWeight: 600,
  padding: "6px 8px 6px 0",
  textAlign: "left",
} satisfies CSSProperties;

const headCellRight = {
  ...headCell,
  padding: "6px 0 6px 8px",
  textAlign: "right",
} satisfies CSSProperties;

const lineCell = {
  borderBottom: "1px solid #f0f0f0",
  color: "#333333",
  fontSize: "13px",
  padding: "8px 8px 8px 0",
  textAlign: "left",
  verticalAlign: "top",
} satisfies CSSProperties;

const lineCellRight = {
  ...lineCell,
  padding: "8px 0 8px 8px",
  textAlign: "right",
  whiteSpace: "nowrap",
} satisfies CSSProperties;

const totalsTable = {
  borderCollapse: "collapse",
  marginTop: "16px",
  width: "100%",
} satisfies CSSProperties;

const totalLabel = {
  color: "#555555",
  fontSize: "13px",
  padding: "4px 12px 4px 0",
  textAlign: "right",
} satisfies CSSProperties;

const totalValue = {
  color: "#333333",
  fontSize: "13px",
  padding: "4px 0",
  textAlign: "right",
  whiteSpace: "nowrap",
  width: "140px",
} satisfies CSSProperties;

const totalLabelStrong = {
  ...totalLabel,
  borderTop: "1px solid #dddddd",
  color: "#111111",
  fontWeight: 600,
  paddingTop: "8px",
} satisfies CSSProperties;

const totalValueStrong = {
  ...totalValue,
  borderTop: "1px solid #dddddd",
  color: "#111111",
  fontWeight: 600,
  paddingTop: "8px",
} satisfies CSSProperties;

const divider = {
  borderColor: "#e5e5e5",
  margin: "24px 0 16px",
} satisfies CSSProperties;

const footer = {
  color: "#777777",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 4px",
} satisfies CSSProperties;
