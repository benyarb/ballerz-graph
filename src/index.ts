/**
 * Ballerz API Cloudflare Worker!
 *
 * - Run `wrangler dev` in terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see worker in action
 * - Run `wrangler deploy` to deploy worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { graphql, buildSchema } from "graphql";

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
        const allBallers = await Promise.all(
          allKeys.keys.map(async (key) => {
            const baller = await env.BALLER.get(key.name);
            return baller ? JSON.parse(baller) : null;
          })
        );

        // Filter results
        return allBallers.filter((baller) => {
          if (!baller) return false;

          // Filter by team
          if (filters.team && baller.team !== filters.team) return false;

          // Filter by overall range
          if (filters.overallMin && baller.overall < filters.overallMin)
            return false;
          if (filters.overallMax && baller.overall > filters.overallMax)
            return false;

          // Filter by role
          if (filters.role && baller.role !== filters.role) return false;

          // Filter by accessories
          if (
            filters.accessories &&
            filters.accessories.length > 0 &&
            !filters.accessories.every((acc: string) =>
              baller.accessories.includes(acc)
            )
          ) {
            return false;
          }

          return true;
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
      headers: { "Content-Type": "application/json" },
    });
  },
};
