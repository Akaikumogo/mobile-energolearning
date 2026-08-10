/** Familiya + ism + otasining ismi (bo‘sh qismlar tashlanadi). */
export type PersonNameParts = {
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
};

export function formatPersonName(
  person: PersonNameParts | null | undefined,
): string {
  if (!person) return '';
  return [person.lastName, person.firstName, person.middleName]
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(' ');
}
