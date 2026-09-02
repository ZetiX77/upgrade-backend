const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Разрешаем фронтенду делать запросы
app.use(express.json());

// Временная "база данных" в памяти сервера (в продакшене используй PostgreSQL/MongoDB)
const USERS_DB = {
  // id пользователя: балансы
  'demo_user': { STARS: 50000, GRAM: 5000 }
};

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

// ЭНДПОИНТ: Прокрутка рулетки (Апгрейд)
app.post('/api/spin', (req, res) => {
  const { userId = 'demo_user', currency, bet, targetId } = req.body;

  // 1. Проверка существования пользователя
  const userBalance = USERS_DB[userId];
  if (!userBalance) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  // 2. Проверка предмета
  const targetItem = CATALOG[currency]?.find(item => item.id === targetId);
  if (!targetItem) {
    return res.status(400).json({ error: 'Предмет не найден' });
  }

  // 3. Проверка и списание баланса
  if (userBalance[currency] < bet) {
    return res.status(400).json({ error: 'Недостаточно средств!' });
  }

  userBalance[currency] -= bet; // Списываем ставку

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
    userBalance[currency] += targetItem.price;
  } else {
    const minLoss = chanceDeg + 5;
    const maxLoss = 355;
    finalAngle = minLoss >= maxLoss ? 358 : minLoss + Math.random() * (maxLoss - minLoss);
  }

  // 6. Возвращаем результат клиенту
  res.json({
    success: true,
    isWin,
    finalAngle, // Сервер указывает точный угол остановки
    newBalance: userBalance[currency],
    winAmount: isWin ? targetItem.price : 0
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на http://localhost:${PORT}`));