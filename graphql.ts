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
  "体組成情報の推移"
  trend(numDays: Int): Trend!
  "身長"
  height: Float!
  "性別"
  sex: Sex!
}

type Trend {
  "Unix タイムスタンプ"
  timestamps: [Int!]!
  """
  計測日時
  ISO 8601 形式
  """
  datetime: [String!]!
  "体重 (kg)"
  weight: [Float!]!
  "体脂肪率 (%)"
  fat: [Float!]!
  "筋肉量 (kg)"
  muscleMass: [Float!]!
  "筋肉スコア"
  muscleScore: [Int!]!
  "内臓脂肪レベル"
  visceralFatLevel: [Float!]!
  "基礎代謝量 (kcal)"
  basalMetabolicRate: [Int!]!
  "体年齢 (歳)"
  bodyAge: [Int!]!
  "推定骨量 (kg)"
  boneMass: [Float!]!
}

enum Sex {
  Male
  Female
}
`;

export const resolvers = {
  Query: {
    trend: async (
      _parent: any,
      { numDays }: any,
      _context: any,
      _info: any,
    ) => {
      if (numDays <= 0) {
        throw new GQLError("numDays は 0 より大きい値を指定してください");
      }

      const kv = await Deno.openKv();
      await kv.delete(["innerscan", "lastFetch"]);

      const lastFetch = await getLastFetch();
      const now = new Date();

      if (now.getTime() - lastFetch.getTime() > 1000 * 60 * 60 * 6) {
        await fetchRecords(lastFetch, now);
      }

      const records = await getRecords();

      const trend = {
        timestamps: [] as number[],
        datetime: [] as string[],
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
        trend.datetime.push(record.recordDate.toISOString());
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

    height: () => 171.5,

    sex: () => "Male",
  },
  // Mutation: {},
};

export const GraphQLService = await applyGraphQL<Router>({
  Router,
  typeDefs: typeDefs,
  resolvers: resolvers,
  context: (_ctx) => {},
});
