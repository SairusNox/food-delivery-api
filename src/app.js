const express = require('express');
const createStore = require('./store');
const dishesRouter = require('./routes/dishes');
const { httpError, requestLogger, errorHandler } = require('./middleware');

module.exports = function createApp(options = {}) {
  const app = express();
  const store = createStore();
  app.disable('x-powered-by');
  app.use(requestLogger);
  app.use(express.json({ limit: '32kb' }));
  app.get('/', (req, res) => res.json({
    name: 'Доставка еды API', version: '1.0.0', menu: '/api/dishes'
  }));
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/dishes', dishesRouter(store));
  app.use((req, res, next) => next(httpError(404, 'Маршрут не найден')));
  app.use(errorHandler);
  return app;
};
