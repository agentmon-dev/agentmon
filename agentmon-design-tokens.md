# agentmon 디자인 토큰 — 전체 테마 팔레트

> shadcn/ui + next-themes 기반. `data-theme` 속성으로 전환.

---

## 1. 테마 개요

| 테마 | 브랜드 | Primary 컬러 | 톤 | 상태 |
|------|--------|-------------|-----|------|
| `light` | 뉴트럴 | Zinc | 쿨 뉴트럴 | MVP |
| `dark` | 뉴트럴 | Zinc | 쿨 뉴트럴 | MVP |
| `claude-light` | Anthropic Claude | Terracotta `#C35A28` | 웜 | MVP |
| `claude-dark` | Anthropic Claude | Terracotta Light `#D4764A` | 웜 | MVP |
| `codex-light` | OpenAI Codex | ChatGPT Green `#00A67E` | 쿨 그린 | MVP |
| `codex-dark` | OpenAI Codex | ChatGPT Green Light `#34D399` | 쿨 그린 | MVP |
| `gemini-light` | Google Gemini | Google Blue `#4285F4` | 쿨 블루 | MVP |
| `gemini-dark` | Google Gemini | Gemini Blue Light `#669DF6` | 쿨 블루 | MVP |

---

## 2. Claude 브랜드 컬러

### 코어 컬러

| 이름 | Hex | 용도 |
|------|-----|------|
| Terracotta (Primary) | `#C35A28` | 액센트, CTA, 브랜드 포인트 |
| Terracotta Light | `#D4764A` | 다크 모드 primary |
| Cream | `#FAF6EF` | 라이트 모드 배경 |
| Dark Cream | `#F8EED2` | 서피스, 카드 배경 |
| Chocolate | `#3B110C` | 깊은 강조 |
| Cocoa | `#5D3D3A` | 보조 텍스트 |
| Cinnamon | `#8B372B` | Primary dark variant |
| Sunset Orange | `#DD5013` | Destructive |
| Coffee | `#A05F1A` | Warning 보조 |
| Lavender | `#BDB7FC` | Focus 인디케이터 |
| Goose Down | `#F5F0E6` | 미묘한 배경 변형 |

### 특징
- 전부 웜 톤 — 차가운 블루/퍼플 사용 금지
- 그레이 대신 웜 그레이 (갈색 가미)
- 다크 모드도 웜 블랙 `#1A1410`, 순수 블랙 사용 금지
- 헤딩에 세리프 폰트: `ui-serif, Georgia, Cambria, "Times New Roman", serif`

---

## 3. Codex (OpenAI) 브랜드 컬러

### 코어 컬러

| 이름 | Hex | 용도 |
|------|-----|------|
| ChatGPT Green (Primary) | `#00A67E` | 액센트, CTA |
| ChatGPT Green Light | `#34D399` | 다크 모드 primary |
| Cod Gray | `#080808` | OpenAI 브랜드 블랙 |
| Sea Nymph | `#74AA9C` | 보조 액센트 |
| Mint | `#E6F7F2` | 라이트 서피스 |
| Dark Green | `#065F46` | 강조 텍스트 |
| Purple Accent | `#AB68FF` | 보조 포인트 |

### 특징
- 미니멀 모노크롬 + 그린 액센트
- OpenAI 브랜드 기본은 블랙+화이트, ChatGPT 그린이 시그니처
- 쿨 톤 뉴트럴, 순수 gray 사용 가능
- 산세리프 통일 (OpenAI Sans 스타일)

---

## 4. Gemini (Google) 브랜드 컬러

### 코어 컬러

| 이름 | Hex | 용도 |
|------|-----|------|
| Google Blue (Primary) | `#4285F4` | 액센트, CTA |
| Google Blue Light | `#669DF6` | 다크 모드 primary |
| Google Red | `#EA4335` | Destructive |
| Google Green | `#34A853` | Success |
| Google Yellow | `#FBBC05` | Warning |
| Gemini Blue Deep | `#1A73E8` | 링크, 강조 |
| Gemini Surface | `#F0F4FF` | 라이트 서피스 (블루 틴트) |

### 특징
- Google 4색 팔레트 기반, 블루가 주도
- 깔끔한 머티리얼 디자인 느낌
- 쿨 톤 뉴트럴
- 산세리프 통일 (Google Sans / Product Sans 스타일)

---

## 5. globals.css — 전체 테마

```css
@layer base {
  /* ========================================
     기본 라이트
     ======================================== */
  :root, [data-theme="light"] {
    --background: 0 0% 100%;
    --foreground: 240 10% 4%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 4%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 4%;
    --primary: 240 6% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 5% 96%;
    --secondary-foreground: 240 6% 10%;
    --muted: 240 5% 96%;
    --muted-foreground: 240 4% 46%;
    --accent: 240 5% 96%;
    --accent-foreground: 240 6% 10%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 6% 90%;
    --input: 240 6% 90%;
    --ring: 240 6% 10%;
    --radius: 0.625rem;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }

  /* ========================================
     기본 다크
     ======================================== */
  [data-theme="dark"] {
    --background: 240 10% 4%;
    --foreground: 0 0% 98%;
    --card: 240 10% 6%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 6%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 6% 10%;
    --secondary: 240 4% 16%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 4% 16%;
    --muted-foreground: 240 5% 65%;
    --accent: 240 4% 16%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 4% 16%;
    --input: 240 4% 16%;
    --ring: 240 5% 84%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }

  /* ========================================
     Claude 라이트
     ======================================== */
  [data-theme="claude-light"] {
    --background: 36 52% 96%;           /* #FAF6EF 크림 */
    --foreground: 20 30% 14%;           /* #2D1F1A 다크 브라운 */
    --card: 0 0% 100%;
    --card-foreground: 20 30% 14%;
    --popover: 0 0% 100%;
    --popover-foreground: 20 30% 14%;
    --primary: 20 67% 46%;              /* #C35A28 테라코타 */
    --primary-foreground: 0 0% 100%;
    --secondary: 33 38% 89%;            /* #F0E8DA 베이지 */
    --secondary-foreground: 10 23% 30%; /* #5D3D3A 코코아 */
    --muted: 33 38% 89%;
    --muted-foreground: 20 10% 50%;     /* #8B7D75 웜 그레이 */
    --accent: 33 38% 89%;
    --accent-foreground: 20 30% 14%;
    --destructive: 18 82% 47%;          /* #DD5013 선셋 오렌지 */
    --destructive-foreground: 0 0% 100%;
    --border: 30 22% 86%;               /* #E5DDD0 웜 보더 */
    --input: 30 22% 86%;
    --ring: 20 67% 46%;
    --radius: 0.625rem;
    --chart-1: 20 67% 46%;              /* 테라코타 */
    --chart-2: 33 73% 37%;              /* 커피 */
    --chart-3: 10 23% 30%;              /* 코코아 */
    --chart-4: 252 92% 86%;             /* 라벤더 */
    --chart-5: 18 82% 47%;              /* 선셋 오렌지 */
  }

  /* ========================================
     Claude 다크
     ======================================== */
  [data-theme="claude-dark"] {
    --background: 24 25% 8%;            /* #1A1410 웜 블랙 */
    --foreground: 36 36% 93%;           /* #F5F0E6 구스 다운 */
    --card: 24 25% 11%;                 /* #241C16 */
    --card-foreground: 36 36% 93%;
    --popover: 24 25% 11%;
    --popover-foreground: 36 36% 93%;
    --primary: 20 60% 56%;              /* #D4764A */
    --primary-foreground: 24 25% 8%;
    --secondary: 24 25% 15%;            /* #2E241C */
    --secondary-foreground: 30 22% 76%; /* #D4C4B0 */
    --muted: 24 25% 15%;
    --muted-foreground: 20 12% 56%;     /* #9C8E82 */
    --accent: 24 25% 15%;
    --accent-foreground: 36 36% 93%;
    --destructive: 18 78% 54%;          /* #E85D2A */
    --destructive-foreground: 36 36% 93%;
    --border: 24 25% 18%;               /* #3A2E24 */
    --input: 24 25% 18%;
    --ring: 20 60% 56%;
    --chart-1: 20 60% 56%;
    --chart-2: 33 60% 50%;
    --chart-3: 30 22% 76%;
    --chart-4: 252 92% 86%;
    --chart-5: 18 78% 54%;
  }

  /* ========================================
     Codex (OpenAI) 라이트
     ======================================== */
  [data-theme="codex-light"] {
    --background: 0 0% 100%;            /* #FFFFFF */
    --foreground: 0 0% 3%;              /* #080808 Cod Gray */
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3%;
    --primary: 162 100% 33%;            /* #00A67E ChatGPT Green */
    --primary-foreground: 0 0% 100%;
    --secondary: 155 40% 94%;           /* #E6F7F2 Mint */
    --secondary-foreground: 162 90% 16%; /* #065F46 Dark Green */
    --muted: 155 20% 95%;
    --muted-foreground: 0 0% 40%;
    --accent: 155 40% 94%;
    --accent-foreground: 0 0% 3%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 90%;                 /* 뉴트럴 보더 */
    --input: 0 0% 90%;
    --ring: 162 100% 33%;
    --radius: 0.625rem;
    --chart-1: 162 100% 33%;            /* ChatGPT Green */
    --chart-2: 162 50% 55%;             /* Sea Nymph */
    --chart-3: 270 60% 70%;             /* Purple Accent */
    --chart-4: 0 0% 30%;                /* 다크 그레이 */
    --chart-5: 162 80% 20%;             /* 딥 그린 */
  }

  /* ========================================
     Codex (OpenAI) 다크
     ======================================== */
  [data-theme="codex-dark"] {
    --background: 0 0% 7%;              /* #121212 */
    --foreground: 0 0% 95%;             /* #F2F2F2 */
    --card: 0 0% 10%;                   /* #1A1A1A */
    --card-foreground: 0 0% 95%;
    --popover: 0 0% 10%;
    --popover-foreground: 0 0% 95%;
    --primary: 160 84% 51%;             /* #34D399 밝은 그린 */
    --primary-foreground: 0 0% 3%;
    --secondary: 0 0% 15%;              /* #262626 */
    --secondary-foreground: 0 0% 85%;
    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 55%;
    --accent: 0 0% 15%;
    --accent-foreground: 0 0% 95%;
    --destructive: 0 63% 45%;
    --destructive-foreground: 0 0% 95%;
    --border: 0 0% 18%;                 /* #2E2E2E */
    --input: 0 0% 18%;
    --ring: 160 84% 51%;
    --chart-1: 160 84% 51%;             /* 밝은 그린 */
    --chart-2: 162 50% 65%;             /* Sea Nymph 라이트 */
    --chart-3: 270 60% 75%;             /* Purple 라이트 */
    --chart-4: 0 0% 60%;                /* 미드 그레이 */
    --chart-5: 160 70% 40%;             /* 미드 그린 */
  }

  /* ========================================
     Gemini (Google) 라이트
     ======================================== */
  [data-theme="gemini-light"] {
    --background: 220 60% 99%;          /* #F8FAFF 블루 틴트 화이트 */
    --foreground: 220 15% 15%;          /* #202124 Google 다크 */
    --card: 0 0% 100%;
    --card-foreground: 220 15% 15%;
    --popover: 0 0% 100%;
    --popover-foreground: 220 15% 15%;
    --primary: 217 89% 61%;             /* #4285F4 Google Blue */
    --primary-foreground: 0 0% 100%;
    --secondary: 220 40% 96%;           /* #F0F4FF 블루 서피스 */
    --secondary-foreground: 217 80% 35%; /* #1A73E8 딥 블루 */
    --muted: 220 20% 96%;
    --muted-foreground: 220 5% 46%;     /* #5F6368 Google 그레이 */
    --accent: 220 40% 96%;
    --accent-foreground: 220 15% 15%;
    --destructive: 4 90% 58%;           /* #EA4335 Google Red */
    --destructive-foreground: 0 0% 100%;
    --border: 220 13% 91%;              /* #DADCE0 Google 보더 */
    --input: 220 13% 91%;
    --ring: 217 89% 61%;
    --radius: 0.625rem;
    --chart-1: 217 89% 61%;             /* Google Blue */
    --chart-2: 4 90% 58%;               /* Google Red */
    --chart-3: 36 100% 50%;             /* Google Yellow #FBBC05 */
    --chart-4: 142 69% 45%;             /* Google Green #34A853 */
    --chart-5: 217 80% 45%;             /* Deep Blue */
  }

  /* ========================================
     Gemini (Google) 다크
     ======================================== */
  [data-theme="gemini-dark"] {
    --background: 220 15% 8%;           /* #121418 딥 블루 블랙 */
    --foreground: 220 10% 93%;          /* #E8EAED Google 라이트 */
    --card: 220 15% 11%;                /* #1C1F24 */
    --card-foreground: 220 10% 93%;
    --popover: 220 15% 11%;
    --popover-foreground: 220 10% 93%;
    --primary: 217 80% 65%;             /* #669DF6 밝은 블루 */
    --primary-foreground: 220 15% 8%;
    --secondary: 220 15% 16%;           /* #282C33 */
    --secondary-foreground: 220 10% 80%;
    --muted: 220 15% 16%;
    --muted-foreground: 220 8% 55%;     /* #9AA0A6 */
    --accent: 220 15% 16%;
    --accent-foreground: 220 10% 93%;
    --destructive: 4 75% 50%;           /* 다크 모드 Red */
    --destructive-foreground: 220 10% 93%;
    --border: 220 12% 20%;              /* #303438 */
    --input: 220 12% 20%;
    --ring: 217 80% 65%;
    --chart-1: 217 80% 65%;             /* 밝은 블루 */
    --chart-2: 4 75% 60%;               /* 밝은 레드 */
    --chart-3: 36 90% 60%;              /* 밝은 옐로우 */
    --chart-4: 142 55% 55%;             /* 밝은 그린 */
    --chart-5: 217 70% 50%;             /* 미드 블루 */
  }
}
```

---

## 6. Tailwind CSS 설정 (tailwind.config.ts)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme*="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // shadcn/ui 시맨틱 (CSS 변수 참조)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },

        // 브랜드 확장 컬러 (직접 참조용)
        claude: {
          terracotta: "#C35A28",
          "terracotta-light": "#D4764A",
          cream: "#FAF6EF",
          "dark-cream": "#F8EED2",
          chocolate: "#3B110C",
          cocoa: "#5D3D3A",
          cinnamon: "#8B372B",
          "sunset-orange": "#DD5013",
          coffee: "#A05F1A",
          lavender: "#BDB7FC",
          "goose-down": "#F5F0E6",
        },
        codex: {
          green: "#00A67E",
          "green-light": "#34D399",
          "green-dark": "#065F46",
          mint: "#E6F7F2",
          "sea-nymph": "#74AA9C",
          purple: "#AB68FF",
          black: "#080808",
        },
        gemini: {
          blue: "#4285F4",
          "blue-light": "#669DF6",
          "blue-deep": "#1A73E8",
          red: "#EA4335",
          green: "#34A853",
          yellow: "#FBBC05",
          surface: "#F0F4FF",
          gray: "#5F6368",
        },
      },
      fontFamily: {
        serif: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 7. 테마별 디자인 특성 요약

| 특성 | Claude | Codex | Gemini |
|------|--------|-------|--------|
| 톤 | 웜 (갈색 계열) | 쿨 뉴트럴 + 그린 | 쿨 뉴트럴 + 블루 |
| 배경 | 크림 `#FAF6EF` | 순백 `#FFFFFF` | 블루 틴트 `#F8FAFF` |
| Primary | 테라코타 `#C35A28` | 그린 `#00A67E` | 블루 `#4285F4` |
| 다크 배경 | 웜 블랙 `#1A1410` | 순수 다크 `#121212` | 블루 블랙 `#121418` |
| 보더 | 웜 `#E5DDD0` | 뉴트럴 `#E5E5E5` | 쿨 `#DADCE0` |
| 그레이 | 웜 그레이 (갈색 가미) | 순수 그레이 | 쿨 그레이 (블루 가미) |
| 헤딩 폰트 | 세리프 | 산세리프 | 산세리프 |
| 차트 팔레트 | 테라코타 계열 | 그린+퍼플 | Google 4색 |
| 느낌 | 따뜻한, 인간적 | 미니멀, 기술적 | 깔끔한, 머티리얼 |

---

## 8. next-themes 설정

```tsx
// components/theme/theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes';

const THEMES = [
  'light', 'dark',
  'claude-light', 'claude-dark',
  'codex-light', 'codex-dark',
  'gemini-light', 'gemini-dark',
] as const;

export type AgentmonTheme = typeof THEMES[number];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      themes={[...THEMES]}
      defaultTheme="light"
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  );
}
```

### Tailwind 다크 모드 감지

`data-theme`에 "dark"가 포함된 모든 테마에서 Tailwind `dark:` 유틸리티가 동작하도록 설정:

```typescript
// tailwind.config.ts
darkMode: ["selector", '[data-theme*="dark"]'],
```

이렇게 하면 `claude-dark`, `codex-dark`, `gemini-dark` 모두에서 `dark:bg-card` 같은 유틸리티가 정상 동작합니다.
