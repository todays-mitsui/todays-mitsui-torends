import { format } from "https://deno.land/std@0.201.0/datetime/format.ts";
import { fetch_page } from "./fetch_page.ts";
import { parse, type ParseResult } from "./parse.ts";
import { INNERSCAN_URL } from "./endpoint.ts";

const USERNAME = Deno.env.get("USERNAME");
const PASSWORD = Deno.env.get("PASSWORD");

export async function fetch_records(dateUtc: Date): Promise<ParseResult[]> {
  if (USERNAME == null || PASSWORD == null) {
    throw new Error("USERNAME or PASSWORD is not set.");
  }

  const dateJst = new Date(dateUtc.getTime());
  dateJst.setHours(dateJst.getHours() + 9);

  const dateStr = format(dateJst, "yyyyMMdd");

  const { page, fetchDate } = await fetch_page(
    `${INNERSCAN_URL}?date=${dateStr}`,
    {
      username: USERNAME,
      password: PASSWORD,
    },
  );

  const results = await parse(page, fetchDate);
  results.reverse();

  return results;
}
