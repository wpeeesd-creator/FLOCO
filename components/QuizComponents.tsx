/**
 * OX 퀴즈 & 빈칸 채우기 퀴즈 컴포넌트
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Colors } from './ui';

// ── 색상 상수 ──────────────────────────────────────────────────────────────
const CORRECT_COLOR = '#34C759';
const CORRECT_BG = '#E8FFF0';
const INCORRECT_COLOR = '#F04452';
const INCORRECT_BG = '#FFF0F0';

// ── OX 퀴즈 ────────────────────────────────────────────────────────────────
interface OXQuizProps {
  question: string;
  answer: boolean;
  explanation: string;
  onAnswer: (correct: boolean) => void;
}

export function OXQuiz({ question, answer, explanation, onAnswer }: OXQuizProps) {
  const [selected, setSelected] = useState<boolean | null>(null);

  const handlePress = (value: boolean) => {
    if (selected !== null) return;
    setSelected(value);
    const correct = value === answer;
    onAnswer(correct);
  };

  const isAnswered = selected !== null;
  const isCorrect = isAnswered && selected === answer;

  return (
    <View style={styles.container}>
      {/* 문제 */}
      <Text style={styles.question}>{question}</Text>

      {/* O / X 버튼 */}
      <View style={styles.oxRow}>
        <OXButton
          label="O"
          onPress={() => handlePress(true)}
          disabled={isAnswered}
          state={
            !isAnswered ? 'idle'
              : selected === true
                ? (answer === true ? 'correct' : 'incorrect')
                : (answer === true ? 'reveal' : 'idle')
          }
        />
        <OXButton
          label="X"
          onPress={() => handlePress(false)}
          disabled={isAnswered}
          state={
            !isAnswered ? 'idle'
              : selected === false
                ? (answer === false ? 'correct' : 'incorrect')
                : (answer === false ? 'reveal' : 'idle')
          }
        />
      </View>

      {/* 피드백 */}
      {isAnswered && (
        <View style={[styles.feedbackCard, { backgroundColor: isCorrect ? CORRECT_BG : INCORRECT_BG }]}>
          <Text style={[styles.feedbackLabel, { color: isCorrect ? CORRECT_COLOR : INCORRECT_COLOR }]}>
            {isCorrect ? '정답이에요! 🎉' : '오답이에요 😢'}
          </Text>
          <Text style={styles.feedbackText}>{explanation}</Text>
        </View>
      )}
    </View>
  );
}

type OXButtonState = 'idle' | 'correct' | 'incorrect' | 'reveal';

function OXButton({
  label, onPress, disabled, state,
}: { label: string; onPress: () => void; disabled: boolean; state: OXButtonState }) {
  const bgColor =
    state === 'correct' ? CORRECT_COLOR
      : state === 'incorrect' ? INCORRECT_COLOR
        : state === 'reveal' ? CORRECT_COLOR
          : Colors.card;

  const textColor =
    state === 'idle' ? (label === 'O' ? CORRECT_COLOR : INCORRECT_COLOR)
      : '#FFFFFF';

  const borderColor =
    state === 'idle'
      ? (label === 'O' ? CORRECT_COLOR : INCORRECT_COLOR)
      : bgColor;

  return (
    <TouchableOpacity
      style={[styles.oxBtn, { backgroundColor: bgColor, borderColor }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.oxBtnText, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── 빈칸 채우기 퀴즈 ─────────────────────────────────────────────────────────
interface FillBlankQuizProps {
  question: string;
  answer: string;
  options: string[];
  explanation: string;
  onAnswer: (correct: boolean) => void;
}

export function FillBlankQuiz({ question, answer, options, explanation, onAnswer }: FillBlankQuizProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handlePress = (option: string) => {
    if (selected !== null) return;
    setSelected(option);
    onAnswer(option === answer);
  };

  const isAnswered = selected !== null;
  const isCorrect = isAnswered && selected === answer;

  // "___" → "[ ? ]" 치환
  const displayQuestion = question.replace(/___/g, '[ ? ]');

  return (
    <View style={styles.container}>
      {/* 문제 */}
      <Text style={styles.question}>{displayQuestion}</Text>

      {/* 선택지 칩 */}
      <View style={styles.optionsRow}>
        {options.map((option) => {
          const chipState: 'idle' | 'correct' | 'incorrect' | 'reveal' =
            !isAnswered ? 'idle'
              : option === selected
                ? (option === answer ? 'correct' : 'incorrect')
                : (option === answer ? 'reveal' : 'idle');

          const bgColor =
            chipState === 'correct' ? CORRECT_COLOR
              : chipState === 'incorrect' ? INCORRECT_COLOR
                : chipState === 'reveal' ? CORRECT_BG
                  : '#F2F4F6';

          const textColor =
            chipState === 'correct' || chipState === 'incorrect' ? '#FFFFFF'
              : chipState === 'reveal' ? CORRECT_COLOR
                : Colors.text;

          const borderColor =
            chipState === 'correct' ? CORRECT_COLOR
              : chipState === 'incorrect' ? INCORRECT_COLOR
                : chipState === 'reveal' ? CORRECT_COLOR
                  : 'transparent';

          return (
            <TouchableOpacity
              key={option}
              style={[styles.chip, { backgroundColor: bgColor, borderColor, borderWidth: chipState === 'reveal' ? 1 : 0 }]}
              onPress={() => handlePress(option)}
              disabled={isAnswered}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, { color: textColor }]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 피드백 */}
      {isAnswered && (
        <View style={[styles.feedbackCard, { backgroundColor: isCorrect ? CORRECT_BG : INCORRECT_BG }]}>
          <Text style={[styles.feedbackLabel, { color: isCorrect ? CORRECT_COLOR : INCORRECT_COLOR }]}>
            {isCorrect ? '정답이에요! 🎉' : `오답이에요 😢  정답: ${answer}`}
          </Text>
          <Text style={styles.feedbackText}>{explanation}</Text>
        </View>
      )}
    </View>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 24,
  },
  // OX
  oxRow: {
    flexDirection: 'row',
    gap: 12,
  },
  oxBtn: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  oxBtnText: {
    fontSize: 36,
    fontWeight: '800',
  },
  // Fill blank
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Feedback
  feedbackCard: {
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
});
