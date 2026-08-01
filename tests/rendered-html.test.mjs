import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders Queryvale product metadata and shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>Queryvale — SQL ezberleme, veri analisti gibi çalış<\/title>/i,
  );
  assert.match(html, /Sorgu büyüdükçe/i);
  assert.match(html, /karar netleşir/i);
  assert.match(html, /Önce doğru tabloyu gör/i);
  assert.match(html, /SQL hikâyesinin üç adımı/i);
  assert.match(html, /Rotayı incele/i);
  assert.match(html, /Verin ve ilerlemen bu cihazda kalır/i);
  assert.match(html, /Queryvale/);
  assert.doesNotMatch(html, /Şimdi sıra sende|product-introduction/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("portable shell ships the canonical Queryvale sharing metadata", async () => {
  const portableHtml = await readFile(
    new URL("../portable/index.html", import.meta.url),
    "utf8",
  );

  assert.match(
    portableHtml,
    /<title>Queryvale — SQL ezberleme, veri analisti gibi çalış<\/title>/i,
  );
  assert.match(
    portableHtml,
    /https:\/\/yacirmen\.github\.io\/queryvale\/og-compact-hero\.png/i,
  );
  assert.match(portableHtml, /Bir karar notuna dönüştür/i);
  assert.doesNotMatch(portableHtml, /og-analyst-loop\.png/i);
  assert.doesNotMatch(
    portableHtml,
    /https:\/\/yacirmen\.github\.io\/queryvale\/og\.png/i,
  );
});
