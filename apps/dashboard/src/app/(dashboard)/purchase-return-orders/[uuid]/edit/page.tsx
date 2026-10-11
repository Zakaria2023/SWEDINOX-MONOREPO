import PurchaseReturnOrderDetailPage from "../page";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * The reference edits a return on the screen it is shown on, so Edit is the
 * return's own page: the header there is the form, the toolbar above it.
 */
const EditPurchaseReturnOrderPage = ({ params }: Props) => (
  <PurchaseReturnOrderDetailPage params={params} />
);

export default EditPurchaseReturnOrderPage;
