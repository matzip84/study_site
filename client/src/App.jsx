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

const initialBriefingForm = {
  parentName: '',
  studentName: '',
  phone: '',
  grade: ''
};

const initialTestForm = {
  name: '',
  phone: '',
  grade: '',
  preferredDate: ''
};

const fallbackSections = {
  'yesella-meaning': {
    sectionKey: 'yesella-meaning',
    title: '한글리시 의미',
    subtitle: '합격과 점수 상승을 만드는 스터디 운영 시스템',
    description: '한글리시는 예측 가능한 학습 설계와 실행력으로 학생의 성장을 만드는 학습 브랜드입니다.',
    items: [],
    imagePath: null
  },
  'yesella-goal': {
    sectionKey: 'yesella-goal',
    title: '한글리시 학습목표',
    subtitle: '측정 가능한 성과 중심 학습',
    description: '주간 루틴 정착, 실전 점수 향상, 최종 합격까지 관리합니다.',
    items: ['학습 습관 정착', '실전 점수 향상', '최종 합격 완성'],
    imagePath: null
  },
  'yesella-diff': {
    sectionKey: 'yesella-diff',
    title: '한글리시만의 차별성',
    subtitle: '데이터 + 코칭 + 실행관리',
    description: '학습량/정답률 데이터 기반으로 개인별 개선 경로를 제공합니다.',
    items: ['데이터 리포트', '1:1 피드백', '완주관리'],
    imagePath: null
  },
  'education-course': {
    sectionKey: 'education-course',
    title: '교육 과정',
    subtitle: '레벨 맞춤형 교육 트랙',
    description: '입문, 심화, 실전 트랙으로 레벨에 맞춰 학습합니다.',
    items: ['입문 과정', '심화 과정', '실전 과정'],
    imagePath: null
  },
  'program-list': {
    sectionKey: 'program-list',
    title: '프로그램',
    subtitle: '목표별 맞춤 과정',
    description: '학생 목표와 기간에 맞춘 트랙을 운영합니다.',
    items: [],
    imagePath: null
  },
  books: {
    sectionKey: 'books',
    title: '교재구성',
    subtitle: '학습 단계별 전용 교재',
    description: '개념서/유형서/실전서로 구성됩니다.',
    items: ['개념서', '유형서', '실전서'],
    imagePath: null
  },
  notice: {
    sectionKey: 'notice',
    title: '공지사항',
    subtitle: '최신 학원 소식',
    description: '모집 일정, 공지, 이벤트 안내를 확인하세요.',
    items: [],
    imagePath: null
  },
  briefing: {
    sectionKey: 'briefing',
    title: '설명회신청',
    subtitle: '학부모 설명회 신청',
    description: '학습 운영 방식과 진학 로드맵을 안내드립니다.',
    items: [],
    imagePath: null
  },
  'entrance-test': {
    sectionKey: 'entrance-test',
    title: '입학(진단)테스트',
    subtitle: '진단테스트 신청',
    description: '현재 실력을 진단하고 반배치를 안내합니다.',
    items: [],
    imagePath: null
  },
  direction: {
    sectionKey: 'direction',
    title: '오시는 길',
    subtitle: '한글리시 학원 위치 안내',
    description: '서울시 강남구 테헤란로 123, 한글리시빌딩 5층',
    items: [],
    imagePath: null
  }
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

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || '요청 실패');
  return data;
}

function sectionImageUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  return `${API_BASE}${imagePath}`;
}

function SectionImage({ section }) {
  if (!section?.imagePath) return null;
  return <img className="section-image" src={sectionImageUrl(section.imagePath)} alt={section.title} />;
}

function AdminPage() {
  const [consultations, setConsultations] = useState([]);
  const [briefings, setBriefings] = useState([]);
  const [entranceTests, setEntranceTests] = useState([]);
  const [sections, setSections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedKey, setSelectedKey] = useState('');
  const [editor, setEditor] = useState({ title: '', subtitle: '', description: '', itemsText: '' });
  const [editorStatus, setEditorStatus] = useState('');
  const [editorSaving, setEditorSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const totalCount = useMemo(
    () => consultations.length + briefings.length + entranceTests.length,
    [consultations.length, briefings.length, entranceTests.length]
  );

  const selectedSection = useMemo(
    () => sections.find((section) => section.sectionKey === selectedKey) || null,
    [sections, selectedKey]
  );

  const loadAll = async () => {
    setLoading(true);
    setError('');

    try {
      const [consultationData, briefingData, entranceData, sectionData] = await Promise.all([
        requestJson(`${API_BASE}/api/consultations`),
        requestJson(`${API_BASE}/api/briefings`),
        requestJson(`${API_BASE}/api/entrance-tests`),
        requestJson(`${API_BASE}/api/site-sections`)
      ]);

      setConsultations(Array.isArray(consultationData) ? consultationData : []);
      setBriefings(Array.isArray(briefingData) ? briefingData : []);
      setEntranceTests(Array.isArray(entranceData) ? entranceData : []);
      setSections(Array.isArray(sectionData) ? sectionData : []);
    } catch (err) {
      setError(err.message || '신청 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!selectedKey && sections.length > 0) {
      setSelectedKey(sections[0].sectionKey);
    }
  }, [sections, selectedKey]);

  useEffect(() => {
    if (!selectedSection) return;

    setEditor({
      title: selectedSection.title || '',
      subtitle: selectedSection.subtitle || '',
      description: selectedSection.description || '',
      itemsText: Array.isArray(selectedSection.items) ? selectedSection.items.join('\n') : ''
    });
    setEditorStatus('');
  }, [selectedSection?.sectionKey]);

  const saveSection = async (event) => {
    event.preventDefault();

    if (!selectedKey) {
      setEditorStatus('편집할 섹션을 선택해 주세요.');
      return;
    }

    setEditorSaving(true);
    setEditorStatus('저장 중입니다...');

    const payload = {
      title: editor.title.trim(),
      subtitle: editor.subtitle.trim(),
      description: editor.description.trim(),
      items: editor.itemsText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
    };

    try {
      const data = await requestJson(`${API_BASE}/api/site-sections/${selectedKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setSections((prev) => prev.map((item) => (item.sectionKey === selectedKey ? data.section : item)));
      setEditorStatus('저장되었습니다.');
    } catch (err) {
      setEditorStatus(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setEditorSaving(false);
    }
  };

  const uploadSectionImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedKey) return;

    setUploading(true);
    setEditorStatus('이미지 업로드 중입니다...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE}/api/site-sections/${selectedKey}/image`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '이미지 업로드 실패');

      setSections((prev) => prev.map((item) => (item.sectionKey === selectedKey ? data.section : item)));
      setEditorStatus('이미지가 저장되었습니다.');
    } catch (err) {
      setEditorStatus(err.message || '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const clearSectionImage = async () => {
    if (!selectedKey) return;

    setUploading(true);
    setEditorStatus('이미지 삭제 중입니다...');

    try {
      const data = await requestJson(`${API_BASE}/api/site-sections/${selectedKey}/image`, {
        method: 'DELETE'
      });
      setSections((prev) => prev.map((item) => (item.sectionKey === selectedKey ? data.section : item)));
      setEditorStatus('이미지가 삭제되었습니다.');
    } catch (err) {
      setEditorStatus(err.message || '이미지 삭제 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page admin-page">
      <header className="site-header">
        <div className="container header-inner">
          <a href="/" className="logo">한글리시 관리자</a>
          <nav className="nav">
            <a href="/">메인으로</a>
            <button className="btn" type="button" onClick={loadAll}>새로고침</button>
          </nav>
        </div>
      </header>

      <main className="section">
        <div className="container">
          <p className="eyebrow">Admin</p>
          <h1>메뉴/신청 통합 관리</h1>
          <p className="admin-meta">
            총 {totalCount}건 · 상담 {consultations.length}건 · 설명회 {briefings.length}건 · 진단테스트 {entranceTests.length}건
          </p>

          {loading ? <p>불러오는 중...</p> : null}
          {error ? <p className="admin-error">{error}</p> : null}

          {!loading && !error ? (
            <>
              <section className="admin-editor panel-card">
                <h2>메뉴 섹션 편집</h2>
                <div className="admin-editor-grid">
                  <label>
                    편집 섹션
                    <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
                      {sections.map((section) => (
                        <option key={section.sectionKey} value={section.sectionKey}>
                          {section.menuGroup} / {section.menuLabel}
                        </option>
                      ))}
                    </select>
                  </label>

                  <form className="admin-edit-form" onSubmit={saveSection}>
                    <label>
                      제목
                      <input
                        value={editor.title}
                        onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                        required
                      />
                    </label>

                    <label>
                      부제목
                      <input
                        value={editor.subtitle}
                        onChange={(e) => setEditor({ ...editor, subtitle: e.target.value })}
                        required
                      />
                    </label>

                    <label>
                      설명
                      <textarea
                        rows={4}
                        value={editor.description}
                        onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                        required
                      />
                    </label>

                    <label>
                      항목 목록 (줄바꿈 구분)
                      <textarea
                        rows={4}
                        value={editor.itemsText}
                        onChange={(e) => setEditor({ ...editor, itemsText: e.target.value })}
                      />
                    </label>

                    <div className="admin-edit-actions">
                      <button className="btn" type="submit" disabled={editorSaving}>
                        {editorSaving ? '저장 중...' : '텍스트 저장'}
                      </button>

                      <label className="upload-btn" htmlFor="section-image-upload">
                        {uploading ? '업로드 중...' : '사진 업로드'}
                      </label>
                      <input
                        id="section-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={uploadSectionImage}
                        disabled={uploading}
                        hidden
                      />
                      <button className="upload-btn" type="button" onClick={clearSectionImage} disabled={uploading}>
                        이미지 삭제
                      </button>
                    </div>

                    <p className="form-message">{editorStatus}</p>
                  </form>

                  <div className="section-preview">
                    <h3>현재 이미지</h3>
                    {selectedSection?.imagePath ? (
                      <img src={sectionImageUrl(selectedSection.imagePath)} alt={selectedSection.title} />
                    ) : (
                      <p>등록된 이미지가 없습니다.</p>
                    )}
                  </div>
                </div>
              </section>

              <div className="admin-section-stack">
                <section className="admin-block">
                  <h2>상담 신청</h2>
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
                        {consultations.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="admin-empty">신청 데이터가 없습니다.</td>
                          </tr>
                        ) : (
                          consultations.map((item) => (
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
                </section>

                <section className="admin-block">
                  <h2>설명회 신청</h2>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>학부모</th>
                          <th>학생</th>
                          <th>연락처</th>
                          <th>학년</th>
                          <th>신청일시</th>
                        </tr>
                      </thead>
                      <tbody>
                        {briefings.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="admin-empty">신청 데이터가 없습니다.</td>
                          </tr>
                        ) : (
                          briefings.map((item) => (
                            <tr key={item.id}>
                              <td>{item.id}</td>
                              <td>{item.parentName}</td>
                              <td>{item.studentName}</td>
                              <td>{item.phone}</td>
                              <td>{item.grade}</td>
                              <td>{formatDate(item.createdAt)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="admin-block">
                  <h2>입학(진단)테스트 신청</h2>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>학생</th>
                          <th>연락처</th>
                          <th>학년</th>
                          <th>희망 날짜</th>
                          <th>신청일시</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entranceTests.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="admin-empty">신청 데이터가 없습니다.</td>
                          </tr>
                        ) : (
                          entranceTests.map((item) => (
                            <tr key={item.id}>
                              <td>{item.id}</td>
                              <td>{item.name}</td>
                              <td>{item.phone}</td>
                              <td>{item.grade}</td>
                              <td>{item.preferredDate ? String(item.preferredDate).slice(0, 10) : '-'}</td>
                              <td>{formatDate(item.createdAt)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function LandingPage() {
  const [content, setContent] = useState(null);
  const [sections, setSections] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [briefingForm, setBriefingForm] = useState(initialBriefingForm);
  const [briefingStatus, setBriefingStatus] = useState('');
  const [briefingSubmitting, setBriefingSubmitting] = useState(false);

  const [testForm, setTestForm] = useState(initialTestForm);
  const [testStatus, setTestStatus] = useState('');
  const [testSubmitting, setTestSubmitting] = useState(false);

  const sectionMap = useMemo(
    () => Object.fromEntries(sections.map((section) => [section.sectionKey, section])),
    [sections]
  );

  const sectionOf = (key) => sectionMap[key] || fallbackSections[key];

  useEffect(() => {
    fetch(`${API_BASE}/api/site-content`)
      .then((res) => res.json())
      .then((data) => setContent(data))
      .catch(() => {
        setContent({
          brand: '한글리시',
          headline: '합격과 점수 상승을 만드는 스터디 운영 시스템',
          stats: []
        });
      });

    fetch(`${API_BASE}/api/site-sections`)
      .then((res) => res.json())
      .then((data) => setSections(Array.isArray(data) ? data : []))
      .catch(() => setSections([]));
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
      await requestJson(`${API_BASE}/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      setStatus(`${form.name}님, 상담 신청이 접수되었습니다.`);
      setForm(initialForm);
    } catch (error) {
      setStatus(error.message || '요청 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBriefingSubmit = async (event) => {
    event.preventDefault();

    if (!briefingForm.parentName || !briefingForm.studentName || !briefingForm.phone || !briefingForm.grade) {
      setBriefingStatus('필수 항목을 모두 입력해 주세요.');
      return;
    }

    setBriefingSubmitting(true);
    setBriefingStatus('신청 접수 중입니다...');

    try {
      await requestJson(`${API_BASE}/api/briefings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(briefingForm)
      });

      setBriefingStatus(`${briefingForm.parentName}님 설명회 신청이 접수되었습니다.`);
      setBriefingForm(initialBriefingForm);
    } catch (error) {
      setBriefingStatus(error.message || '요청 중 오류가 발생했습니다.');
    } finally {
      setBriefingSubmitting(false);
    }
  };

  const handleTestSubmit = async (event) => {
    event.preventDefault();

    if (!testForm.name || !testForm.phone || !testForm.grade || !testForm.preferredDate) {
      setTestStatus('필수 항목을 모두 입력해 주세요.');
      return;
    }

    setTestSubmitting(true);
    setTestStatus('신청 접수 중입니다...');

    try {
      await requestJson(`${API_BASE}/api/entrance-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testForm)
      });

      setTestStatus(`${testForm.name}님 진단테스트 신청이 접수되었습니다.`);
      setTestForm(initialTestForm);
    } catch (error) {
      setTestStatus(error.message || '요청 중 오류가 발생했습니다.');
    } finally {
      setTestSubmitting(false);
    }
  };

  const meaning = sectionOf('yesella-meaning');
  const goal = sectionOf('yesella-goal');
  const diff = sectionOf('yesella-diff');
  const education = sectionOf('education-course');
  const program = sectionOf('program-list');
  const books = sectionOf('books');
  const notice = sectionOf('notice');
  const briefing = sectionOf('briefing');
  const entrance = sectionOf('entrance-test');
  const direction = sectionOf('direction');

  return (
    <div className="page">
      <header className="site-header">
        <div className="container header-inner">
          <a href="#top" className="logo">{content?.brand || '한글리시'}</a>
          <nav className="main-nav" style={{ whiteSpace: 'nowrap' }}>
            <h2 className="blind">메인 네비게이션</h2>

            <ul id="bigmenu_010">
              <li>
                <a id="sub_header1_Rpt_Big_Hl_title_0" href="#yesella-meaning">한글리시</a>
                <ul className="menu_list" style={{ display: 'none' }}>
                  <li><a id="sub_header1_Rpt_Big_Rpt_Sub_0_Hl_Subtitle_0" href="#yesella-meaning" style={{ cursor: 'pointer' }}>한글리시 의미</a></li>
                  <li><a id="sub_header1_Rpt_Big_Rpt_Sub_0_Hl_Subtitle_1" href="#yesella-goal" style={{ cursor: 'pointer' }}>한글리시 학습목표</a></li>
                  <li><a id="sub_header1_Rpt_Big_Rpt_Sub_0_Hl_Subtitle_2" href="#yesella-diff" style={{ cursor: 'pointer' }}>한글리시만의 차별성</a></li>
                </ul>
              </li>
            </ul>

            <ul id="bigmenu_020">
              <li>
                <a id="sub_header1_Rpt_Big_Hl_title_1" href="#education-course">학습 안내</a>
                <ul className="menu_list" style={{ display: 'none' }}>
                  <li><a id="sub_header1_Rpt_Big_Rpt_Sub_1_Hl_Subtitle_0" href="#education-course" style={{ cursor: 'pointer' }}>교육 과정</a></li>
                  <li><a id="sub_header1_Rpt_Big_Rpt_Sub_1_Hl_Subtitle_1" href="#program-list" style={{ cursor: 'pointer' }}>프로그램</a></li>
                  <li><a id="sub_header1_Rpt_Big_Rpt_Sub_1_Hl_Subtitle_2" href="#books" style={{ cursor: 'pointer' }}>교재구성</a></li>
                </ul>
              </li>
            </ul>

            <ul id="bigmenu_030">
              <li>
                <a id="sub_header1_Rpt_Big_Hl_title_2" href="#notice">학원 안내</a>
                <ul className="menu_list" style={{ display: 'none' }}>
                  <li><a id="sub_header1_Rpt_Big_Rpt_Sub_2_Hl_Subtitle_0" href="#notice" style={{ cursor: 'pointer' }}>공지사항</a></li>
                  <li><a id="sub_header1_Rpt_Big_Rpt_Sub_2_Hl_Subtitle_1" href="#briefing" style={{ cursor: 'pointer' }}>설명회신청</a></li>
                  <li><a id="sub_header1_Rpt_Big_Rpt_Sub_2_Hl_Subtitle_2" href="#entrance-test" style={{ cursor: 'pointer' }}>입학(진단)테스트</a></li>
                  <li><a id="sub_header1_Rpt_Big_Rpt_Sub_2_Hl_Subtitle_3" href="#direction" style={{ cursor: 'pointer' }}>오시는 길</a></li>
                </ul>
              </li>
            </ul>

            <a className="admin-link" href="/admin">관리자</a>
            <button type="button" className="btn_close" style={{ display: 'none' }}>닫기</button>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero section" id="yesella-meaning">
          <div className="container hero-grid">
            <div>
              <p className="eyebrow">{meaning.title}</p>
              <h1>{meaning.subtitle || content?.headline || '합격과 점수 상승을 만드는 스터디 운영 시스템'}</h1>
              <p>{meaning.description}</p>
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
          <div className="container">
            <SectionImage section={meaning} />
          </div>
        </section>

        <section className="section" id="yesella-goal">
          <div className="container">
            <p className="eyebrow">{goal.title}</p>
            <h2>{goal.subtitle}</h2>
            <p className="section-desc">{goal.description}</p>
            <div className="info-grid">
              {(goal.items || []).map((item, idx) => (
                <article className="info-card" key={item}>
                  <h3>{idx + 1}. {item}</h3>
                </article>
              ))}
            </div>
            <SectionImage section={goal} />
          </div>
        </section>

        <section className="section" id="yesella-diff">
          <div className="container">
            <p className="eyebrow">{diff.title}</p>
            <h2>{diff.subtitle}</h2>
            <p className="section-desc">{diff.description}</p>
            <div className="info-grid">
              {(diff.items || []).map((item) => (
                <article className="info-card" key={item}><h3>{item}</h3></article>
              ))}
            </div>
            <SectionImage section={diff} />
          </div>
        </section>

        <section className="section" id="education-course">
          <div className="container">
            <p className="eyebrow">{education.title}</p>
            <h2>{education.subtitle}</h2>
            <p className="section-desc">{education.description}</p>
            <div className="info-grid">
              {(education.items || []).map((item) => (
                <article className="info-card" key={item}><h3>{item}</h3></article>
              ))}
            </div>
            <SectionImage section={education} />
          </div>
        </section>

        <section className="section" id="program-list">
          <div className="container">
            <p className="eyebrow">{program.title}</p>
            <h2>{program.subtitle}</h2>
            <p className="section-desc">{program.description}</p>
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
            <SectionImage section={program} />
          </div>
        </section>

        <section className="section" id="books">
          <div className="container">
            <p className="eyebrow">{books.title}</p>
            <h2>{books.subtitle}</h2>
            <p className="section-desc">{books.description}</p>
            <div className="info-grid">
              {(books.items || []).map((item) => (
                <article className="info-card" key={item}><h3>{item}</h3></article>
              ))}
            </div>
            <SectionImage section={books} />
          </div>
        </section>

        <section className="section" id="notice">
          <div className="container">
            <p className="eyebrow">{notice.title}</p>
            <h2>{notice.subtitle}</h2>
            <p className="section-desc">{notice.description}</p>
            <ul className="notice-list">
              <li><strong>[공지]</strong> 3월 정규반 모집이 시작되었습니다. (마감: 3/15)</li>
              <li><strong>[안내]</strong> 3/9(토) 학부모 설명회가 진행됩니다.</li>
              <li><strong>[안내]</strong> 입학(진단)테스트는 매주 수/토 운영됩니다.</li>
            </ul>
            <SectionImage section={notice} />
          </div>
        </section>

        <section className="section" id="briefing">
          <div className="container split-grid">
            <div>
              <p className="eyebrow">{briefing.title}</p>
              <h2>{briefing.subtitle}</h2>
              <p>{briefing.description}</p>
              <SectionImage section={briefing} />
            </div>
            <form className="apply-form panel" onSubmit={handleBriefingSubmit}>
              <label>
                학부모 성함
                <input
                  value={briefingForm.parentName}
                  onChange={(e) => setBriefingForm({ ...briefingForm, parentName: e.target.value })}
                  required
                />
              </label>
              <label>
                학생 이름
                <input
                  value={briefingForm.studentName}
                  onChange={(e) => setBriefingForm({ ...briefingForm, studentName: e.target.value })}
                  required
                />
              </label>
              <label>
                연락처
                <input
                  value={briefingForm.phone}
                  onChange={(e) => setBriefingForm({ ...briefingForm, phone: e.target.value })}
                  required
                />
              </label>
              <label>
                학생 학년
                <input
                  value={briefingForm.grade}
                  onChange={(e) => setBriefingForm({ ...briefingForm, grade: e.target.value })}
                  required
                />
              </label>
              <button className="btn" type="submit" disabled={briefingSubmitting}>
                {briefingSubmitting ? '접수 중...' : '설명회 신청하기'}
              </button>
              <p className="form-message">{briefingStatus}</p>
            </form>
          </div>
        </section>

        <section className="section" id="entrance-test">
          <div className="container split-grid">
            <div>
              <p className="eyebrow">{entrance.title}</p>
              <h2>{entrance.subtitle}</h2>
              <p>{entrance.description}</p>
              <SectionImage section={entrance} />
            </div>
            <form className="apply-form panel" onSubmit={handleTestSubmit}>
              <label>
                학생 이름
                <input
                  value={testForm.name}
                  onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                  required
                />
              </label>
              <label>
                연락처
                <input
                  value={testForm.phone}
                  onChange={(e) => setTestForm({ ...testForm, phone: e.target.value })}
                  required
                />
              </label>
              <label>
                학생 학년
                <input
                  value={testForm.grade}
                  onChange={(e) => setTestForm({ ...testForm, grade: e.target.value })}
                  required
                />
              </label>
              <label>
                희망 날짜
                <input
                  type="date"
                  value={testForm.preferredDate}
                  onChange={(e) => setTestForm({ ...testForm, preferredDate: e.target.value })}
                  required
                />
              </label>
              <button className="btn" type="submit" disabled={testSubmitting}>
                {testSubmitting ? '접수 중...' : '진단테스트 신청하기'}
              </button>
              <p className="form-message">{testStatus}</p>
            </form>
          </div>
        </section>

        <section className="section" id="direction">
          <div className="container">
            <p className="eyebrow">{direction.title}</p>
            <h2>{direction.subtitle}</h2>
            <div className="map-box">
              <p><strong>안내</strong> {direction.description}</p>
              <p><strong>지하철</strong> 2호선 강남역 3번 출구 도보 5분</p>
              <p><strong>전화</strong> 02-123-4567</p>
            </div>
            <SectionImage section={direction} />
          </div>
        </section>

        <section className="section apply" id="apply">
          <div className="container apply-grid">
            <div>
              <p className="eyebrow">상담신청</p>
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
