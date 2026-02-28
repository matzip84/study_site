import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import {
  addMemoryConsultation,
  checkDbConnection,
  getPool,
  initializeDatabase,
  isDbReady,
  listMemoryConsultations,
  seedMemoryConsultationsIfEmpty,
  setDbReady
} from './db.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  })
);
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  if (isDbReady()) {
    try {
      await checkDbConnection();
      return res.json({ ok: true, mode: 'mysql', db: 'connected' });
    } catch (error) {
      return res.status(500).json({ ok: false, mode: 'mysql', db: 'disconnected', error: error.message });
    }
  }

  return res.json({ ok: true, mode: 'memory-fallback', db: 'disconnected' });
});

app.get('/api/site-content', (_req, res) => {
  res.json({
    brand: 'ROOT STUDY',
    headline: '합격과 점수 상승을 만드는 스터디 운영 시스템',
    stats: [
      { label: '목표 점수 도달 비율', value: '91%' },
      { label: '누적 수강생', value: '3,200+' },
      { label: '평균 만족도', value: '4.9/5' },
      { label: '운영 데이터 기반 개선', value: '6년' }
    ]
  });
});

app.post('/api/consultations', async (req, res) => {
  const { name, phone, goal, availableTime } = req.body || {};

  if (!name || !phone || !goal || !availableTime) {
    return res.status(400).json({ message: '필수 항목이 누락되었습니다.' });
  }

  try {
    const payload = {
      name: String(name).trim(),
      phone: String(phone).trim(),
      goal: String(goal).trim(),
      availableTime: String(availableTime).trim()
    };

    if (isDbReady()) {
      const pool = getPool();
      const query = `
        INSERT INTO consultations (name, phone, goal, available_time)
        VALUES (?, ?, ?, ?)
      `;

      const [result] = await pool.execute(query, [
        payload.name,
        payload.phone,
        payload.goal,
        payload.availableTime
      ]);

      return res.status(201).json({
        message: '상담 신청이 접수되었습니다.',
        id: result.insertId
      });
    }

    const row = addMemoryConsultation(payload);
    return res.status(201).json({
      message: '상담 신청이 접수되었습니다. (메모리 모드)',
      id: row.id
    });
  } catch (error) {
    return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
});

app.get('/api/consultations', async (_req, res) => {
  try {
    if (isDbReady()) {
      const pool = getPool();
      const [rows] = await pool.query(
        `
          SELECT id, name, phone, goal, available_time AS availableTime, created_at AS createdAt
          FROM consultations
          ORDER BY id DESC
          LIMIT 50
        `
      );
      return res.json(rows);
    }

    return res.json(listMemoryConsultations(50));
  } catch (error) {
    return res.status(500).json({ message: '목록 조회 중 오류가 발생했습니다.', error: error.message });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: '예상치 못한 오류가 발생했습니다.' });
});

async function bootstrap() {
  try {
    await checkDbConnection();
    await initializeDatabase();
    setDbReady(true);
    console.log('MySQL connected. Running in mysql mode.');
  } catch (error) {
    setDbReady(false);
    seedMemoryConsultationsIfEmpty();
    console.warn(`MySQL unavailable (${error.message}). Running in memory fallback mode.`);
  }

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

bootstrap();
