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
/** 본문을 정리하기 전에 받을 최대 크기. 큰 파일이 서버 메모리를 다 쓰지 않게 받는 도중에 끊는다. */
export const MAX_BYTES = 2_000_000;

/** 응답 본문을 최대 limit 바이트까지만 읽는다. 넘치면 나머지는 받지 않고 끊는다. */
type ByteStream = { getReader(): { read(): Promise<{ done: boolean; value?: Uint8Array }>; cancel(): Promise<void> } };

export async function readLimited(body: ByteStream | null, limit: number): Promise<Uint8Array> {
  if (!body) return new Uint8Array();
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    const room = limit - size;
    chunks.push(value.length > room ? value.subarray(0, room) : value);
    size += Math.min(value.length, room);
    if (size >= limit) {
      await reader.cancel();
      break;
    }
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

/** content-type이나 meta 태그에 적힌 문자 집합(EUC-KR 등)으로 해석한다. 없으면 UTF-8. */
function decode(bytes: Uint8Array, contentType: string): string {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 2048));
  const label = (contentType.match(/charset=["']?([\w-]+)/i) ?? head.match(/<meta[^>]+charset=["']?([\w-]+)/i))?.[1] ?? "utf-8";
  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}
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
    const type = r.headers.get("content-type") ?? "";
    if (type && !/^text\/(html|plain)|xhtml/i.test(type)) {
      await r.body?.cancel();
      throw new Error("공고 페이지가 아니에요(HTML이 아닌 파일). 본문을 직접 붙여넣어 주세요.");
    }
    const text = cleanHtml(decode(await readLimited(r.body, MAX_BYTES), type));
    if (text.length < 50) throw new Error("페이지에서 공고 내용을 찾지 못했어요. 본문을 직접 붙여넣어 주세요.");
    return text.slice(0, MAX_TEXT);
  }
  throw new Error("리다이렉트가 너무 많아요. 본문을 직접 붙여넣어 주세요.");
}
