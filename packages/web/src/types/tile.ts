export type Color = 'red' | 'black' | 'blue' | 'yellow';

export interface Tile {
    number: number;
    color: number;
    isJoker: boolean;
}

export interface PatternInput {
    name: string;
    tiles: {
        red: number[];
        black: number[];
        blue: number[];
        yellow: number[];
    };
}

export interface ScoredCombination {
    type: 'sequence' | 'triplet';
    tiles: Tile[];
    score: number;
}

export interface Solution {
    score: number;
    combinations: ScoredCombination[];
}

export interface SolveRequest {
    pattern: PatternInput;
    jokerCount: number;
} 