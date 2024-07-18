import { createServer } from 'http';
import { GraphQLError } from 'graphql';
import { createSchema, createYoga } from 'graphql-yoga';

const puppies = [
  { id: '1', name: 'willow' },
  { id: '2', name: 'winter' }
];

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Puppy {
      id: ID!
      name: String!
    }

    type Query {
      puppyByID(id: ID!): Puppy
    }
  `,
  resolvers: {
    Query: {
      puppyByID: (_root, { id }) => {
        const puppy = puppies.find(p => p.id === id);
        if (puppy) return puppy;
        new GraphQLError('Record not found', {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }
    },
  },
});
const yoga = createYoga({
  schema,
});

const server = createServer(yoga);

server.listen(4002, () => console.log('puppy-name-service running at http://localhost:4002/graphql'));
