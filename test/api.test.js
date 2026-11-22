const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const createApp = require('../src/app');

test('API: CRUD, фильтры, ошибки и сохранение после перезапуска', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'food-api-test-'));
  const dataFile = path.join(dir, 'dishes.json');
  const server = createApp({ dataFile }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(url, method = 'GET', body) {
    const res = await fetch(base + url, { method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: res.status, headers: res.headers, body: res.status === 204 ? null : await res.json() };
  }
  await t.test('20 начальных записей и requestId', async () => {
    const r = await request('/api/dishes');
    assert.equal(r.status, 200); assert.equal(r.body.count, 20);
    assert.ok(r.headers.get('x-request-id'));
  });
  await t.test('фильтрация категории и поиск', async () => {
    const r = await request('/api/dishes?category=' + encodeURIComponent('Пицца'));
    assert.equal(r.body.count, 4);
    assert.equal((await request('/api/dishes?search=' + encodeURIComponent('морс'))).body.count, 1);
  });
  const dish = { name: 'Тестовое блюдо', category: 'Закуски', price: 800, available: true };
  let id;
  await t.test('POST: создание 201 и Location', async () => {
    const r = await request('/api/dishes', 'POST', dish);
    assert.equal(r.status, 201); id = r.body.data.id;
    assert.equal(r.headers.get('location'), `/api/dishes/${id}`);
  });
  await t.test('GET: созданная запись', async () => {
    assert.deepEqual((await request(`/api/dishes/${id}`)).body.data, { id, ...dish });
  });
  await t.test('PUT: изменение и фильтр доступности', async () => {
    const r = await request(`/api/dishes/${id}`, 'PUT', { ...dish, price: 950, available: false });
    assert.equal(r.status, 200); assert.equal(r.body.data.price, 950);
    assert.equal((await request('/api/dishes?available=false')).body.count, 1);
  });
  await t.test('данные доступны новому экземпляру приложения', async () => {
    const another = createApp({ dataFile }).listen(0, '127.0.0.1');
    await once(another, 'listening');
    try {
      const res = await fetch(`http://127.0.0.1:${another.address().port}/api/dishes/${id}`);
      assert.equal((await res.json()).data.price, 950);
    } finally { another.close(); }
  });
  await t.test('валидация: поля, типы, отрицательная цена', async () => {
    for (const body of [{}, [], { ...dish, price: -1 }, { ...dish, price: '800' },
      { ...dish, available: 'true' }, { ...dish, name: ' ' }, { ...dish, id: 999 }]) {
      assert.equal((await request('/api/dishes', 'POST', body)).status, 400);
    }
  });
  await t.test('ошибочный JSON и неподдерживаемый Content-Type', async () => {
    let res = await fetch(base + '/api/dishes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(res.status, 400); assert.equal((await res.json()).error, 'Некорректный JSON');
    res = await fetch(base + '/api/dishes', { method: 'POST', body: 'hello' });
    assert.equal(res.status, 415);
  });
  await t.test('неправильные id, фильтры и неизвестный маршрут', async () => {
    for (const url of ['/api/dishes/abc', '/api/dishes/0', '/api/dishes?available=yes', '/api/dishes?search=a&search=b']) {
      assert.equal((await request(url)).status, 400);
    }
    assert.equal((await request('/api/dishes/999999')).status, 404);
    assert.equal((await request('/unknown')).status, 404);
  });
  await t.test('DELETE: удаление 204 и последующий 404', async () => {
    assert.equal((await request(`/api/dishes/${id}`, 'DELETE')).status, 204);
    assert.equal((await request(`/api/dishes/${id}`)).status, 404);
    assert.equal((await request('/api/dishes')).body.count, 20);
  });
});
