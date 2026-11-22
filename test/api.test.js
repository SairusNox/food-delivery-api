const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { once } = require('node:events');
const createApp = require('../src/app');
const Dish = require('../src/models/Dish');

test('MongoDB: CRUD и сохранение документа', async t => {
  const uri = 'mongodb://127.0.0.1:27017/food_delivery_test_' + Date.now();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  let id;
  t.after(async () => {
    if (id) await Dish.deleteOne({ _id: id });
    await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(url, method = 'GET', body) {
    const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: res.status, body: res.status === 204 ? null : await res.json() };
  }
  const dish = { name: 'Проверка MongoDB', category: 'Закуски', price: 1000, available: true };
  let r = await request('/api/dishes', 'POST', dish);
  assert.equal(r.status, 201); id = r.body.data.id;
  assert.ok(mongoose.isObjectIdOrHexString(id));
  assert.equal((await Dish.findById(id)).name, dish.name);
  r = await request('/api/dishes/' + id); assert.equal(r.status, 200);
  r = await request('/api/dishes/' + id, 'PUT', { ...dish, price: 1300 });
  assert.equal(r.status, 200); assert.equal(r.body.data.price, 1300);
  assert.equal((await Dish.findById(id)).price, 1300);
  await mongoose.disconnect();
  await mongoose.connect(uri);
  assert.equal((await Dish.findById(id)).price, 1300);
  assert.equal((await request('/api/dishes/abc')).status, 400);
  assert.equal((await request('/api/dishes/000000000000000000000000')).status, 404);
  assert.equal((await request('/api/dishes', 'POST', { ...dish, price: -1 })).status, 400);
  assert.equal((await request('/api/dishes/' + id, 'DELETE')).status, 204);
  assert.equal(await Dish.findById(id), null);
  assert.equal((await request('/api/dishes/' + id)).status, 404);
});
