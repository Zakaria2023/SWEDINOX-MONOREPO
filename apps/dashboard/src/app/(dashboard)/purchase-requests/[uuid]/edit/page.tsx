import PurchaseRequestDetailPage from "../page";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * The reference edits a request on the screen it is shown on, so Edit is the
 * request's own page: the header there is the form, the toolbar above it.
 */
const EditPurchaseRequestPage = ({ params }: Props) => (
  <PurchaseRequestDetailPage params={params} />
);

export default EditPurchaseRequestPage;
