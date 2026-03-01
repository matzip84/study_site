USE study_site;

INSERT INTO consultations (name, phone, goal, available_time)
VALUES
  ('김민수', '010-1111-2222', '8주 내 목표 점수 85점 달성', '평일 저녁'),
  ('이서연', '010-3333-4444', '기초 문법 완성과 학습 습관 만들기', '평일 오전'),
  ('박지훈', '010-5555-6666', '3개월 내 자격증 합격', '주말');

INSERT INTO briefing_applications (parent_name, student_name, phone, grade)
VALUES
  ('김영희', '김하늘', '010-2345-6789', '중2'),
  ('이민정', '이준서', '010-8765-4321', '고1');

INSERT INTO entrance_tests (name, phone, grade, preferred_date)
VALUES
  ('최유진', '010-1234-5678', '중3', '2026-03-10'),
  ('한지우', '010-4567-1234', '고2', '2026-03-12');

INSERT INTO site_sections (section_key, menu_group, menu_label, title, subtitle, description, items_json, image_path)
VALUES
  ('yesella-meaning', '예설라', '예설라 의미', '예설라 의미', '합격과 점수 상승을 만드는 스터디 운영 시스템', '예설라는 예측 가능한 학습 설계와 실행력으로 학생의 성장을 만드는 학습 브랜드입니다.', JSON_ARRAY(), NULL),
  ('yesella-goal', '예설라', '예설라 학습목표', '예설라 학습목표', '측정 가능한 성과 중심 학습', '주간 루틴 정착, 실전 점수 향상, 최종 합격까지 관리합니다.', JSON_ARRAY('학습 습관 정착', '실전 점수 향상', '최종 합격 완성'), NULL),
  ('yesella-diff', '예설라', '예설라만의 차별성', '예설라만의 차별성', '데이터 + 코칭 + 실행관리', '학습량/정답률 데이터 기반으로 개인별 개선 경로를 제공합니다.', JSON_ARRAY('데이터 리포트', '1:1 피드백', '완주관리'), NULL),
  ('education-course', '학습 안내', '교육 과정', '교육 과정', '레벨 맞춤형 교육 트랙', '입문, 심화, 실전 트랙으로 레벨에 맞춰 학습합니다.', JSON_ARRAY('입문 과정', '심화 과정', '실전 과정'), NULL),
  ('program-list', '학습 안내', '프로그램', '프로그램', '목표별 맞춤 과정', '학생 목표와 기간에 맞춘 트랙을 운영합니다.', JSON_ARRAY(), NULL),
  ('books', '학습 안내', '교재구성', '교재구성', '학습 단계별 전용 교재', '개념서/유형서/실전서로 구성됩니다.', JSON_ARRAY('개념서', '유형서', '실전서'), NULL),
  ('notice', '학원 안내', '공지사항', '공지사항', '최신 학원 소식', '모집 일정, 공지, 이벤트 안내를 확인하세요.', JSON_ARRAY(), NULL),
  ('briefing', '학원 안내', '설명회신청', '설명회신청', '학부모 설명회 신청', '학습 운영 방식과 진학 로드맵을 안내드립니다.', JSON_ARRAY(), NULL),
  ('entrance-test', '학원 안내', '입학(진단)테스트', '입학(진단)테스트', '진단테스트 신청', '현재 실력을 진단하고 반배치를 안내합니다.', JSON_ARRAY(), NULL),
  ('direction', '학원 안내', '오시는 길', '오시는 길', '예설라 학원 위치 안내', '서울시 강남구 테헤란로 123, 예설라빌딩 5층', JSON_ARRAY(), NULL)
ON DUPLICATE KEY UPDATE section_key = section_key;
