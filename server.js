const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Разрешаем запросы с любых доменов (для разработки)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

app.use(express.json());

// Файл для хранения данных
const DATA_FILE = path.join(__dirname, 'players.json');

// Загрузка данных
function loadPlayers() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
  return [];
}

// Сохранение данных
function savePlayers(players) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(players, null, 2));
    return true;
  } catch (error) {
    console.error('Ошибка сохранения данных:', error);
    return false;
  }
}

// Маршруты API

// Получить всех игроков
app.get('/api/players', (req, res) => {
  const players = loadPlayers();
  res.json(players);
});

// Обновить/добавить игрока
app.post('/api/update-player', (req, res) => {
  const { playerId, name, avatar, balance, stats } = req.body;
  
  console.log('Получены данные от игрока:', { playerId, name, balance });
  
  let players = loadPlayers();
  
  // Найти существующего игрока
  const existingIndex = players.findIndex(p => p.id === playerId);
  
  const playerData = {
    id: playerId,
    name: name || 'Игрок',
    avatar: avatar || '👨‍💼',
    balance: balance || 100,
    stats: stats || { totalGames: 0, gamesWon: 0, gamesLost: 0 },
    lastUpdate: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    // Обновить существующего
    players[existingIndex] = {
      ...players[existingIndex],
      ...playerData
    };
    console.log(`Обновлен игрок: ${name}`);
  } else {
    // Добавить нового
    playerData.joinedDate = new Date().toISOString();
    players.push(playerData);
    console.log(`Добавлен новый игрок: ${name}`);
  }
  
  // Очистить старые записи (старше 7 дней)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  players = players.filter(player => new Date(player.lastUpdate) > sevenDaysAgo);
  
  // Сохранить
  if (savePlayers(players)) {
    res.json({ 
      success: true, 
      message: 'Данные сохранены',
      totalPlayers: players.length 
    });
  } else {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка сохранения' 
    });
  }
});

// Получить лидерборд (топ-10)
app.get('/api/leaderboard', (req, res) => {
  const players = loadPlayers();
  
  // Сортировка по балансу
  const sorted = players.sort((a, b) => b.balance - a.balance);
  
  // Топ-10 с рангами
  const leaderboard = sorted.slice(0, 10).map((player, index) => ({
    rank: index + 1,
    ...player
  }));
  
  res.json(leaderboard);
});

// Статус сервера
app.get('/api/status', (req, res) => {
  const players = loadPlayers();
  res.json({
    status: 'online',
    playersCount: players.length,
    serverTime: new Date().toISOString()
  });
});

// Статический контент (если нужно)
app.use(express.static(path.join(__dirname, '../frontend')));

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`🌐 API доступен по адресу: http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET  /api/players - все игроки`);
  console.log(`   POST /api/update-player - обновить игрока`);
  console.log(`   GET  /api/leaderboard - топ-10 игроков`);
  console.log(`   GET  /api/status - статус сервера`);
});