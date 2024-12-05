/**
 * Ballerz API Cloudflare Worker!
 *
 * - Run `wrangler dev` in terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see worker in action
 * - Run `wrangler deploy` to deploy worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { graphql, buildSchema } from 'graphql';

export interface Env {
	// Binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	BALLER: KVNamespace;
}

const schema = buildSchema(`
  type Baller {
    id: ID!
    team: String
    accessories: [String]
    number: String
    dunks: Int
    shooting: Int
    playmaking: Int
    defense: Int
    overall: Int
    role: String
    jersey: String
  }

  input BallerFilters {
    team: String
    overallMin: Int
    overallMax: Int
    role: String
    accessories: [String]
  }

  type Query {
    getBaller(id: ID!): Baller
    searchBallers(filters: BallerFilters): [Baller]
  }
`);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const root = {
      getBaller: async ({ id }: { id: string }) => {
        const ballerData = await env.BALLER.get(`baller-${id}`);
        return ballerData ? JSON.parse(ballerData) : null;
      },
      searchBallers: async ({ filters }: { filters: any }) => {
        const allKeys = await env.BALLER.list();
        const results = await Promise.all(
          allKeys.keys.map(async (key) => JSON.parse(await env.BALLER.get(key.name) || '{}'))
        );
        return results.filter((baller) => {
          // Apply filters here
          return filters.team ? baller.team === filters.team : true;
        });
      },
    };
    
    const body: any = await request.json();

    const response = await graphql({
      schema,
      source: body.query,
      rootValue: root,
      variableValues: body.variables,
      contextValue: {},
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

