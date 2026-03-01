import mysql from 'mysql2/promise';
import crypto from 'crypto';

let pool;
let dbReady = false;
let memoryConsultations = [];
let memoryBriefings = [];
let memoryEntranceTests = [];
let memorySiteSections = [];
const DEFAULT_ADMIN_USERNAME = 'hanchang';
const DEFAULT_ADMIN_PASSWORD = 'gksckdqudtls!@';
const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEYLEN = 64;
const PASSWORD_DIGEST = 'sha512';

function createPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEYLEN, PASSWORD_DIGEST)
    .toString('hex');
  return { passwordSalt: salt, passwordHash: hash };
}

function isPasswordValid(password, passwordSalt, passwordHash) {
  if (!password || !passwordSalt || !passwordHash) return false;

  const computed = crypto
    .pbkdf2Sync(password, passwordSalt, PASSWORD_ITERATIONS, PASSWORD_KEYLEN, PASSWORD_DIGEST)
    .toString('hex');

  const left = Buffer.from(computed, 'hex');
  const right = Buffer.from(passwordHash, 'hex');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

const initialAdminPassword = createPasswordRecord(DEFAULT_ADMIN_PASSWORD);
let memoryAdminCredential = {
  username: DEFAULT_ADMIN_USERNAME,
  passwordSalt: initialAdminPassword.passwordSalt,
  passwordHash: initialAdminPassword.passwordHash
};

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

const SAMPLE_BRIEFINGS = [
  {
    parentName: '김영희',
    studentName: '김하늘',
    phone: '010-2345-6789',
    grade: '중2'
  },
  {
    parentName: '이민정',
    studentName: '이준서',
    phone: '010-8765-4321',
    grade: '고1'
  }
];

const SAMPLE_ENTRANCE_TESTS = [
  {
    name: '최유진',
    phone: '010-1234-5678',
    grade: '중3',
    preferredDate: '2026-03-10'
  },
  {
    name: '한지우',
    phone: '010-4567-1234',
    grade: '고2',
    preferredDate: '2026-03-12'
  }
];

export const DEFAULT_SITE_SECTIONS = [
  {
    sectionKey: 'yesella-meaning',
    menuGroup: '한글리시',
    menuLabel: '한글리시 의미',
    title: '한글리시 의미',
    subtitle: '합격과 점수 상승을 만드는 스터디 운영 시스템',
    description: '한글리시는 예측 가능한 학습 설계와 실행력으로 학생의 성장을 만드는 학습 브랜드입니다.',
    items: []
  },
  {
    sectionKey: 'yesella-goal',
    menuGroup: '한글리시',
    menuLabel: '한글리시 학습목표',
    title: '한글리시 학습목표',
    subtitle: '측정 가능한 성과 중심 학습',
    description: '주간 루틴 정착, 실전 점수 향상, 최종 합격까지 관리합니다.',
    items: ['학습 습관 정착', '실전 점수 향상', '최종 합격 완성']
  },
  {
    sectionKey: 'yesella-diff',
    menuGroup: '한글리시',
    menuLabel: '한글리시만의 차별성',
    title: '한글리시만의 차별성',
    subtitle: '데이터 + 코칭 + 실행관리',
    description: '학습량/정답률 데이터 기반으로 개인별 개선 경로를 제공합니다.',
    items: ['데이터 리포트', '1:1 피드백', '완주관리']
  },
  {
    sectionKey: 'education-course',
    menuGroup: '학습 안내',
    menuLabel: '교육 과정',
    title: '교육 과정',
    subtitle: '레벨 맞춤형 교육 트랙',
    description: '입문, 심화, 실전 트랙으로 레벨에 맞춰 학습합니다.',
    items: ['입문 과정', '심화 과정', '실전 과정']
  },
  {
    sectionKey: 'program-list',
    menuGroup: '학습 안내',
    menuLabel: '프로그램',
    title: '프로그램',
    subtitle: '목표별 맞춤 과정',
    description: '학생 목표와 기간에 맞춘 트랙을 운영합니다.',
    items: []
  },
  {
    sectionKey: 'books',
    menuGroup: '학습 안내',
    menuLabel: '교재구성',
    title: '교재구성',
    subtitle: '학습 단계별 전용 교재',
    description: '개념서/유형서/실전서로 구성됩니다.',
    items: ['개념서', '유형서', '실전서']
  },
  {
    sectionKey: 'notice',
    menuGroup: '학원 안내',
    menuLabel: '공지사항',
    title: '공지사항',
    subtitle: '최신 학원 소식',
    description: '모집 일정, 공지, 이벤트 안내를 확인하세요.',
    items: []
  },
  {
    sectionKey: 'briefing',
    menuGroup: '학원 안내',
    menuLabel: '설명회신청',
    title: '설명회신청',
    subtitle: '학부모 설명회 신청',
    description: '학습 운영 방식과 진학 로드맵을 안내드립니다.',
    items: []
  },
  {
    sectionKey: 'entrance-test',
    menuGroup: '학원 안내',
    menuLabel: '입학(진단)테스트',
    title: '입학(진단)테스트',
    subtitle: '진단테스트 신청',
    description: '현재 실력을 진단하고 반배치를 안내합니다.',
    items: []
  },
  {
    sectionKey: 'direction',
    menuGroup: '학원 안내',
    menuLabel: '오시는 길',
    title: '오시는 길',
    subtitle: '한글리시 학원 위치 안내',
    description: '서울시 강남구 테헤란로 123, 한글리시빌딩 5층',
    items: []
  }
];

function nextId(items) {
  const maxId = items.reduce((acc, row) => Math.max(acc, Number(row.id) || 0), 0);
  return maxId + 1;
}

function safeParseItems(itemsJson) {
  if (Array.isArray(itemsJson)) return itemsJson;
  if (Buffer.isBuffer(itemsJson)) {
    try {
      const parsed = JSON.parse(itemsJson.toString('utf8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (!itemsJson) return [];
  try {
    const parsed = JSON.parse(itemsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeSectionRow(row) {
  return {
    id: row.id,
    sectionKey: row.section_key,
    menuGroup: row.menu_group,
    menuLabel: row.menu_label,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    items: safeParseItems(row.items_json),
    imagePath: row.image_path,
    updatedAt: row.updated_at
  };
}

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

  await poolRef.query(`
    CREATE TABLE IF NOT EXISTS briefing_applications (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      parent_name VARCHAR(60) NOT NULL,
      student_name VARCHAR(60) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      grade VARCHAR(30) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await poolRef.query(`
    CREATE TABLE IF NOT EXISTS entrance_tests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(60) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      grade VARCHAR(30) NOT NULL,
      preferred_date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await poolRef.query(`
    CREATE TABLE IF NOT EXISTS site_sections (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      section_key VARCHAR(80) NOT NULL,
      menu_group VARCHAR(80) NOT NULL,
      menu_label VARCHAR(80) NOT NULL,
      title VARCHAR(120) NOT NULL,
      subtitle VARCHAR(180) NOT NULL,
      description TEXT NOT NULL,
      items_json JSON NULL,
      image_path VARCHAR(255) NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_section_key (section_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await poolRef.query(`
    CREATE TABLE IF NOT EXISTS admin_credentials (
      username VARCHAR(60) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      password_salt VARCHAR(120) NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [adminRows] = await poolRef.execute(
    `
      SELECT username
      FROM admin_credentials
      WHERE username = ?
      LIMIT 1
    `,
    [DEFAULT_ADMIN_USERNAME]
  );

  if (adminRows.length === 0) {
    const passwordRecord = createPasswordRecord(DEFAULT_ADMIN_PASSWORD);
    await poolRef.execute(
      `
        INSERT INTO admin_credentials (username, password_hash, password_salt)
        VALUES (?, ?, ?)
      `,
      [DEFAULT_ADMIN_USERNAME, passwordRecord.passwordHash, passwordRecord.passwordSalt]
    );
  }

  const [consultCountRows] = await poolRef.query('SELECT COUNT(*) AS count FROM consultations');
  if (Number(consultCountRows?.[0]?.count || 0) === 0) {
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

  const [briefingCountRows] = await poolRef.query('SELECT COUNT(*) AS count FROM briefing_applications');
  if (Number(briefingCountRows?.[0]?.count || 0) === 0) {
    await poolRef.query(
      `
        INSERT INTO briefing_applications (parent_name, student_name, phone, grade)
        VALUES
          (?, ?, ?, ?),
          (?, ?, ?, ?)
      `,
      [
        SAMPLE_BRIEFINGS[0].parentName,
        SAMPLE_BRIEFINGS[0].studentName,
        SAMPLE_BRIEFINGS[0].phone,
        SAMPLE_BRIEFINGS[0].grade,
        SAMPLE_BRIEFINGS[1].parentName,
        SAMPLE_BRIEFINGS[1].studentName,
        SAMPLE_BRIEFINGS[1].phone,
        SAMPLE_BRIEFINGS[1].grade
      ]
    );
  }

  const [testCountRows] = await poolRef.query('SELECT COUNT(*) AS count FROM entrance_tests');
  if (Number(testCountRows?.[0]?.count || 0) === 0) {
    await poolRef.query(
      `
        INSERT INTO entrance_tests (name, phone, grade, preferred_date)
        VALUES
          (?, ?, ?, ?),
          (?, ?, ?, ?)
      `,
      [
        SAMPLE_ENTRANCE_TESTS[0].name,
        SAMPLE_ENTRANCE_TESTS[0].phone,
        SAMPLE_ENTRANCE_TESTS[0].grade,
        SAMPLE_ENTRANCE_TESTS[0].preferredDate,
        SAMPLE_ENTRANCE_TESTS[1].name,
        SAMPLE_ENTRANCE_TESTS[1].phone,
        SAMPLE_ENTRANCE_TESTS[1].grade,
        SAMPLE_ENTRANCE_TESTS[1].preferredDate
      ]
    );
  }

  for (const section of DEFAULT_SITE_SECTIONS) {
    await poolRef.query(
      `
        INSERT INTO site_sections
          (section_key, menu_group, menu_label, title, subtitle, description, items_json, image_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE section_key = section_key
      `,
      [
        section.sectionKey,
        section.menuGroup,
        section.menuLabel,
        section.title,
        section.subtitle,
        section.description,
        JSON.stringify(section.items || []),
        section.imagePath || null
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

export function seedMemoryDataIfEmpty() {
  const now = Date.now();

  if (memoryConsultations.length === 0) {
    memoryConsultations = SAMPLE_CONSULTATIONS.map((item, idx) => ({
      id: idx + 1,
      name: item.name,
      phone: item.phone,
      goal: item.goal,
      availableTime: item.availableTime,
      createdAt: new Date(now - idx * 60000).toISOString()
    }));
  }

  if (memoryBriefings.length === 0) {
    memoryBriefings = SAMPLE_BRIEFINGS.map((item, idx) => ({
      id: idx + 1,
      parentName: item.parentName,
      studentName: item.studentName,
      phone: item.phone,
      grade: item.grade,
      createdAt: new Date(now - idx * 60000).toISOString()
    }));
  }

  if (memoryEntranceTests.length === 0) {
    memoryEntranceTests = SAMPLE_ENTRANCE_TESTS.map((item, idx) => ({
      id: idx + 1,
      name: item.name,
      phone: item.phone,
      grade: item.grade,
      preferredDate: item.preferredDate,
      createdAt: new Date(now - idx * 60000).toISOString()
    }));
  }

  if (memorySiteSections.length === 0) {
    memorySiteSections = DEFAULT_SITE_SECTIONS.map((section, idx) => ({
      id: idx + 1,
      sectionKey: section.sectionKey,
      menuGroup: section.menuGroup,
      menuLabel: section.menuLabel,
      title: section.title,
      subtitle: section.subtitle,
      description: section.description,
      items: section.items,
      imagePath: null,
      updatedAt: new Date(now).toISOString()
    }));
  }
}

export function addMemoryConsultation({ name, phone, goal, availableTime }) {
  const row = {
    id: nextId(memoryConsultations),
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

export function addMemoryBriefing({ parentName, studentName, phone, grade }) {
  const row = {
    id: nextId(memoryBriefings),
    parentName,
    studentName,
    phone,
    grade,
    createdAt: new Date().toISOString()
  };
  memoryBriefings = [row, ...memoryBriefings];
  return row;
}

export function listMemoryBriefings(limit = 50) {
  return memoryBriefings.slice(0, limit);
}

export function addMemoryEntranceTest({ name, phone, grade, preferredDate }) {
  const row = {
    id: nextId(memoryEntranceTests),
    name,
    phone,
    grade,
    preferredDate,
    createdAt: new Date().toISOString()
  };
  memoryEntranceTests = [row, ...memoryEntranceTests];
  return row;
}

export function listMemoryEntranceTests(limit = 50) {
  return memoryEntranceTests.slice(0, limit);
}

export async function listSiteSectionsFromDb() {
  const [rows] = await getPool().query(
    `
      SELECT id, section_key, menu_group, menu_label, title, subtitle, description, items_json, image_path, updated_at
      FROM site_sections
      ORDER BY id ASC
    `
  );

  return rows.map(normalizeSectionRow);
}

export async function updateSiteSectionFromDb(sectionKey, payload) {
  const itemsJson = JSON.stringify(Array.isArray(payload.items) ? payload.items : []);

  await getPool().execute(
    `
      UPDATE site_sections
      SET menu_group = ?, menu_label = ?, title = ?, subtitle = ?, description = ?, items_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE section_key = ?
    `,
    [payload.menuGroup, payload.menuLabel, payload.title, payload.subtitle, payload.description, itemsJson, sectionKey]
  );

  const [rows] = await getPool().execute(
    `
      SELECT id, section_key, menu_group, menu_label, title, subtitle, description, items_json, image_path, updated_at
      FROM site_sections
      WHERE section_key = ?
      LIMIT 1
    `,
    [sectionKey]
  );

  return rows.length > 0 ? normalizeSectionRow(rows[0]) : null;
}

export async function createSiteSectionFromDb(payload) {
  const itemsJson = JSON.stringify(Array.isArray(payload.items) ? payload.items : []);
  await getPool().execute(
    `
      INSERT INTO site_sections
        (section_key, menu_group, menu_label, title, subtitle, description, items_json, image_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
    `,
    [payload.sectionKey, payload.menuGroup, payload.menuLabel, payload.title, payload.subtitle, payload.description, itemsJson]
  );

  const [rows] = await getPool().execute(
    `
      SELECT id, section_key, menu_group, menu_label, title, subtitle, description, items_json, image_path, updated_at
      FROM site_sections
      WHERE section_key = ?
      LIMIT 1
    `,
    [payload.sectionKey]
  );

  return rows.length > 0 ? normalizeSectionRow(rows[0]) : null;
}

export async function deleteSiteSectionFromDb(sectionKey) {
  const [result] = await getPool().execute(
    `
      DELETE FROM site_sections
      WHERE section_key = ?
      LIMIT 1
    `,
    [sectionKey]
  );
  return Number(result.affectedRows || 0) > 0;
}

export async function updateSiteSectionImageFromDb(sectionKey, imagePath) {
  await getPool().execute(
    `
      UPDATE site_sections
      SET image_path = ?, updated_at = CURRENT_TIMESTAMP
      WHERE section_key = ?
    `,
    [imagePath, sectionKey]
  );

  const [rows] = await getPool().execute(
    `
      SELECT id, section_key, menu_group, menu_label, title, subtitle, description, items_json, image_path, updated_at
      FROM site_sections
      WHERE section_key = ?
      LIMIT 1
    `,
    [sectionKey]
  );

  return rows.length > 0 ? normalizeSectionRow(rows[0]) : null;
}

export function listMemorySiteSections() {
  return memorySiteSections;
}

export function updateMemorySiteSection(sectionKey, payload) {
  memorySiteSections = memorySiteSections.map((section) =>
    section.sectionKey === sectionKey
      ? {
          ...section,
          menuGroup: payload.menuGroup,
          menuLabel: payload.menuLabel,
          title: payload.title,
          subtitle: payload.subtitle,
          description: payload.description,
          items: Array.isArray(payload.items) ? payload.items : [],
          updatedAt: new Date().toISOString()
        }
      : section
  );

  return memorySiteSections.find((section) => section.sectionKey === sectionKey) || null;
}

export function createMemorySiteSection(payload) {
  const row = {
    id: nextId(memorySiteSections),
    sectionKey: payload.sectionKey,
    menuGroup: payload.menuGroup,
    menuLabel: payload.menuLabel,
    title: payload.title,
    subtitle: payload.subtitle,
    description: payload.description,
    items: Array.isArray(payload.items) ? payload.items : [],
    imagePath: null,
    updatedAt: new Date().toISOString()
  };
  memorySiteSections = [...memorySiteSections, row];
  return row;
}

export function deleteMemorySiteSection(sectionKey) {
  const before = memorySiteSections.length;
  memorySiteSections = memorySiteSections.filter((section) => section.sectionKey !== sectionKey);
  return memorySiteSections.length < before;
}

export function updateMemorySiteSectionImage(sectionKey, imagePath) {
  memorySiteSections = memorySiteSections.map((section) =>
    section.sectionKey === sectionKey
      ? {
          ...section,
          imagePath,
          updatedAt: new Date().toISOString()
        }
      : section
  );

  return memorySiteSections.find((section) => section.sectionKey === sectionKey) || null;
}

async function getAdminCredentialFromDb(username) {
  const [rows] = await getPool().execute(
    `
      SELECT username, password_hash AS passwordHash, password_salt AS passwordSalt
      FROM admin_credentials
      WHERE username = ?
      LIMIT 1
    `,
    [username]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function verifyAdminCredential(username, password) {
  const normalizedUsername = String(username || '').trim();
  if (!normalizedUsername || !password) return false;

  if (dbReady) {
    const credential = await getAdminCredentialFromDb(normalizedUsername);
    if (!credential) return false;
    return isPasswordValid(password, credential.passwordSalt, credential.passwordHash);
  }

  if (normalizedUsername !== memoryAdminCredential.username) return false;
  return isPasswordValid(password, memoryAdminCredential.passwordSalt, memoryAdminCredential.passwordHash);
}

export async function changeAdminPassword(username, currentPassword, newPassword) {
  const normalizedUsername = String(username || '').trim();
  if (!normalizedUsername || !currentPassword || !newPassword) {
    return { ok: false, message: '필수 항목이 누락되었습니다.' };
  }

  const valid = await verifyAdminCredential(normalizedUsername, currentPassword);
  if (!valid) {
    return { ok: false, message: '현재 비밀번호가 올바르지 않습니다.' };
  }

  const passwordRecord = createPasswordRecord(newPassword);

  if (dbReady) {
    await getPool().execute(
      `
        UPDATE admin_credentials
        SET password_hash = ?, password_salt = ?, updated_at = CURRENT_TIMESTAMP
        WHERE username = ?
      `,
      [passwordRecord.passwordHash, passwordRecord.passwordSalt, normalizedUsername]
    );
  } else if (normalizedUsername === memoryAdminCredential.username) {
    memoryAdminCredential = {
      username: normalizedUsername,
      passwordHash: passwordRecord.passwordHash,
      passwordSalt: passwordRecord.passwordSalt
    };
  }

  return { ok: true };
}
