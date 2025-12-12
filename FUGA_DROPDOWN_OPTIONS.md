# 🎵 FUGA SCORE "About The Music" 드롭다운 항목 전체 목록

## 📋 Main Genre * (총 22개)

```
1. African Music
2. Alternative
3. Asian Music
4. Blues
5. Classical
6. Country
7. Dance
8. Electronic
9. Folk
10. Hip Hop/Rap
11. Inspirational
12. Jazz
13. Kids Music
14. Latin
15. New Age
16. Pop
17. R&B/Soul
18. Reggae
19. Rock
20. Singer/Songwriter
21. Soundtrack
22. Spoken Word
```

---

## 🎭 Mood(s) * (총 18개)

**제한**: 최대 3개까지 선택 가능

```
1. Chill
2. Cooking
3. Energetic
4. Feel Good
5. Fierce
6. Fitness
7. Focus
8. Happy
9. Meditative
10. Motivation
11. Party
12. Romantic
13. Sad
14. Sexy
15. Sleep
16. Throwback
17. Feeling Blue
18. Heartbreak
```

---

## 🎸 Instruments * (총 45개)

```
1. Accordion
2. Acoustic Guitar
3. Banjo
4. Bass Clarinet
5. Bass Guitar
6. Bassoon
7. Buzuq
8. Cello
9. Cembalo
10. Clarinet
11. Classical Guitar
12. Djembe
13. Double Bass
14. Drum Kit
15. Electric Guitar
16. Erhu
17. Flute
18. French Horn
19. Harmonica
20. Harp
21. Horn
22. Mandolin
23. Marimba
24. Oboe
25. Orchestra
26. Organ
27. Oud
28. Pedal Steel Guitar
29. Piano
30. Piccolo
31. Recorder
32. Samples
33. Saxophone
34. Sitar
35. Steel Drum
36. Synthesizer
37. Trombone
38. Trumpet
39. Vibraphone
40. Viola
41. Violin
42. Vocals
43. Xylophone
44. Harpsichord
45. Ukelele
```

---

## 📊 통계 요약

| 필드 | 항목 수 | 선택 제한 | 필수 여부 |
|------|---------|-----------|-----------|
| Main Genre | 22개 | 1개 | ✅ 필수 |
| Mood(s) | 18개 | 최대 3개 | ✅ 필수 |
| Instruments | 45개 | 다중 선택 | ✅ 필수 |

---

## 💡 N3RVE 플랫폼 적용 시사점

### 현재 N3RVE에 있는 항목과 비교

**Genre (N3RVE)**:
- Primary Genre
- Secondary Genre
- Subgenres

**FUGA 추가 필요**:
- ➕ Moods (18개 옵션)
- ➕ Instruments (45개 옵션)

### 데이터 매핑

```typescript
// N3RVE → FUGA SCORE
{
  mainGenre: submission.primaryGenre,  // Main Genre 매핑
  moods: [],  // 새로 수집 필요 (최대 3개)
  instruments: []  // 새로 수집 필요 (다중 선택)
}
```

---

## 🎯 사용자 경험 개선 포인트

### FUGA의 강점
1. **명확한 카테고리**: Main Genre 22개로 간소화
2. **감성 표현**: Moods로 음악 분위기 표현
3. **악기 상세**: 45개 악기로 정확한 설명

### N3RVE 개선 방향
1. **Moods 필드 추가**: 마케팅에 필수적
2. **Instruments 필드 추가**: DSP 피칭에 중요
3. **선택 제한**: Moods는 최대 3개로 제한

---

## 🔗 관련 필드

### About The Music 페이지 전체 필드

**필수 필드**:
1. 🎧 Private Listening Link * (최대 125자)
2. Main Genre * (22개 중 선택)
3. Soundtrack/Score? * (Yes/No)
4. Mood(s) * (최대 3개 선택)
5. Instruments * (다중 선택)
6. YouTube Shorts Previews? * (Yes/No)
7. 📌 "This Is" Playlist * (Yes/No)
8. Dolby Atmos Spatial Audio * (Yes/No)
9. Motion Artwork * (Yes/No)

**선택 필드**:
- Fact Sheets / Project Deck (URL)

---

## 📝 JSON 데이터 구조 (참고용)

```json
{
  "mainGenres": [
    "African Music", "Alternative", "Asian Music", "Blues",
    "Classical", "Country", "Dance", "Electronic", "Folk",
    "Hip Hop/Rap", "Inspirational", "Jazz", "Kids Music",
    "Latin", "New Age", "Pop", "R&B/Soul", "Reggae",
    "Rock", "Singer/Songwriter", "Soundtrack", "Spoken Word"
  ],

  "moods": [
    "Chill", "Cooking", "Energetic", "Feel Good", "Fierce",
    "Fitness", "Focus", "Happy", "Meditative", "Motivation",
    "Party", "Romantic", "Sad", "Sexy", "Sleep",
    "Throwback", "Feeling Blue", "Heartbreak"
  ],

  "instruments": [
    "Accordion", "Acoustic Guitar", "Banjo", "Bass Clarinet",
    "Bass Guitar", "Bassoon", "Buzuq", "Cello", "Cembalo",
    "Clarinet", "Classical Guitar", "Djembe", "Double Bass",
    "Drum Kit", "Electric Guitar", "Erhu", "Flute",
    "French Horn", "Harmonica", "Harp", "Horn", "Mandolin",
    "Marimba", "Oboe", "Orchestra", "Organ", "Oud",
    "Pedal Steel Guitar", "Piano", "Piccolo", "Recorder",
    "Samples", "Saxophone", "Sitar", "Steel Drum",
    "Synthesizer", "Trombone", "Trumpet", "Vibraphone",
    "Viola", "Violin", "Vocals", "Xylophone", "Harpsichord",
    "Ukelele"
  ]
}
```

---

**작성일**: 2024-12-11
**페이지**: FUGA SCORE - About The Music
**총 항목**: 85개 (Genre: 22, Moods: 18, Instruments: 45)
**문서**: FUGA_DROPDOWN_OPTIONS.md
