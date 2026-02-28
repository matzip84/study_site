import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const programs = [
  {
    name: '기초 점프업반',
    desc: '학습 습관 구축 + 기본기 보완이 필요한 수험생',
    items: ['주 3회 라이브 수업', '주간 학습 플래너 점검', '1:1 과제 피드백']
  },
  {
    name: '실전 집중반',
    desc: '단기간 점수 상승/합격을 목표로 하는 수험생',
    items: ['주 2회 실전 모의고사', '오답 데이터 리포트 제공', '주간 1:1 코칭 30분'],
    featured: true
  },
  {
    name: '프리미엄 1:1반',
    desc: '개인 일정에 맞춘 완전 맞춤형 관리가 필요한 분',
    items: ['개인 커리큘럼 설계', '상시 질의응답', '시험 전 집중 케어']
  }
];

const initialForm = {
  name: '',
  phone: '',
  goal: '',
  availableTime: ''
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function AdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalCount = useMemo(() => items.length, [items]);

  const loadConsultations = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/consultations`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '신청 목록을 불러오지 못했습니다.');
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || '신청 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, []);

  return (
    <div className="page admin-page">
      <header className="site-header">
        <div className="container header-inner">
          <a href="/" className="logo">ROOT STUDY ADMIN</a>
          <nav className="nav">
            <a href="/">메인으로</a>
            <button className="btn" type="button" onClick={loadConsultations}>새로고침</button>
          </nav>
        </div>
      </header>

      <main className="section">
        <div className="container">
          <p className="eyebrow">Admin</p>
          <h1>상담 신청 목록</h1>
          <p className="admin-meta">총 {totalCount}건</p>

          {loading ? <p>불러오는 중...</p> : null}
          {error ? <p className="admin-error">{error}</p> : null}

          {!loading && !error ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>이름</th>
                    <th>연락처</th>
                    <th>목표</th>
                    <th>상담 가능 시간</th>
                    <th>신청일시</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="admin-empty">신청 데이터가 없습니다.</td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.phone}</td>
                        <td>{item.goal}</td>
                        <td>{item.availableTime}</td>
                        <td>{formatDate(item.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function LandingPage() {
  const [content, setContent] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/site-content`)
      .then((res) => res.json())
      .then((data) => setContent(data))
      .catch(() => {
        setContent({
          brand: 'ROOT STUDY',
          headline: '합격과 점수 상승을 만드는 스터디 운영 시스템',
          stats: []
        });
      });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name || !form.phone || !form.goal || !form.availableTime) {
      setStatus('필수 항목을 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    setStatus('신청 접수 중입니다...');

    try {
      const response = await fetch(`${API_BASE}/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '요청 실패');

      setStatus(`${form.name}님, 상담 신청이 접수되었습니다.`);
      setForm(initialForm);
    } catch (error) {
      setStatus(error.message || '요청 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <header className="site-header">
        <div className="container header-inner">
          <a href="#top" className="logo">{content?.brand || 'ROOT STUDY'}</a>
          <nav className="nav">
            <a href="#programs">과정안내</a>
            <a href="#reviews">후기</a>
            <a href="#apply">상담신청</a>
            <a href="/admin">관리자</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero section">
          <div className="container hero-grid">
            <div>
              <p className="eyebrow">목표 달성형 학습 설계</p>
              <h1>{content?.headline || '합격과 점수 상승을 만드는 스터디 운영 시스템'}</h1>
              <p>매주 학습량·테스트·피드백을 관리해 목표까지 끌고 갑니다.</p>
              <a className="btn" href="#apply">무료 학습 진단 받기</a>
            </div>
            <div className="metric-panel">
              {(content?.stats || []).map((s) => (
                <article key={s.label}>
                  <h3>{s.value}</h3>
                  <p>{s.label}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="programs">
          <div className="container">
            <p className="eyebrow">Program</p>
            <h2>목표별 맞춤 과정</h2>
            <div className="program-cards">
              {programs.map((p) => (
                <article className={`card ${p.featured ? 'featured' : ''}`} key={p.name}>
                  <h3>{p.name}</h3>
                  <p>{p.desc}</p>
                  <ul>
                    {p.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="reviews">
          <div className="container">
            <p className="eyebrow">Success</p>
            <h2>수강생 후기</h2>
            <div className="review-grid">
              <blockquote>
                8주 동안 학습량이 숫자로 관리돼서 목표 점수 70점에서 89점으로 올랐어요.
              </blockquote>
              <blockquote>
                매주 오답 리포트 덕분에 부족한 영역을 정확히 보완할 수 있었습니다.
              </blockquote>
              <blockquote>
                제 일정에 맞춘 커리큘럼으로 불안감이 줄고 실제 성과가 나왔습니다.
              </blockquote>
            </div>
          </div>
        </section>

        <section className="section apply" id="apply">
          <div className="container apply-grid">
            <div>
              <p className="eyebrow">Apply</p>
              <h2>무료 상담 신청</h2>
              <p>입력한 내용은 상담 목적 외에 사용하지 않습니다.</p>
            </div>
            <form className="apply-form" onSubmit={handleSubmit}>
              <label>
                이름
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                연락처
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </label>
              <label>
                목표
                <input
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  required
                />
              </label>
              <label>
                상담 가능 시간
                <select
                  value={form.availableTime}
                  onChange={(e) => setForm({ ...form, availableTime: e.target.value })}
                  required
                >
                  <option value="">선택하세요</option>
                  <option value="평일 오전">평일 오전</option>
                  <option value="평일 오후">평일 오후</option>
                  <option value="평일 저녁">평일 저녁</option>
                  <option value="주말">주말</option>
                </select>
              </label>
              <button className="btn" type="submit" disabled={submitting}>
                {submitting ? '접수 중...' : '상담 신청하기'}
              </button>
              <p className="form-message">{status}</p>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;

  if (path.startsWith('/admin')) {
    return <AdminPage />;
  }

  return <LandingPage />;
}
