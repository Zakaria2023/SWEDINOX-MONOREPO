import ReturnOrderDetailPage from "../page";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * The reference edits a return on the screen it is shown on, so Edit is the
 * return's own page: the header there is the form, the toolbar above it.
 */
const EditReturnOrderPage = ({ params }: Props) => (
  <ReturnOrderDetailPage params={params} />
);

export default EditReturnOrderPage;
