const { randomUUID } = require('node:crypto');

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function requestLogger(req, res, next) {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  const started = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - started}ms`);
  });
  next();
}

function validateDish(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(httpError(400, 'Нужен JSON-объект с данными блюда'));
  }
  const fields = ['name', 'category', 'price', 'available'];
  if (Object.keys(body).some(key => !fields.includes(key))) {
    return next(httpError(400, 'Допустимые поля: name, category, price, available'));
  }
  for (const key of ['name', 'category']) {
    if (typeof body[key] !== 'string' || !body[key].trim() || body[key].trim().length > 100) {
      return next(httpError(400, `${key}: нужна строка длиной от 1 до 100 символов`));
    }
  }
  if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price <= 0) {
    return next(httpError(400, 'price: нужно положительное число'));
  }
  if (body.available !== undefined && typeof body.available !== 'boolean') {
    return next(httpError(400, 'available: нужно значение true или false'));
  }
  req.dish = {
    name: body.name.trim(), category: body.category.trim(),
    price: body.price, available: body.available ?? true
  };
  next();
}

// Express распознаёт обработчик ошибок по четырём параметрам.
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = ['ValidationError', 'CastError', 'StrictModeError'].includes(err.name) ? 400
    : err.type === 'entity.parse.failed' ? 400
    : err.type === 'entity.too.large' ? 413 : (err.status || 500);
  const message = err.type === 'entity.parse.failed' ? 'Некорректный JSON'
    : status === 413 ? 'Тело запроса слишком большое'
    : status >= 500 ? 'Внутренняя ошибка сервера' : err.message;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message, requestId: req.requestId });
}

module.exports = { httpError, requestLogger, validateDish, errorHandler };
