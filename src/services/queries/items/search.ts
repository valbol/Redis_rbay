import { itemsIndexKey } from '$services/keys';
import { client } from '$services/redis';
import { deserialize } from './deserialize';

export const searchItems = async (term: string, size: number = 5) => {
  const cleaned = term
    .replaceAll(/[^a-zA-Z0-9]/g, '') // ^ === not
    .trim()
    .split(' ')
    .map((word) => (word ? `%${word}%` : ''))
    .join(' ');

  // ? Look at cleaned an sure is valid
  if (cleaned === '') return [];

  const query = `(@name:(${cleaned}) => {$weight: 5.0}) | (@description:(${cleaned}))`;

  // ? use the client to do an actual search
  const results = await client.ft.search(itemsIndexKey(), query, {
    LIMIT: {
      from: 0,
      size,
    },
  });
  console.log(results);

  // ? deserialize and return the search results
  return results.documents.map(({ id, value }) =>
    deserialize(id, value as any)
  );
};
