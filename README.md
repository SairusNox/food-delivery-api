# Доставка еды: MongoDB и Mongoose

Серверное приложение для хранения меню в MongoDB. Node.js 22+, Express 5, Mongoose 9.

## Запуск

Нужен запущенный MongoDB Community Server на 127.0.0.1:27017.

```powershell
npm.cmd install
npm.cmd run seed
npm.cmd start
```

Адрес API: http://127.0.0.1:3011. База: food_delivery, коллекция: dishes.
Для другого подключения создать .env по образцу .env.example. Пароли не добавлять в Git.
Заполнение добавляет 20 блюд только в пустую коллекцию и не удаляет существующие данные.

## Модель данных

Блюдо хранится отдельным документом коллекции dishes. Поля: _id (ObjectId), name (String), category (String), price (Number, тенге), available (Boolean), createdAt и updatedAt (Date).
Модель Dish описывает обязательность полей, ограничения длины и цены. Индекс category + available предназначен для запросов по категории и доступности.
У ответа также есть строковое поле id, соответствующее _id, для использования в URL и Postman.
Одна коллекция подходит для текущего меню. При добавлении заказов позиции и цены заказа следует хранить вложенным снимком, чтобы изменение меню не меняло старые заказы.

## API

| Метод | URL | Результат |
|---|---|---|
| GET | /api/health | Проверка сервера |
| GET | /api/dishes | Список блюд |
| GET | /api/dishes/:id | Чтение документа |
| POST | /api/dishes | Создание, HTTP 201 |
| PUT | /api/dishes/:id | Обновление, HTTP 200 |
| DELETE | /api/dishes/:id | Удаление, HTTP 204 |

id - строка из 24 шестнадцатеричных символов. Неверный формат: 400; отсутствующий документ: 404.
POST/PUT требуют Content-Type: application/json.

```json
{"name":"Сырные палочки","category":"Закуски","price":1200,"available":true}
```

Фильтры: category, search, available=true/false.
В store.js используются find, findById, create, findByIdAndUpdate и findByIdAndDelete.
Сервер начинает принимать запросы после успешного соединения с базой. Все операции с базой асинхронные.

## Проверка в Compass

Подключение: mongodb://127.0.0.1:27017

Открыть food_delivery → dishes. После seed должно быть 20 документов. Создать блюдо через POST в Postman и обновить список в Compass. Затем изменить цену через PUT, проверить документ в Compass, удалить тестовое блюдо через DELETE и убедиться, что оно исчезло.
Пример фильтра Compass: {"category":"Пицца"}. Пример сортировки: {"price":1}.
На вкладке Indexes проверить составной индекс category_1_available_1.

## Тестирование

Коллекция postman/Food_Delivery.postman_collection.json использует порт 3011 и сохраняет ObjectId созданного блюда. Запускать запросы по порядку.
Команда npm test проверяет CRUD в отдельной временной базе food_delivery_test_* и удаляет только созданный тестовый документ. Рабочее меню не меняется.

## Документация

- https://mongoosejs.com/docs/guide.html
- https://mongoosejs.com/docs/validation.html
- https://www.mongodb.com/docs/compass/current/
