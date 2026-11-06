import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const directory = await mkdtemp(join(tmpdir(), 'radar-chat-check-'));
const original = { window: globalThis.window, fetch: globalThis.fetch, storage: globalThis.localStorage };
try {
  globalThis.window = { setTimeout, clearTimeout, location: { hostname: 'localhost' } };
  globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  let available = true;
  let rejected = false;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    if (url === '/api/bootstrap') throw new Error('Temporary startup failure');
    if (url.startsWith('/mock/')) return new Response(await readFile(new URL(`../public${url}`, import.meta.url)), { status: 200 });
    if (url.endsWith('/messages')) {
      calls.push({ url, method: options.method, body: JSON.parse(options.body) });
      if (!available) throw new Error('Network offline');
      if (rejected) return Response.json({ detail: 'Неизвестный получатель' }, { status: 404 });
      return Response.json({ ...JSON.parse(options.body), createdAt: '2026-11-06T12:00:00Z' }, { status: 201 });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };
  const compile = async (prod, file) => {
    const outfile = join(directory, file);
    await build({ entryPoints: [new URL('../src/api.ts', import.meta.url).pathname], outfile,
      bundle: true, platform: 'node', format: 'esm', define: { 'import.meta.env': JSON.stringify({ PROD: prod }) } });
    return import(pathToFileURL(outfile).href);
  };
  const api = await compile(false, 'api-dev.mjs');
  const offline = await api.loadData();
  assert(offline.school.students.length > 0, 'Offline catalogue should still load');
  const message = { id: 'retry-stable-id', studentId: 'sasha', teacherId: 'teacher-1', sender: 'teacher', text: 'Проверка' };
  const delivered = await api.sendChatMessage(message);
  assert.equal(delivered.id, message.id);
  assert.equal(calls.length, 1, 'Chat must reach the API after an offline bootstrap');
  available = false;
  await assert.rejects(api.sendChatMessage(message), /Сообщение не отправлено/);
  available = true;
  await api.sendChatMessage(message);
  assert.equal(calls.at(-1).body.id, message.id);
  rejected = true;
  await assert.rejects(api.sendChatMessage(message), error => error instanceof api.ApiError);
  rejected = false;
  globalThis.window.location.hostname = 'demo.ngrok-free.app';
  const production = await compile(true, 'api-prod.mjs');
  await production.sendChatMessage(message);
  assert.equal(calls.at(-1).url, '/api/messages', 'An ngrok build must use its own origin');
  console.log('Chat recovery, explicit failure, retry ID, API rejection and ngrok origin: OK');
} finally {
  globalThis.window = original.window;
  globalThis.fetch = original.fetch;
  if (original.storage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = original.storage;
  await rm(directory, { recursive: true, force: true });
}
