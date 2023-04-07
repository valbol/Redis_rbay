import type { CreateUserAttrs } from '$services/types';
import { genId } from '$services/utils';
import { client } from '$services/redis';
import { usersKey, usernamesUniqueKey, usernamesKey } from '$services/keys';

export const getUserByUsername = async (username: string) => {
  // ? use the username arg' to look up the persons User id
  // ? with the usernames sorted set
  const decimalId = await client.zScore(usernamesKey(), username);

  // ? make sure we actually got an id from the lookup
  if (!decimalId) {
    throw new Error('User does not exist');
  }

  // ? Take the id and convert it back to hex
  const id = decimalId.toString(16);

  // ? use the id to look up the user's hash
  const user = await client.hGetAll(usersKey(id));

  // ? deserialized and return the hash
  return deserialize(id, user);
};

export const getUserById = async (id: string) => {
  const user = await client.hGetAll(usersKey(id));

  return deserialize(id, user);
};

export const createUser = async (attrs: CreateUserAttrs) => {
  const id = genId();

  const exists = await client.sIsMember(usernamesUniqueKey(), attrs.username);
  if (exists) {
    throw new Error('Username is taken');
  }

  await client.hSet(usersKey(id), serialize(attrs));
  await client.sAdd(usernamesUniqueKey(), attrs.username);
  // ! convert from hexa to 10 base - decimal
  await client.zAdd(usernamesKey(), {
    value: attrs.username,
    score: parseInt(id, 16),
  });

  return id;
};

const serialize = (user: CreateUserAttrs) => {
  return {
    username: user.username,
    password: user.password,
  };
};

const deserialize = (id: string, user: { [key: string]: string }) => {
  return {
    id,
    username: user.username,
    password: user.password,
  };
};
