type Props = {
  message: string;
};

export const ErrorMessage = ({ message }: Props) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
    {message}
  </div>
);
