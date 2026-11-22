const mongoose = require('mongoose');
const express = require('express');
const { httpError, validateDish } = require('../middleware');

module.exports = function dishesRouter(store) {
  const router = express.Router();
  router.get('/', async (req, res, next) => {
    const { category, search, available } = req.query;
    if ([category, search, available].some(v => v !== undefined && typeof v !== 'string')) {
      return next(httpError(400, 'Параметры фильтра должны быть строками'));
    }
    if (available !== undefined && !['true', 'false'].includes(available)) {
      return next(httpError(400, 'available: укажи true или false'));
    }
    let data = await store.all();
    if (category) data = data.filter(i => i.category.toLowerCase() === category.toLowerCase());
    if (search) data = data.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    if (available !== undefined) data = data.filter(i => i.available === (available === 'true'));
    res.json({ count: data.length, data });
  });

  router.post('/', (req, res, next) => {
    if (!req.is('application/json')) return next(httpError(415, 'Используй Content-Type: application/json'));
    next();
  }, validateDish, async (req, res) => {
    const item = await store.create(req.dish);
    res.location(`/api/dishes/${item.id}`).status(201).json({ data: item });
  });

  // Проверка id и поиск записи выполняются перед маршрутами с :id.
  router.param('id', async (req, res, next, value) => {
    if (!mongoose.isObjectIdOrHexString(value)) {
      return next(httpError(400, 'id должен быть ObjectId из 24 шестнадцатеричных символов'));
    }
    req.item = await store.get(value);
    if (!req.item) return next(httpError(404, 'Блюдо не найдено'));
    next();
  });
  router.get('/:id', (req, res) => res.json({ data: req.item }));
  router.put('/:id', (req, res, next) => {
    if (!req.is('application/json')) return next(httpError(415, 'Используй Content-Type: application/json'));
    next();
  }, validateDish, async (req, res) => {
    const updated = await store.update(req.item.id, req.dish);
    if (!updated) throw httpError(404, 'Блюдо не найдено');
    res.json({ data: updated });
  });
  router.delete('/:id', async (req, res) => {
    const removed = await store.remove(req.item.id);
    if (!removed) throw httpError(404, 'Блюдо не найдено');
    res.status(204).end();
  });
  return router;
};
