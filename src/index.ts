/**
 * Ballerz Graph API Cloudflare Worker!
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
  BALLERZ: KVNamespace;
}

let cachedData: any = null;

// Helper function to fetch and cache the data
const getCachedData = async (env: Env) => {
  if (!cachedData) {
    const data = await env.BALLERZ.get("ballerz");
    cachedData = data ? JSON.parse(data) : [];
  }
  return cachedData;
};

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
    overall: Float
    role: String
    jersey: String
    nftID: String
    nftSlug: String
    hair: String
    hairColor: String
    hairStyle: String
    skillRank: Int
    traitRank: Int
    comboRank: Int
    mvp: Boolean
  }

  input BallerFilters {
    id: ID
    team: String
    number: String
    overallMin: Float
    overallMax: Float
    role: String
    accessories: [String]
    hair: String
    hairColor: String
    hairStyle: String
    skillRank: Int
    traitRank: Int
    comboRank: Int
    mvp: Boolean
  }

  type Query {
    getBaller(id: ID!): Baller
    searchBallers(filters: BallerFilters, limit: Int, offset: Int): [Baller]
  }
`);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const root = {
      // Fetch a single baller by ID
      getBaller: async ({ id }: { id: string }) => {
        const ballers = await getCachedData(env);
        return (
          ballers.find((baller: any) => baller.id === parseInt(id, 10)) || null
        );
      },

      // Search ballerz with filters and pagination
      searchBallers: async ({
        filters,
        limit = 20,
        offset = 0,
      }: {
        filters: any;
        limit: number;
        offset: number;
      }) => {
        const ballers = await getCachedData(env);

        const filtered = ballers.filter((baller: any) => {
          if (filters.id && baller.id !== parseInt(filters.id, 10))
            return false;
          if (filters.team && !baller.team.includes(filters.team)) return false; // Partial matching for team
          if (filters.overallMin && baller.overall < filters.overallMin)
            return false;
          if (filters.overallMax && baller.overall > filters.overallMax)
            return false;
          if (filters.role && baller.role !== filters.role) return false;
          if (filters.number && baller.number !== filters.number) return false;

          // Accessories matching
          if (
            filters.accessories &&
            filters.accessories.length > 0 &&
            !filters.accessories.every((acc: string) =>
              baller.accessories.includes(acc)
            )
          ) {
            return false;
          }

          if (filters.hair && baller.hair !== filters.hair) return false;
          if (
            filters.hairColor &&
            !baller.hairColor.includes(filters.hairColor)
          )
            return false; // Partial match
          if (
            filters.hairStyle &&
            !baller.hairStyle.includes(filters.hairStyle)
          )
            return false; // Partial match
          if (filters.skillRank && baller.skillRank !== filters.skillRank)
            return false;
          if (filters.traitRank && baller.traitRank !== filters.traitRank)
            return false;
          if (filters.comboRank && baller.comboRank !== filters.comboRank)
            return false;
          if (filters.mvp && baller.mvp !== filters.mvp) return false;

          return true;
        });

        // Apply pagination
        return filtered.slice(offset, offset + limit);
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
