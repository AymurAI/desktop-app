export interface Props {
  getMatchCount: () => number;
  count: number;
  next: () => void;
  previous: () => void;
}
