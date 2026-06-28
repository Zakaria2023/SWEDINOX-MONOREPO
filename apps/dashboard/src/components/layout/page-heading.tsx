import { cn } from "@/lib/helpers";

type Props = {
  title: string;
  description?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export const PageHeading = ({
  title,
  description,
  titleClassName,
  descriptionClassName,
}: Props) => (
  <div>
    <h1 className={cn("text-3xl font-bold text-gray-900", titleClassName)}>
      {title}
    </h1>
    {description && (
      <p className={cn("mt-2 text-gray-600", descriptionClassName)}>
        {description}
      </p>
    )}
  </div>
);
