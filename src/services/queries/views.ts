import { client } from '$services/redis';
import { itemsKey, itemsByViewsKey, itemsViewsKey } from '$services/keys';

export const incrementView = async (itemId: string, userId: string) => {
  // return client.incrementView(itemId, userId);

  const inserted = await client.pfAdd(itemsViewsKey(itemId), userId);

  if (inserted) {
    return Promise.all([
      // ! in zIncerby the order of the member and score is switched, fro, the hIncrBy
      client.hIncrBy(itemsKey(itemId), 'views', 1),
      client.zIncrBy(itemsByViewsKey(), 1, itemId),
    ]);
  }
};
