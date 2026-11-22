const fs = require('node:fs');
const path = require('node:path');
const seed = require('./data/seed');

module.exports = function createStore(file) {
  let items = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : seed();
  // Сначала сохраняем новую версию, затем меняем данные в памяти.
  function commit(next) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file + '.tmp', JSON.stringify(next, null, 2), 'utf8');
    fs.renameSync(file + '.tmp', file);
    items = next;
  }
  return {
    all: () => items,
    get: id => items.find(item => item.id === id),
    create(data) {
      const item = { id: Math.max(0, ...items.map(i => i.id)) + 1, ...data };
      commit([...items, item]);
      return item;
    },
    update(id, data) {
      const item = { id, ...data };
      commit(items.map(i => i.id === id ? item : i));
      return item;
    },
    remove(id) { commit(items.filter(item => item.id !== id)); }
  };
};
