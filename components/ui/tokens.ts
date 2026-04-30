/**
 * 플로코 디자인 토큰
 *
 * 사용 예시:
 *   import { Colors, Typography, Spacing, Radius, Shadows } from '../components/ui/tokens';
 *
 *   <View style={{
 *     backgroundColor: Colors.cardBg,
 *     padding: Spacing.lg,
 *     borderRadius: Radius.xl,
 *     ...Shadows.md,
 *   }}>
 *     <Text variant="title2" color="textPrimary">제목</Text>
 *   </View>
 *
 * ⚠️ 하드코딩 금지:
 *   ❌ backgroundColor: '#58CC02'
 *   ✅ backgroundColor: Colors.primary
 *
 * 한국 주식 컨벤션:
 *   - profit (이익/상승) = 빨강 (#FF4B4B)
 *   - loss   (손실/하락) = 파랑 (#1CB0F6)
 */

export const Colors = {
  // Primary - 듀오링고 메인 초록
  primary: '#58CC02',
  primaryDark: '#46A302',
  primaryLight: '#89E219',

  // Surfaces (배경)
  background: '#FFFFFF',
  surface: '#F7F7F7',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#4B4B4B',     // 듀오링고 진회색
  textSecondary: '#777777',
  textTertiary: '#AFAFAF',
  textInverse: '#FFFFFF',

  // 한국 주식 컨벤션 - 빨강=이익, 파랑=손실
  profit: '#FF4B4B',          // 이익(상승)
  loss: '#1CB0F6',            // 손실(하락)

  // Status
  success: '#58CC02',
  warning: '#FFC800',
  danger: '#FF4B4B',
  info: '#1CB0F6',

  // Borders & Dividers
  border: '#E5E5E5',
  divider: '#F0F0F0',

  // Misc
  cardBg: '#FFFFFF',
  shadow: '#000000',
};

export const Typography = {
  display: { fontSize: 32, lineHeight: 40, fontFamily: 'Pretendard-ExtraBold' },
  title1:  { fontSize: 24, lineHeight: 32, fontFamily: 'Pretendard-Bold' },
  title2:  { fontSize: 20, lineHeight: 28, fontFamily: 'Pretendard-Bold' },
  title3:  { fontSize: 18, lineHeight: 26, fontFamily: 'Pretendard-SemiBold' },
  body:    { fontSize: 16, lineHeight: 24, fontFamily: 'Pretendard-Medium' },
  bodySm:  { fontSize: 14, lineHeight: 22, fontFamily: 'Pretendard-Regular' },
  caption: { fontSize: 12, lineHeight: 18, fontFamily: 'Pretendard-Regular' },
  button:  { fontSize: 16, lineHeight: 22, fontFamily: 'Pretendard-Bold' },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};
