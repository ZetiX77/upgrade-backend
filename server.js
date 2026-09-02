const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Подключение к MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Ошибка: Переменная MONGO_URI не задана!');
} else {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Успешно подключено к MongoDB Atlas'))
    .catch(err => console.error('❌ Ошибка подключения к MongoDB:', err));
}

// 2. Модель пользователя для БД
const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: { type: String, default: 'Guest' },
  balances: {
    STARS: { type: Number, default: 50000 },
    GRAM: { type: Number, default: 5000 }
  }
});

const User = mongoose.model('User', userSchema);

// Каталог предметов
const CATALOG = {
  STARS: [
    { id: 1, price: 150, title: 'Ракета' },
    { id: 2, price: 300, title: 'Корона' },
    { id: 3, price: 500, title: 'Алмаз' },
    { id: 4, price: 800, title: 'Спорткар' },
    { id: 5, price: 1200, title: 'Остров' },
    { id: 6, price: 2500, title: 'Планета' }
  ],
  GRAM: [
    { id: 1, price: 15, title: 'Кристалл' },
    { id: 2, price: 50, title: 'Золото' },
    { id: 3, price: 120, title: 'Киберсупер' },
    { id: 4, price: 300, title: 'НЛО' },
    { id: 5, price: 750, title: 'Мегаполис' },
    { id: 6, price: 1500, title: 'Черная Дыра' }
  ]
};

// ЭНДПОИНТ: Получение или создание пользователя
app.post('/api/user', async (req, res) => {
  const { telegramId = 'demo_user', username = 'Guest' } = req.body;

  try {
    let user = await User.findOne({ telegramId });
    if (!user) {
      user = new User({ telegramId, username });
      await user.save();
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера при загрузке пользователя' });
  }
});

// ЭНДПОИНТ: Прокрутка рулетки (Апгрейд)
app.post('/api/spin', async (req, res) => {
  const { userId = 'demo_user', currency, bet, targetId } = req.body;

  try {
    // 1. Поиск пользователя в базе
    let user = await User.findOne({ telegramId: userId });
    if (!user) {
      user = new User({ telegramId: userId });
      await user.save();
    }

    // 2. Проверка предмета
    const targetItem = CATALOG[currency]?.find(item => item.id === targetId);
    if (!targetItem) {
      return res.status(400).json({ error: 'Предмет не найден' });
    }

    // 3. Проверка и списание баланса
    if (user.balances[currency] < bet) {
      return res.status(400).json({ error: 'Недостаточно средств!' });
    }

    user.balances[currency] -= bet;

    // 4. Расчет шанса на СЕРВЕРЕ
    let chance = (bet / targetItem.price) * 92;
    if (chance > 92) chance = 92;
    if (chance < 0.1) chance = 0.1;

    // 5. Определение победы на СЕРВЕРЕ
    const isWin = Math.random() * 100 <= chance;
    const chanceDeg = (chance / 100) * 360;
    let finalAngle = 0;

    if (isWin) {
      const minWin = Math.min(5, chanceDeg / 2);
      const maxWin = Math.max(chanceDeg - 5, minWin);
      finalAngle = minWin + Math.random() * (maxWin - minWin);

      // Зачисляем выигрыш
      user.balances[currency] += targetItem.price;
    } else {
      const minLoss = chanceDeg + 5;
      const maxLoss = 355;
      finalAngle = minLoss >= maxLoss ? 358 : minLoss + Math.random() * (maxLoss - minLoss);
    }

    // Сохраняем обновленные балансы в MongoDB Atlas
    await user.save();

    // 6. Возвращаем результат клиенту
    res.json({
      success: true,
      isWin,
      finalAngle,
      newBalance: user.balances[currency],
      winAmount: isWin ? targetItem.price : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера во время спина' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
