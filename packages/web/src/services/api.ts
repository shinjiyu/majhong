import { PatternInput, Solution } from '../types/tile';

const API_BASE_URL = 'http://localhost:3000/api';

export async function solvePattern(pattern: PatternInput, jokerCount: number): Promise<Solution> {
    const response = await fetch(`${API_BASE_URL}/solve`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pattern, jokerCount }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to solve pattern');
    }

    const data = await response.json();
    return data.solution;
} 