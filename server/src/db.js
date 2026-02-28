import mysql from 'mysql2/promise';

let pool;
let dbReady = false;
let memoryConsultations = [];

const SAMPLE_CONSULTATIONS = [
  {
    name: '김민수',
    phone: '010-1111-2222',
    goal: '8주 내 목표 점수 85점 달성',
    availableTime: '평일 저녁'
  },
  {
    name: '이서연',
    phone: '010-3333-4444',
    goal: '기초 문법 완성과 학습 습관 만들기',
    availableTime: '평일 오전'
  },
  {
    name: '박지훈',
    phone: '010-5555-6666',
    goal: '3개월 내 자격증 합격',
    availableTime: '주말'
  }
];

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });
  }

  return pool;
}

export async function checkDbConnection() {
  const conn = await getPool().getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

export async function initializeDatabase() {
  const poolRef = getPool();

  await poolRef.query(`
    CREATE TABLE IF NOT EXISTS consultations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(60) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      goal VARCHAR(255) NOT NULL,
      available_time VARCHAR(40) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [countRows] = await poolRef.query('SELECT COUNT(*) AS count FROM consultations');
  const currentCount = Number(countRows?.[0]?.count || 0);

  if (currentCount === 0) {
    await poolRef.query(
      `
        INSERT INTO consultations (name, phone, goal, available_time)
        VALUES
          (?, ?, ?, ?),
          (?, ?, ?, ?),
          (?, ?, ?, ?)
      `,
      [
        SAMPLE_CONSULTATIONS[0].name,
        SAMPLE_CONSULTATIONS[0].phone,
        SAMPLE_CONSULTATIONS[0].goal,
        SAMPLE_CONSULTATIONS[0].availableTime,
        SAMPLE_CONSULTATIONS[1].name,
        SAMPLE_CONSULTATIONS[1].phone,
        SAMPLE_CONSULTATIONS[1].goal,
        SAMPLE_CONSULTATIONS[1].availableTime,
        SAMPLE_CONSULTATIONS[2].name,
        SAMPLE_CONSULTATIONS[2].phone,
        SAMPLE_CONSULTATIONS[2].goal,
        SAMPLE_CONSULTATIONS[2].availableTime
      ]
    );
  }

  dbReady = true;
}

export function isDbReady() {
  return dbReady;
}

export function setDbReady(value) {
  dbReady = Boolean(value);
}

export function seedMemoryConsultationsIfEmpty() {
  if (memoryConsultations.length > 0) return;

  const now = Date.now();
  memoryConsultations = SAMPLE_CONSULTATIONS.map((item, idx) => ({
    id: idx + 1,
    name: item.name,
    phone: item.phone,
    goal: item.goal,
    availableTime: item.availableTime,
    createdAt: new Date(now - idx * 60000).toISOString()
  }));
}

export function addMemoryConsultation({ name, phone, goal, availableTime }) {
  const maxId = memoryConsultations.reduce((acc, row) => Math.max(acc, Number(row.id) || 0), 0);
  const nextId = maxId + 1;
  const row = {
    id: nextId,
    name,
    phone,
    goal,
    availableTime,
    createdAt: new Date().toISOString()
  };
  memoryConsultations = [row, ...memoryConsultations];
  return row;
}

export function listMemoryConsultations(limit = 50) {
  return memoryConsultations.slice(0, limit);
}
