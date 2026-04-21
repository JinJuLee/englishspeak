# 영어 스피킹 연습 워크플로우 (오픽 / 토플 / 인터뷰)

> Apple Music과 분리된, iCloud 기반 로컬 mp3 + 스크립트 학습 시스템

---

## 🎯 목표

- 오픽, 토플 스피킹, 인터뷰 답변을 문장 단위로 반복 청취·섀도잉
- Apple Music 라이브러리와 완전히 분리된 환경
- iCloud Drive에 mp3·스크립트를 보관해 모든 Apple 기기에서 접근
- 자연스러운 AI TTS + 직관적인 UI

---

## 🛠 필요한 앱 (단 2개)

| 앱 | 역할 | 비용 |
|---|---|---|
| **Aiko** | mp3 → .srt 자막 자동 변환 (Whisper 기반, 로컬 실행) | 무료 |
| **AudioLingo** (구 WorkAudioBook) | mp3 + .srt 재생, 문장 반복(AB 루프), 자막 싱크 | 무료/유료 기능 |

> ElevenLabs는 웹에서 그대로 사용 (TTS 음원 생성용). 추가 설치 불필요.

---

## 📂 폴더 구조 예시 (iCloud Drive)

```
iCloud Drive/
└── English_Practice/
    ├── OPIc/
    │   ├── opic_q3.mp3
    │   └── opic_q3.srt
    ├── TOEFL/
    │   ├── lecture1.mp3
    │   └── lecture1.srt
    └── Interview/
        ├── tell_me_about_yourself.mp3
        └── tell_me_about_yourself.srt
```

**핵심 규칙:** mp3와 .srt 파일명은 **반드시 동일**해야 AudioLingo가 자동으로 매칭함.

---

## 🔁 워크플로우

### 케이스 A. 토플 교재 mp3 (이미 음원이 있는 경우)

1. 교재에서 받은 mp3를 iCloud Drive `TOEFL` 폴더에 저장
2. **Aiko** 실행 → mp3 import → "Generate" 클릭
3. 자동 받아쓰기 완료 후 `.srt` 형식으로 export → 같은 폴더에 저장
4. **AudioLingo** → import → iCloud Drive → 해당 폴더 선택
5. 자막이 화면에 뜨고, 문장 탭하면 무한 반복 재생

> 💡 책 스크립트를 직접 타이핑할 필요 없음. Whisper 정확도가 매우 높아 가끔 틀린 단어만 .srt 열어서 수정.

---

### 케이스 B. 직접 쓴 스크립트 (오픽 답변, 인터뷰 답변 등)

1. 스크립트 작성
2. **ElevenLabs**에 붙여넣고 mp3 다운로드 → iCloud `English_Practice` 폴더에 저장
3. 자막 만들기 (둘 중 택 1):
   - **간단:** 같은 이름 `.txt` 파일에 스크립트 붙여넣기 (싱크 정확도 낮음)
   - **정확:** 그 mp3를 **Aiko**에 다시 돌려서 `.srt` 추출 (타임코드 정확)
4. **AudioLingo**에서 import → 끝

---

## ⚙️ AudioLingo 주요 기능

- 자동 문장 분할 (수동 편집 불필요)
- 문장 단위 무한 반복 (AB 루프)
- 파형(waveform) 시각화로 정확한 구간 선택
- SRT/VTT 자막 자동 싱크
- 전부 로컬 저장 (계정 불필요, Apple Music과 완전 분리)
- 지원 포맷: MP3, M4A, WAV 등

---

## ✅ 한 번 세팅 후 일상 루틴

**일상 5분 루틴:**

스크립트 작성 → ElevenLabs (TTS) → Aiko (.srt 추출) → AudioLingo (반복 청취·섀도잉)

**토플 교재 mp3:**

mp3 → Aiko → AudioLingo

---

## 💡 참고 팁

- iCloud Drive에 보관 → 아이폰·아이패드·맥 어디서나 동일 자료 접근
- Apple Music 셔플에 영어 음원이 끼는 사고 방지
- AirPods 자동 전환(Automatic Switching)을 끄면 기기 간 재생 꼬임 방지
- 발음 교정까지 원하면 보조로 **ELSA Speak** 추가 사용 권장

---

## 🚫 추천하지 않는 조합

- **Anytune Pro** — Apple Music 라이브러리에 종속, UI 답답
- **VLC / Documents (Readdle)** — 단순 재생만 가능, 학습 기능 없음
- **Apple Music 통합 학습 앱** — 음원이 음악 라이브러리와 섞임
