import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import {
  applyGraphQL,
  gql,
  GQLError,
} from "https://deno.land/x/oak_graphql@0.6.4/mod.ts";
import { getLastFetch, getRecords } from "./innerscan/repository.ts";
import { fetchRecords } from "./innerscan/service.ts";

export const typeDefs = gql`
type Query {
  hello: String
  getTrends(numDays: Int): Trend!
}

type Trend {
  timestamps: [Int!]!
  weight: [Float!]!
  fat: [Float!]!
  muscleMass: [Float!]!
  muscleScore: [Int!]!
  visceralFatLevel: [Float!]!
  basalMetabolicRate: [Int!]!
  bodyAge: [Int!]!
  boneMass: [Float!]!
}
`;

export const resolvers = {
  Query: {
    hello: () => "Hello,world!",
    getTrends: async (
      _parent: any,
      { numDays }: any,
      _context: any,
      _info: any,
    ) => {
      if (numDays <= 0) {
        throw new GQLError("numDays は 0 より大きい値を指定してください");
      }

      const lastFetch = await getLastFetch();
      const now = new Date();

      if (now.getTime() - lastFetch.getTime() > 1000 * 60 * 60 * 6) {
        await fetchRecords(lastFetch, now);
      }

      const records = await getRecords();

      const trend = {
        timestamps: [] as number[],
        weight: [] as number[],
        fat: [] as number[],
        muscleMass: [] as number[],
        muscleScore: [] as number[],
        visceralFatLevel: [] as number[],
        basalMetabolicRate: [] as number[],
        bodyAge: [] as number[],
        boneMass: [] as number[],
      };
      for (const record of records) {
        trend.timestamps.push(record.recordDate.getTime() / 1000);
        trend.weight.push(record.weight.value);
        trend.fat.push(record.fat.value);
        trend.muscleMass.push(record.muscleMass.value);
        trend.muscleScore.push(record.muscleScore.value);
        trend.visceralFatLevel.push(record.visceralFatLevel.value);
        trend.basalMetabolicRate.push(record.basalMetabolicRate.value);
        trend.bodyAge.push(record.bodyAge.value);
        trend.boneMass.push(record.boneMass.value);
      }

      return trend;
    },
  },
  // Mutation: {},
};

export const GraphQLService = await applyGraphQL<Router>({
  Router,
  typeDefs: typeDefs,
  resolvers: resolvers,
  context: (_ctx) => {},
});
