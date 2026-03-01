import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import {
  addMemoryBriefing,
  addMemoryConsultation,
  addMemoryEntranceTest,
  checkDbConnection,
  getPool,
  initializeDatabase,
  isDbReady,
  listMemoryBriefings,
  listMemoryConsultations,
  listMemoryEntranceTests,
  listMemorySiteSections,
  listSiteSectionsFromDb,
  seedMemoryDataIfEmpty,
  setDbReady,
  updateMemorySiteSection,
  updateMemorySiteSectionImage,
  updateSiteSectionFromDb,
  updateSiteSectionImageFromDb
} from './db.js';

const app = express();
const port = Number(process.env.PORT || 4000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext || '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `section-${unique}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      cb(new Error('이미지 파일만 업로드할 수 있습니다.'));
      return;
    }
    cb(null, true);
  }
});

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  })
);
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

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
    brand: '예설라',
    headline: '합격과 점수 상승을 만드는 스터디 운영 시스템',
    stats: [
      { label: '목표 점수 도달 비율', value: '91%' },
      { label: '누적 수강생', value: '3,200+' },
      { label: '평균 만족도', value: '4.9/5' },
      { label: '운영 데이터 기반 개선', value: '6년' }
    ]
  });
});

app.get('/api/site-sections', async (_req, res) => {
  try {
    if (isDbReady()) {
      const rows = await listSiteSectionsFromDb();
      return res.json(rows);
    }

    return res.json(listMemorySiteSections());
  } catch (error) {
    return res.status(500).json({ message: '섹션 조회 중 오류가 발생했습니다.', error: error.message });
  }
});

app.put('/api/site-sections/:sectionKey', async (req, res) => {
  const { sectionKey } = req.params;
  const { title, subtitle, description, items } = req.body || {};

  if (!sectionKey || !title || !subtitle || !description) {
    return res.status(400).json({ message: '필수 항목이 누락되었습니다.' });
  }

  const payload = {
    title: String(title).trim(),
    subtitle: String(subtitle).trim(),
    description: String(description).trim(),
    items: Array.isArray(items)
      ? items.map((item) => String(item || '').trim()).filter(Boolean)
      : []
  };

  try {
    if (isDbReady()) {
      const row = await updateSiteSectionFromDb(sectionKey, payload);
      if (!row) {
        return res.status(404).json({ message: '해당 섹션을 찾을 수 없습니다.' });
      }
      return res.json({ message: '섹션이 저장되었습니다.', section: row });
    }

    const row = updateMemorySiteSection(sectionKey, payload);
    if (!row) {
      return res.status(404).json({ message: '해당 섹션을 찾을 수 없습니다.' });
    }

    return res.json({ message: '섹션이 저장되었습니다. (메모리 모드)', section: row });
  } catch (error) {
    return res.status(500).json({ message: '섹션 저장 중 오류가 발생했습니다.', error: error.message });
  }
});

app.post('/api/site-sections/:sectionKey/image', upload.single('image'), async (req, res) => {
  const { sectionKey } = req.params;
  if (!sectionKey) {
    return res.status(400).json({ message: '섹션 키가 필요합니다.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: '이미지 파일이 필요합니다.' });
  }

  const imagePath = `/uploads/${req.file.filename}`;

  try {
    if (isDbReady()) {
      const row = await updateSiteSectionImageFromDb(sectionKey, imagePath);
      if (!row) {
        return res.status(404).json({ message: '해당 섹션을 찾을 수 없습니다.' });
      }
      return res.json({ message: '이미지가 저장되었습니다.', section: row });
    }

    const row = updateMemorySiteSectionImage(sectionKey, imagePath);
    if (!row) {
      return res.status(404).json({ message: '해당 섹션을 찾을 수 없습니다.' });
    }

    return res.json({ message: '이미지가 저장되었습니다. (메모리 모드)', section: row });
  } catch (error) {
    return res.status(500).json({ message: '이미지 저장 중 오류가 발생했습니다.', error: error.message });
  }
});

app.delete('/api/site-sections/:sectionKey/image', async (req, res) => {
  const { sectionKey } = req.params;
  if (!sectionKey) {
    return res.status(400).json({ message: '섹션 키가 필요합니다.' });
  }

  try {
    if (isDbReady()) {
      const row = await updateSiteSectionImageFromDb(sectionKey, null);
      if (!row) {
        return res.status(404).json({ message: '해당 섹션을 찾을 수 없습니다.' });
      }
      return res.json({ message: '이미지가 삭제되었습니다.', section: row });
    }

    const row = updateMemorySiteSectionImage(sectionKey, null);
    if (!row) {
      return res.status(404).json({ message: '해당 섹션을 찾을 수 없습니다.' });
    }

    return res.json({ message: '이미지가 삭제되었습니다. (메모리 모드)', section: row });
  } catch (error) {
    return res.status(500).json({ message: '이미지 삭제 중 오류가 발생했습니다.', error: error.message });
  }
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
      const [result] = await getPool().execute(
        `
          INSERT INTO consultations (name, phone, goal, available_time)
          VALUES (?, ?, ?, ?)
        `,
        [payload.name, payload.phone, payload.goal, payload.availableTime]
      );

      return res.status(201).json({ message: '상담 신청이 접수되었습니다.', id: result.insertId });
    }

    const row = addMemoryConsultation(payload);
    return res.status(201).json({ message: '상담 신청이 접수되었습니다. (메모리 모드)', id: row.id });
  } catch (error) {
    return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
});

app.get('/api/consultations', async (_req, res) => {
  try {
    if (isDbReady()) {
      const [rows] = await getPool().query(
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

app.post('/api/briefings', async (req, res) => {
  const { parentName, studentName, phone, grade } = req.body || {};
  if (!parentName || !studentName || !phone || !grade) {
    return res.status(400).json({ message: '필수 항목이 누락되었습니다.' });
  }

  try {
    const payload = {
      parentName: String(parentName).trim(),
      studentName: String(studentName).trim(),
      phone: String(phone).trim(),
      grade: String(grade).trim()
    };

    if (isDbReady()) {
      const [result] = await getPool().execute(
        `
          INSERT INTO briefing_applications (parent_name, student_name, phone, grade)
          VALUES (?, ?, ?, ?)
        `,
        [payload.parentName, payload.studentName, payload.phone, payload.grade]
      );
      return res.status(201).json({ message: '설명회 신청이 접수되었습니다.', id: result.insertId });
    }

    const row = addMemoryBriefing(payload);
    return res.status(201).json({ message: '설명회 신청이 접수되었습니다. (메모리 모드)', id: row.id });
  } catch (error) {
    return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
});

app.get('/api/briefings', async (_req, res) => {
  try {
    if (isDbReady()) {
      const [rows] = await getPool().query(
        `
          SELECT id, parent_name AS parentName, student_name AS studentName, phone, grade, created_at AS createdAt
          FROM briefing_applications
          ORDER BY id DESC
          LIMIT 50
        `
      );
      return res.json(rows);
    }

    return res.json(listMemoryBriefings(50));
  } catch (error) {
    return res.status(500).json({ message: '목록 조회 중 오류가 발생했습니다.', error: error.message });
  }
});

app.post('/api/entrance-tests', async (req, res) => {
  const { name, phone, grade, preferredDate } = req.body || {};
  if (!name || !phone || !grade || !preferredDate) {
    return res.status(400).json({ message: '필수 항목이 누락되었습니다.' });
  }

  try {
    const payload = {
      name: String(name).trim(),
      phone: String(phone).trim(),
      grade: String(grade).trim(),
      preferredDate: String(preferredDate).trim()
    };

    if (isDbReady()) {
      const [result] = await getPool().execute(
        `
          INSERT INTO entrance_tests (name, phone, grade, preferred_date)
          VALUES (?, ?, ?, ?)
        `,
        [payload.name, payload.phone, payload.grade, payload.preferredDate]
      );
      return res.status(201).json({ message: '진단테스트 신청이 접수되었습니다.', id: result.insertId });
    }

    const row = addMemoryEntranceTest(payload);
    return res.status(201).json({ message: '진단테스트 신청이 접수되었습니다. (메모리 모드)', id: row.id });
  } catch (error) {
    return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
});

app.get('/api/entrance-tests', async (_req, res) => {
  try {
    if (isDbReady()) {
      const [rows] = await getPool().query(
        `
          SELECT id, name, phone, grade, preferred_date AS preferredDate, created_at AS createdAt
          FROM entrance_tests
          ORDER BY id DESC
          LIMIT 50
        `
      );
      return res.json(rows);
    }

    return res.json(listMemoryEntranceTests(50));
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
    seedMemoryDataIfEmpty();
    console.warn(`MySQL unavailable (${error.message}). Running in memory fallback mode.`);
  }

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

bootstrap();
