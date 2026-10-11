import OrderDetailPage from "../page";

type Props = {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ line?: string }>;
};

/**
 * The reference edits an order on the screen it is shown on, so Edit is the
 * order's own page: the header there is the form, the toolbar above it.
 */
const EditOrderPage = ({ params, searchParams }: Props) => (
  <OrderDetailPage params={params} searchParams={searchParams} />
);

export default EditOrderPage;
