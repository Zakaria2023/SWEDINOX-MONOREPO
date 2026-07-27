import { SelectOption } from "@/components/shadcn/select";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";

const sortCategories = (a: TextCategoryOption, b: TextCategoryOption) => {
  if (a.sequenceNumber !== b.sequenceNumber) {
    return a.sequenceNumber - b.sequenceNumber;
  }

  return a.name.localeCompare(b.name);
};

const buildBranch = (
  categories: TextCategoryOption[],
  parentUuid: string | null,
  depth = 0,
): SelectOption[] => {
  const children = categories
    .filter((category) => (category.parentUuid ?? null) === parentUuid)
    .sort(sortCategories);

  return children.flatMap((category) => {
    const prefix = depth > 0 ? `${"  ".repeat(depth)}↳ ` : "";

    return [
      {
        value: category.uuid,
        label: `${prefix}${category.name}`,
      },
      ...buildBranch(categories, category.uuid, depth + 1),
    ];
  });
};

export const buildTextCategorySelectOptions = (
  categories: TextCategoryOption[],
) => [{ value: "", label: "None" }, ...buildBranch(categories, null)];
