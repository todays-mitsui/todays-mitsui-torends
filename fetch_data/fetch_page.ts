import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { sleep } from "https://deno.land/x/sleep@v1.2.1/mod.ts";
import { LOGIN_URL } from "./endpoint.ts";

export async function fetch_page(
  url: string,
  options: {
    username: string;
    password: string;
    retryLimit?: number;
    retryIntervalSec?: number;
  },
): Promise<{ page: string; fetchDate: Date }> {
  const cookie = await login(options.username, options.password);

  const retryLimit = options.retryLimit ?? 3;
  const retryIntervalSec = options.retryIntervalSec ?? 1;

  const page = await retry(retryLimit, retryIntervalSec, async () => {
    const page = await _fetch_page(url, cookie);
    if (!loggedIn(page)) {
      throw new LoginFailedError("login failed.");
    }
    return page;
  });

  return { page, fetchDate: new Date() };
}

interface Cookie {
  JSESSIONID: string;
  loginId: string;
  password: string;
  auto: string;
}

class LoginFailedError extends Error {}

async function login(
  username: string,
  password: string,
): Promise<Cookie> {
  const params = new URLSearchParams();
  params.append("loginId", username);
  params.append("passwd", password);
  params.append("auto", "on");
  params.append("send", "1");

  const response = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) throw new Error("login failed.");

  const cookies = new Map();
  for (const [key, value] of response.headers) {
    if (key !== "set-cookie") continue;
    if (
      !value.startsWith("JSESSIONID=") &&
      !value.startsWith("loginId=") &&
      !value.startsWith("password=")
    ) continue;

    const matches = value.match(/(\w+)=(\w+);/);
    if (matches != null) {
      const [_, k, v] = matches;
      cookies.set(k, v);
    }
  }

  return {
    JSESSIONID: cookies.get("JSESSIONID") ?? "",
    loginId: cookies.get("loginId") ?? "",
    password: cookies.get("password") ?? "",
    auto: "1",
  };
}

export function loggedIn(html: string): boolean {
  const doc = new DOMParser().parseFromString(html, "text/html");

  if (doc == null) return false;

  return doc.getElementById("userName") != null;
}

async function _fetch_page(url: string, cookie: Cookie): Promise<string> {
  const cookie_str = Object.entries(cookie).map(([k, v]) => `${k}=${v}`).join(
    "; ",
  );
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Cookie": cookie_str,
    },
  });

  if (!response.ok) throw new Error("fetch failed.");

  if (response.redirected && response.url !== url) {
    throw new FetchRequestRedirectedError(
      `fetch failed: redirected to ${response.url}`,
    );
  }

  const page = await response.arrayBuffer();

  const decoder = new TextDecoder("shift-jis");
  return decoder.decode(page); // Shift-JIS で返ってくるので UTF-8 に変換する
}

async function retry<T>(
  limit: number,
  intervalSec: number,
  fn: () => Promise<T>,
): Promise<T> {
  let retryCount = 0;
  while (retryCount < limit) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof LoginFailedError) {
        retryCount++;
        await sleep(intervalSec);
      } else {
        throw err;
      }
    }
  }
  throw new Error("retry failed.");
}
