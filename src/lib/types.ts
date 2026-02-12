export interface Scores {
  preparation: number;
  engagement: number;
  timeManagement: number;
  satisfaction: number;
  energy: number;
}

export interface Reflection {
  id: number;
  datetime: string;
  className: string;
  topic: string;
  scores: Scores;
  preparationProcess: string;
  strengths: string;
  improvements: string;
  actionItems: string;
  createdAt: string;
}
