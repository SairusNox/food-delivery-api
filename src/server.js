const createApp = require('./app');
const port = Number(process.env.PORT || 3010);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT должен быть числом от 1 до 65535');
}
const server = createApp().listen(port, '127.0.0.1', () => {
  console.log(`Доставка еды API: http://127.0.0.1:${port}`);
});
server.on('error', err => { console.error(err.message); process.exitCode = 1; });
