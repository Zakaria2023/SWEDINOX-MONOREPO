export type RecipientContact = {
  uuid: string;
  email: string | null;
  addressEmail: string | null;
};

export type RecipientSelection = {
  contacts: RecipientContact[];
  /** The contact the document itself names, when it names one. */
  contactUuid?: string | null;
  /** An address the company configured for this kind of document. */
  routedTo?: string | null;
};

/**
 * A configured routing address may hold several addresses in one column,
 * separated by a comma or a semicolon.
 */
const splitAddresses = (value: string | null | undefined): string[] =>
  value ? value.split(/[;,]/).map((part) => part.trim()) : [];

export const isEmailAddress = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * Decides who a document is mailed to.
 *
 * A document that names its own contact goes to that person, so a purchase
 * order addressed to one buyer isn't copied to everyone at the supplier. Only
 * when the document names nobody — or the person it names has no address on
 * file — does it fall back to every contact we hold for the company, which is
 * better than sending nothing at all.
 *
 * An address the company explicitly configured is added alongside the contacts
 * rather than replacing them: it says where the company also wants the
 * document, not who stops receiving it.
 *
 * Addresses are de-duplicated, so a contact listed twice is still mailed once.
 */
export const selectRecipientAddresses = ({
  contacts,
  contactUuid,
  routedTo,
}: RecipientSelection): string[] => {
  const addresses = splitAddresses(routedTo);

  const named = contactUuid
    ? contacts.find((contact) => contact.uuid === contactUuid)
    : undefined;
  const namedAddresses = named
    ? [named.email, named.addressEmail].filter(
        (address): address is string => !!address && isEmailAddress(address),
      )
    : [];

  addresses.push(
    ...(namedAddresses.length > 0
      ? namedAddresses
      : contacts
          .flatMap((contact) => [contact.email, contact.addressEmail])
          .filter((address): address is string => !!address)),
  );

  return [...new Set(addresses.filter(isEmailAddress))];
};
