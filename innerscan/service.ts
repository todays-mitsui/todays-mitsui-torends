import { fetch_records } from "../fetch_data/fetch_records.ts";
import { type Record, setRecords } from "./repository.ts";

export async function fetchRecords(sinceUtc: Date, untilUtc: Date) {
  if (sinceUtc > untilUtc) {
    throw new Error("sinceUtc must be less than untilUtc");
  }

  const until = new Date(untilUtc.getTime());
  until.setDate(until.getDate() + 1);

  const date = new Date(sinceUtc.getTime());
  while (date <= until) {
    const results = await fetch_records(date);

    const records: Record[] = results.map((result) => ({
      recordDate: result.recordDate,
      fetchDate: result.fetchDate,
      weight: {
        value: parseFloat(result.data["体重"].value),
        unit: result.data["体重"].unit,
      },
      fat: {
        value: parseFloat(result.data["体脂肪率"].value),
        unit: result.data["体脂肪率"].unit,
      },
      muscleMass: {
        value: parseFloat(result.data["筋肉量"].value),
        unit: result.data["筋肉量"].unit,
      },
      muscleScore: {
        value: parseFloat(result.data["筋肉スコア"].value),
        unit: result.data["筋肉スコア"].unit,
      },
      visceralFatLevel: {
        value: parseFloat(result.data["内臓脂肪レベル"].value),
        unit: result.data["内臓脂肪レベル"].unit,
      },
      basalMetabolicRate: {
        value: parseFloat(result.data["基礎代謝量"].value),
        unit: result.data["基礎代謝量"].unit,
      },
      bodyAge: {
        value: parseFloat(result.data["体内年齢"].value),
        unit: result.data["体内年齢"].unit,
      },
      boneMass: {
        value: parseFloat(result.data["推定骨量"].value),
        unit: result.data["推定骨量"].unit,
      },
    }));

    await setRecords(records);
    date.setDate(date.getDate() + 1);
  }
}
