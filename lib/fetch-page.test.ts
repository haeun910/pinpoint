import assert from "node:assert/strict";
import { test } from "node:test";
import { isAllowedUrl, isPublicAddress, readLimited } from "./fetch-page.ts";

test("내부 주소와 http(s)가 아닌 주소는 막는다", () => {
  for (const u of ["http://localhost:3000", "http://127.0.0.1", "http://[::1]/", "http://0x7f.1/", "http://2130706433/", "file:///etc/passwd", "http://a.internal/", "http://user:pw@example.com/"]) {
    assert.equal(isAllowedUrl(u), false, u);
  }
  assert.equal(isAllowedUrl("https://careers.example.com/jobs/1"), true);
});

test("DNS 결과가 사설·루프백·링크로컬이면 공인 주소가 아니다", () => {
  for (const a of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.0.10", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"]) {
    assert.equal(isPublicAddress(a), false, a);
  }
  for (const a of ["8.8.8.8", "223.130.195.200", "2606:4700::1111"]) assert.equal(isPublicAddress(a), true, a);
});

test("응답 본문은 정한 크기까지만 읽고 나머지는 끊는다", async () => {
  let pulled = 0, cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(c) {
      pulled++;
      c.enqueue(new Uint8Array(1000).fill(65));
    },
    cancel() {
      cancelled = true;
    },
  });
  const bytes = await readLimited(body, 2500);
  assert.equal(bytes.length, 2500);
  assert.ok(cancelled);
  assert.ok(pulled <= 4);
});
