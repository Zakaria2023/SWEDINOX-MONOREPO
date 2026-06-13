export const VALIDATION_MESSAGES = {
  invalidEmailAddress: "Invalid email address",
  invalidWebsiteUrl: "Invalid website URL",
  glnTooLong: "GLN must be 13 characters or less",
  peppolFormat:
    "Format must be 4 digits, then a colon, then an identifier (for example 1204:identifier)",
  atLeastOneCategory: "At least one category is required",
  companyNameRequired: "Company name is required",
  descriptionRequired: "Description is required",
  nameRequired: "Name is required",
} as const;
