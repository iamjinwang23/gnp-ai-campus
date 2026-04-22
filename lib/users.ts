export interface User {
  name: string
  email: string
  company: string
}

const USERS: (User & { password: string })[] = [
  { name: '정정희',  email: 'jjhy123@g-insu.com',       company: '지앤파트너', password: '1234' },
  { name: '공봉환',  email: 'bongwhan@g-insu.com',      company: '지앤파트너', password: '1234' },
  { name: '박예진',  email: 'yjpark@g-insu.com',        company: '지앤파트너', password: '1234' },
  { name: '박현주',  email: 'hjpark@g-insu.com',        company: '지앤파트너', password: '1234' },
  { name: '이수연',  email: 'sy0126@g-insu.com',        company: '지앤파트너', password: '1234' },
  { name: '김단하',  email: 'godan@g-insu.com',         company: '비누컴퍼니', password: '1234' },
  { name: '나서연',  email: 'delight123@g-insu.com',    company: '비누컴퍼니', password: '1234' },
  { name: '이순정',  email: 'na5892@g-insu.com',        company: '지앤파트너', password: '1234' },
  { name: '정종석',  email: 'dev@g-insu.com',           company: '지앤파트너', password: '1234' },
  { name: '권정민',  email: 'kknd5942@g-insu.com',      company: '지앤파트너', password: '1234' },
  { name: '이혁',    email: 'leehyuk@g-insu.com',       company: '지앤파트너', password: '1234' },
  { name: '최동규',  email: 'dongyu89@g-insu.com',      company: '지앤파트너', password: '1234' },
  { name: '고봉근',  email: 'kowolf69@g-insu.com',      company: '지앤파트너', password: '1234' },
  { name: '김현민',  email: 'k900317@g-insu.com',       company: '지앤파트너', password: '1234' },
  { name: '나혜원',  email: 'hyeawon0715@g-insu.com',   company: '지앤파트너', password: '1234' },
  { name: '박이슬',  email: 'seul7212@g-insu.com',      company: '지앤파트너', password: '1234' },
  { name: '장훈',    email: 'devotion96@hanmail.net',   company: '지앤파트너', password: '1234' },
  { name: '조제이',  email: 'jjo8247@naver.com',        company: '지앤파트너', password: '1234' },
  { name: '허수빈',  email: 'rsb0428@g-insu.com',       company: '지앤파트너', password: '1234' },
  { name: '박시내',  email: 'snpark@g-insu.com',        company: '지앤파트너', password: '1234' },
  { name: '강윤정',  email: 'kyj12@g-insu.com',         company: '지앤파트너', password: '1234' },
  { name: '구교은',  email: 'gyoeun0401@g-insu.com',    company: '지앤파트너', password: '1234' },
  { name: '김동석',  email: 'ds7588@g-insu.com',        company: '지앤파트너', password: '1234' },
  { name: '박겸빈',  email: 'tcg241202@g-insu.com',     company: '지앤파트너', password: '1234' },
  { name: '박단비',  email: 'dhdudal777@nate.com',      company: '지앤파트너', password: '1234' },
  { name: '유성훈',  email: 'lewsh0310@naver.com',      company: '지앤파트너', password: '1234' },
  { name: '이승희',  email: 'zxcv45zxcv@g-insu.com',   company: '지앤파트너', password: '1234' },
  { name: '이현은',  email: 'global251213@g-insu.com',  company: '지앤파트너', password: '1234' },
  { name: '장혜원',  email: 'janghw7017@gmail.com',     company: '지앤파트너', password: '1234' },
  { name: '전세웅',  email: 'wjstpdnd1392@naver.com',   company: '지앤파트너', password: '1234' },
  { name: '최은정',  email: 'choiej@g-insu.com',        company: '지앤파트너', password: '1234' },
  { name: '김정연',  email: 'redfox218@nate.com',       company: '지앤파트너', password: '1234' },
  { name: '박진왕',  email: 'jinwang@g-insu.com',       company: '비누컴퍼니', password: '1234' },
]

export function findUser(email: string, password: string): User | null {
  const u = USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  )
  if (!u) return null
  return { name: u.name, email: u.email, company: u.company }
}
