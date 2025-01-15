import React, { useState } from 'react';
import { TileEditor } from './components/TileEditor';
import { MemoryStats } from './components/MemoryStats';
import { solvePattern } from './services/api';
import { PatternInput, Solution } from './types/tile';
import './App.css';
import './components/MemoryStats.css';

const ColorMap = {
  0: 'red',
  1: 'black',
  2: 'blue',
  3: 'yellow'
} as const;

function App() {
  const [currentPage, setCurrentPage] = useState<'editor' | 'memory'>('editor');
  const [solution, setSolution] = useState<Solution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSolve = async (pattern: PatternInput, jokerCount: number) => {
    try {
      setLoading(true);
      setError(null);

      let patternInput: PatternInput = {
        name: pattern.name,
        tiles: {
          black: [],
          blue: [],
          red: [],
          yellow: []
        }
      };

      (['black', 'blue', 'red', 'yellow'] as const).forEach((color: 'black' | 'blue' | 'red' | 'yellow') => {
        let newSet: number[] = [];
        pattern.tiles[color].forEach((count, index) => {
          while (count > 0) {
            newSet.push(index + 1);
            count--;
          }
        });
        patternInput.tiles[color] = newSet;
      });

      const result = await solvePattern(patternInput, jokerCount);
      setSolution(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSolution(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="app-container">
        <h1>Okey 101 Pattern Solver</h1>
        
        <div className="nav-buttons">
          <button 
            className={currentPage === 'editor' ? 'active' : ''} 
            onClick={() => setCurrentPage('editor')}
          >
            Pattern Editor
          </button>
          <button 
            className={currentPage === 'memory' ? 'active' : ''} 
            onClick={() => setCurrentPage('memory')}
          >
            Memory Stats
          </button>
        </div>

        {currentPage === 'editor' ? (
          <>
            <TileEditor onSolve={handleSolve} />
            {loading && <div className="loading">Solving pattern...</div>}
            {error && <div className="error">{error}</div>}
            {solution && (
              <div className="solution">
                <div className="score">Score: {solution.score}</div>
                <div className="combinations">
                  {solution.combinations.map((combo, index) => (
                    <div key={index} className="combination">
                      <div className="combo-type">{combo.type}</div>
                      <div className="combo-tiles">
                        {combo.tiles.map((tile, i) => (
                          <div
                            key={i}
                            className={`tile ${tile.isJoker ? 'joker' : ''}`}
                            data-color={ColorMap[tile.color as keyof typeof ColorMap]}
                          >
                            {tile.number}
                          </div>
                        ))}
                      </div>
                      <div className="combo-score">+{combo.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <MemoryStats />
        )}
      </div>
    </div>
  );
}

export default App;
