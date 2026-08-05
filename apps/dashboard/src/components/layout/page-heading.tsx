import { cn } from "@/lib/helpers";

type Props = {
  title: string;
  titleClassName?: string;
};

export const PageHeading = ({ title, titleClassName }: Props) => (
  <h1 className={cn("text-3xl font-bold text-gray-900", titleClassName)}>
    {title}
  </h1>
);
