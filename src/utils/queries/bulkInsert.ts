export const buildValuesPlaceholders = <T>(data: T[], mapper: (row: T) => unknown[]) => {
  if (data.length === 0) return { placeholders: "", values: [] };

  let i = 1;
  const values: unknown[] = [];

  const placeholders = data.map((record) => {
    const row = mapper(record).map((value) => {
      values.push(value);
      return `$${i++}`;
    });
    return `(${row.join(", ")})`;
  }).join(", ");

  return { placeholders, values };
};
