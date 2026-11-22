const createApp = require('./app');
const { connectDatabase, disconnectDatabase } = require('./database');
const port = Number(process.env.PORT || 3011);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT должен быть числом от 1 до 65535');
}
async function main() {
await connectDatabase();
const server = createApp().listen(port, '127.0.0.1', () => {
  console.log(`Доставка еды API: http://127.0.0.1:${port}`);
});
server.on('error', async err => {
  console.error(err.message);
  await disconnectDatabase();
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(async () => { await disconnectDatabase(); process.exit(0); }));
}
}
main().catch(async err => { console.error(err.message); await disconnectDatabase(); process.exitCode = 1; });
