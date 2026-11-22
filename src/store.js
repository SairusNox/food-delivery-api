const Dish = require('./models/Dish');
module.exports = function createStore() {
  return {
    all: () => Dish.find().sort({ createdAt: 1, _id: 1 }),
    get: id => Dish.findById(id),
    create: data => Dish.create(data),
    update: (id, data) => Dish.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }),
    remove: id => Dish.findByIdAndDelete(id)
  };
};
