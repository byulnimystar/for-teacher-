/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CounselMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface DiaryEntry {
  id: string;
  date: string; // ISO String or YYYY-MM-DD
  content: string;
  emotion: "peace" | "tired" | "angry" | "happy" | "anxious";
  reply?: string;
}

export interface TestResult {
  score: number;
  level: "안정" | "경미한 스트레스" | "높은 스트레스" | "위험 (번아웃 번초)";
  description: string;
  advice: string;
}

export interface ComfortCard {
  id: number;
  content: string;
  author: string;
  category: "공감" | "위로" | "용기" | "쉼";
}
