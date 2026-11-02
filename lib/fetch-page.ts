import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { BlockList, isIP } from "node:net";
import { Agent, fetch } from "undici";
import { cleanHtml } from "./collect.ts";

/**
 * 공고 링크로 본문을 가져온다.
 * 서버가 사용자 대신 아무 주소나 열면 내부망을 들여다보는 통로가 되므로(SSRF),
 * 1) 주소 형식을 먼저 거르고, 2) 실제로 연결하는 순간 DNS 결과가 공인 IP인지 확인하고,
 * 3) 리다이렉트는 자동으로 따라가지 않고 한 번씩 같은 검사를 거친다.
 */
export function isAllowedUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (/^[\d.]+$/.test(host) || host.includes(":") || host.startsWith("[")) return false; // IP 주소 직접 입력 금지
  return true;
}

/** 루프백, 사설망, 링크로컬, CGNAT, 멀티캐스트 등 공인 인터넷이 아닌 주소 */
const PRIVATE = new BlockList();
for (const [net, bits] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 3],
] as const) PRIVATE.addSubnet(net, bits, "ipv4");
for (const [net, bits] of [
  ["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8], ["64:ff9b::", 96], ["2001:db8::", 32],
] as const) PRIVATE.addSubnet(net, bits, "ipv6");

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 0) return false;
  if (family === 6) {
    const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return !PRIVATE.check(mapped[1], "ipv4");
    return !PRIVATE.check(address, "ipv6");
  }
  return !PRIVATE.check(address, "ipv4");
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

/** 연결 직전에 호출되는 DNS 조회. 공인 주소가 아니면 연결 자체를 막는다. */
function guardedLookup(hostname: string, options: { all?: boolean }, cb: LookupCallback) {
  dnsLookup(hostname, { all: true }, (err, addresses) => {
    if (err) return cb(err, []);
    const bad = addresses.find((a) => !isPublicAddress(a.address));
    if (bad || addresses.length === 0) {
      return cb(Object.assign(new Error("blocked address"), { code: "EBLOCKED" }), []);
    }
    if (options.all) return cb(null, addresses);
    cb(null, addresses[0].address, addresses[0].family);
  });
}

const agent = new Agent({ connect: { lookup: guardedLookup as never } });

export const MAX_TEXT = 30_000;
const MAX_REDIRECTS = 5;
const BLOCKED = "이 주소는 열 수 없어요.";

export async function fetchPageText(raw: string): Promise<string> {
  let current = raw;
  const signal = AbortSignal.timeout(10_000);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isAllowedUrl(current)) throw new Error(BLOCKED);
    let r;
    try {
      r = await fetch(current, {
        dispatcher: agent,
        headers: { "User-Agent": "Pinpoint/0.1 (+personal job board)" },
        redirect: "manual",
        signal,
      });
    } catch (err) {
      if (String((err as { cause?: { code?: string } }).cause?.code) === "EBLOCKED") throw new Error(BLOCKED);
      throw new Error("페이지를 열지 못했어요. 본문을 직접 붙여넣어 주세요.");
    }
    if (r.status >= 300 && r.status < 400) {
      const location = r.headers.get("location");
      await r.body?.cancel();
      if (!location) throw new Error("페이지를 열지 못했어요.");
      current = new URL(location, current).toString();
      continue;
    }
    if (!r.ok) throw new Error(`페이지를 열지 못했어요 (HTTP ${r.status}).`);
    const text = cleanHtml(await r.text());
    if (text.length < 50) throw new Error("페이지에서 공고 내용을 찾지 못했어요. 본문을 직접 붙여넣어 주세요.");
    return text.slice(0, MAX_TEXT);
  }
  throw new Error("리다이렉트가 너무 많아요. 본문을 직접 붙여넣어 주세요.");
}
