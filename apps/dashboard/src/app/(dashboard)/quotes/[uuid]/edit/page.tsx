import QuoteDetailPage from "../page";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * The reference edits a quote on the screen it is shown on, so Edit is the
 * quote's own page: the header there is the form, the toolbar above it.
 */
const EditQuotePage = ({ params }: Props) => (
  <QuoteDetailPage params={params} />
);

export default EditQuotePage;
