import { createServer } from 'http';
import { GraphQLError } from 'graphql';
import { createSchema, createYoga } from 'graphql-yoga';
import { debug } from 'console';

const puppies = [
  { id: '1', age: 1 },
  { id: '2', age: 2 }
];

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Puppy {
      id: ID!
      age: Int!
    }

    type Query {
      puppies(ids: [ID!]!): [Puppy]
    }
  `,
  resolvers: {
    Query: {
      puppies: (_root, { ids }) => {
        return puppies.filter(p => ids.includes(p.id));
      },
    },
  },
});
const yoga = createYoga({
  schema,
});

const server = createServer(yoga);

server.listen(4001, () => console.log('puppy-age-service running at http://localhost:4002/graphql'));
