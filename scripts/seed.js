const Dish = require('../src/models/Dish');
const initialMenu = require('../src/data/seed');
const { connectDatabase, disconnectDatabase } = require('../src/database');
async function main() {
  await connectDatabase();
  if (await Dish.exists({})) { console.log('Коллекция не пуста. Заполнение пропущено.'); return; }
  await Dish.insertMany(initialMenu().map(({ id, ...dish }) => dish));
  console.log('Добавлено 20 блюд');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(disconnectDatabase);
