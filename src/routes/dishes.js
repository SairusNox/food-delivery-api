const express = require('express');
const { httpError, validateDish } = require('../middleware');

module.exports = function dishesRouter(store) {
  const router = express.Router();
  router.get('/', (req, res, next) => {
    const { category, search, available } = req.query;
    if ([category, search, available].some(v => v !== undefined && typeof v !== 'string')) {
      return next(httpError(400, 'Параметры фильтра должны быть строками'));
    }
    if (available !== undefined && !['true', 'false'].includes(available)) {
      return next(httpError(400, 'available: укажи true или false'));
    }
    let data = store.all();
    if (category) data = data.filter(i => i.category.toLowerCase() === category.toLowerCase());
    if (search) data = data.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    if (available !== undefined) data = data.filter(i => i.available === (available === 'true'));
    res.json({ count: data.length, data });
  });

  router.post('/', (req, res, next) => {
    if (!req.is('application/json')) return next(httpError(415, 'Используй Content-Type: application/json'));
    next();
  }, validateDish, (req, res) => {
    const item = store.create(req.dish);
    res.location(`/api/dishes/${item.id}`).status(201).json({ data: item });
  });

  // Проверка id и поиск записи выполняются перед маршрутами с :id.
  router.param('id', (req, res, next, value) => {
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
      return next(httpError(400, 'id должен быть положительным целым числом'));
    }
    req.item = store.get(Number(value));
    if (!req.item) return next(httpError(404, 'Блюдо не найдено'));
    next();
  });
  router.get('/:id', (req, res) => res.json({ data: req.item }));
  router.put('/:id', (req, res, next) => {
    if (!req.is('application/json')) return next(httpError(415, 'Используй Content-Type: application/json'));
    next();
  }, validateDish, (req, res) => {
    res.json({ data: store.update(req.item.id, req.dish) });
  });
  router.delete('/:id', (req, res) => {
    store.remove(req.item.id);
    res.status(204).end();
  });
  return router;
};
