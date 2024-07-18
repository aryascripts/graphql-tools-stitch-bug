import { buildSchema, parse, Kind } from 'graphql';
import { createYoga } from 'graphql-yoga';
import waitOn from 'wait-on';
import { buildHTTPExecutor } from '@graphql-tools/executor-http';
import { stitchSchemas } from '@graphql-tools/stitch';
import { schemaFromExecutor } from '@graphql-tools/wrap';
import { createServer } from 'http';
import { debug } from 'console';

async function makeGatewaySchema() {
  await waitOn({ resources: ['tcp:4001', 'tcp:4002'] });
  const ageExec = buildHTTPExecutor({
    endpoint: 'http://localhost:4001/graphql',
    headers: executorRequest => ({
      Authorization: executorRequest?.context?.authHeader,
    }),
  });
  const nameExec = buildHTTPExecutor({
    endpoint: 'http://localhost:4002/graphql',
    headers: executorRequest => ({
      Authorization: executorRequest?.context?.authHeader,
    }),
  });

  const adminContext = { authHeader: 'Bearer my-app-to-app-token' };

  return stitchSchemas({
    subschemas: [
      {
        schema: await schemaFromExecutor(ageExec, adminContext),
        executor: ageExec,
        merge: {
          Puppy: {
            fieldName: 'puppies',
            selectionSet: '{ id }',
            key: ({ id }) => id,
            argsFromKeys: keys => ({ ids: keys }),
            valuesFromResults: (
              results, keys,
            ) => {
              debug('results', results);
              debug('keys', keys);
              return results;
            },
          },
        },
      },
      {
        schema: await schemaFromExecutor(nameExec, adminContext),
        executor: nameExec,
        merge: {
          Puppy: {
            fieldName: 'puppyByID',
            args: originalObject => ({ id: originalObject.id }),
            valuesFromResults: (
              results, keys,
            ) => {
              debug('results', results);
              debug('keys', keys);
              return results;
            },
          },
        },
      },
    ],
    mergeTypes: true,
  });
}

export const gatewayApp = createYoga({
  schema: makeGatewaySchema(),
  context: ({ request }) => ({
    authHeader: request.headers.get('authorization'),
  }),
  maskedErrors: false,
  graphiql: {
    defaultQuery: `
      query MyQuery {
        puppyByID(id: "1") {
        name
        age
      }
    }`,
  }
});

const server = createServer(gatewayApp);
server.listen(4000, () => console.log('gateway running at http://localhost:4000/graphql'));
