import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SaveLibrary, type SaveStore } from './save-library.ts';
import { createGame, serialize } from './sim.ts';
class MemoryStore implements SaveStore {
  values = new Map<string, string>();
  failWrites = false;
  async read(key: string) { return this.values.get(key) ?? null; }
  async list(prefix: string) { return [...this.values].filter(([key]) => key.startsWith(prefix)).map(([, value]) => value); }
  async write(entries: [string, string | null][]) {
    if (this.failWrites) throw new Error('Speicher voll');
    for (const [key, value] of entries) value === null ? this.values.delete(key) : this.values.set(key, value);
  }
}
test('imports existing single save once, keeps progress and resumes last active world', async () => {
  const store = new MemoryStore(), library = new SaveLibrary(store), old = createGame(42); old.time = 720;
  let imports = 0;
  const readLegacy = async () => { imports++; return serialize(old); };
  const imported = await library.open(readLegacy);
  assert.deepEqual(imported.state, old); assert.equal(imported.slot.day, 7);
  const second = await library.create(createGame(73), 'Bergtal');
  const resumed = await new SaveLibrary(store).open(readLegacy);
  assert.equal(imports, 1); assert.equal(resumed.slot.id, second.id); assert.equal(resumed.state.seed, 73);
  assert.equal((await library.list()).length, 2); assert.deepEqual((await library.load(imported.slot.id)).state, old);
});
test('independent worlds retain progress; same-seed restart keeps the old game', async () => {
  const library = new SaveLibrary(new MemoryStore()), original = createGame(10); original.time = 2400;
  const first = await library.create(original, 'Altes Tal');
  const restart = await library.create(createGame(original.seed), 'Neustart');
  assert.notEqual(first.id, restart.id); assert.equal((await library.load(restart.id)).state.time, 0);
  assert.equal((await library.load(first.id)).state.time, 2400);
  const progressed = (await library.load(restart.id)).state; progressed.time = 120;
  await library.save(restart, progressed); await library.activate(first.id);
  assert.equal((await library.open(async () => null)).slot.id, first.id);
  assert.equal((await library.load(restart.id)).slot.day, 2);
});
test('autosaving an inactive world does not change which world resumes', async () => {
  const library = new SaveLibrary(new MemoryStore()), state = createGame(1);
  const first = await library.create(state, 'A'), second = await library.create(createGame(2), 'B');
  await library.save(first, state);
  assert.equal((await library.open(async () => null)).slot.id, second.id);
});
test('rename preserves game data and deletion cannot remove the active world', async () => {
  const library = new SaveLibrary(new MemoryStore()), state = createGame(42);
  const first = await library.create(state, 'A'), second = await library.create(createGame(2), 'B');
  await library.rename(first.id, '  Neues Bergtal  ');
  assert.equal((await library.load(first.id)).slot.name, 'Neues Bergtal'); assert.deepEqual((await library.load(first.id)).state, state);
  await assert.rejects(library.remove(second.id), /anderes Tal/);
  await library.remove(first.id); assert.equal((await library.list()).length, 1);
  await assert.rejects(library.load(first.id), /nicht mehr vorhanden/);
});
test('failed creation leaves current world and active pointer intact', async () => {
  const store = new MemoryStore(), library = new SaveLibrary(store);
  const first = await library.create(createGame(1), 'A'), before = new Map(store.values);
  store.failWrites = true;
  await assert.rejects(library.create(createGame(2), 'B'), /Speicher voll/);
  assert.deepEqual(store.values, before);
  assert.equal((await library.open(async () => null)).slot.id, first.id);
});
test('corrupt saves stay intact; a separate new world can recover the library', async () => {
  const store = new MemoryStore(), library = new SaveLibrary(store);
  await assert.rejects(library.open(async () => '{broken'));
  assert.equal(store.values.size, 0);
  const first = await library.create(createGame(1), 'A');
  const dataKey = [...store.values.keys()].find(key => key.includes('data:'))!;
  store.values.set(dataKey, '{broken');
  await assert.rejects(library.open(async () => null));
  const next = await library.create(createGame(2), 'B');
  await assert.rejects(library.activate(first.id));
  assert.equal((await library.open(async () => null)).slot.id, next.id);
  assert.equal(store.values.get(dataKey), '{broken');
});
test('sandbox and regular games use separate libraries', async () => {
  const store = new MemoryStore(), normal = new SaveLibrary(store), sandbox = new SaveLibrary(store, true);
  const first = await normal.create(createGame(1), 'Echt'); await sandbox.create(createGame(2), 'Test');
  assert.equal((await normal.list()).length, 1); assert.equal((await sandbox.list()).length, 1);
  assert.equal((await normal.open(async () => null)).slot.id, first.id);
});
