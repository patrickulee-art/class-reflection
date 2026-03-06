export type CognitiveLevel = 'none' | 'low' | 'medium' | 'high' | 'story' | 'break' | 'problem';

export interface DefaultEvals {
  flow: EvalData;
  kick: EvalData;
  humor: EvalData;
  nonverbal: EvalData;
  board: EvalData;
}

export interface EvalData {
  rating: number;
  comment: string;
}

export interface CustomEval {
  id: string;
  name: string;
  rating: number;
  comment: string;
}

export interface PlanBlock {
  id: number;
  title: string;
  subtitle: string;
  minutes: number;
  cognitiveLevel: CognitiveLevel;
  isStory: boolean;
  isBreak: boolean;
  isProblem: boolean;
  defaultEvals: DefaultEvals;
  customEvals: CustomEval[];
  kicks: string[];
  memo: string;
}

export interface ActualBlock {
  id: number;
  title: string;
  subtitle: string;
  plannedMinutes: number;
  actualMinutes: number;
  cognitiveLevel: CognitiveLevel;
  isStory: boolean;
  isBreak: boolean;
  defaultEvals: DefaultEvals;
  customEvals: CustomEval[];
  actualDifficulty: string;
  memo: string;
  improvements: string;
}

export interface Reflection {
  id: number;
  date: string;
  timeStart: string;
  timeEnd: string;
  courseTitle: string;
  sessionNumber: string;
  totalTimeLimit: number;
  totalPlannedMinutes: number;
  totalActualMinutes: number;
  planBlocks: PlanBlock[];
  actualBlocks: ActualBlock[];
  createdAt: string;
}

export function createDefaultEvals(): DefaultEvals {
  return {
    flow: { rating: 0, comment: '' },
    kick: { rating: 0, comment: '' },
    humor: { rating: 0, comment: '' },
    nonverbal: { rating: 0, comment: '' },
    board: { rating: 0, comment: '' },
  };
}

export function createPlanBlock(id: number): PlanBlock {
  return {
    id,
    title: '',
    subtitle: '',
    minutes: 10,
    cognitiveLevel: 'none',
    isStory: false,
    isBreak: false,
    isProblem: false,
    defaultEvals: createDefaultEvals(),
    customEvals: [],
    kicks: [''],
    memo: '',
  };
}

export function createStoryBlock(id: number): PlanBlock {
  return {
    ...createPlanBlock(id),
    title: '썰/휴식',
    minutes: 5,
    cognitiveLevel: 'story',
    isStory: true,
  };
}

export function createBreakBlock(id: number): PlanBlock {
  return {
    ...createPlanBlock(id),
    title: '쉬는 시간',
    minutes: 10,
    cognitiveLevel: 'break',
    isBreak: true,
  };
}

export function createProblemBlock(id: number): PlanBlock {
  return {
    ...createPlanBlock(id),
    title: '문제 풀이 시간',
    minutes: 6,
    cognitiveLevel: 'problem',
    isProblem: true,
    kicks: [''],
  };
}
