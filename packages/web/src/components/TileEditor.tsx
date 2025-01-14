import React, { useState } from 'react';
import { Color, PatternInput } from '../types/tile';
import './TileEditor.css';

interface TileEditorProps {
    onSolve: (pattern: PatternInput, jokerCount: number) => void;
}

const COLORS: Color[] = ['red', 'black', 'blue', 'yellow'];
const MAX_TILES_PER_COLOR = 13;
const TOTAL_RANDOM_TILES = 21;

export const TileEditor: React.FC<TileEditorProps> = ({ onSolve }) => {
    const [pattern, setPattern] = useState<PatternInput>({
        name: 'pattern',
        tiles: {
            red: Array(MAX_TILES_PER_COLOR).fill(0),
            black: Array(MAX_TILES_PER_COLOR).fill(0),
            blue: Array(MAX_TILES_PER_COLOR).fill(0),
            yellow: Array(MAX_TILES_PER_COLOR).fill(0)
        }
    });
    const [jokerCount, setJokerCount] = useState(0);

    const handleTileClick = (color: Color, index: number) => {
        setPattern(prev => ({
            ...prev,
            tiles: {
                ...prev.tiles,
                [color]: prev.tiles[color].map((v, i) => 
                    i === index ? (v + 1) % 3 : v
                )
            }
        }));
    };

    const handleJokerClick = () => {
        setJokerCount((prev) => (prev + 1) % 3);
    };

    const handleSolve = () => {
        onSolve(pattern, jokerCount);
    };

    const handleClear = () => {
        setPattern({
            name: 'pattern',
            tiles: {
                red: Array(MAX_TILES_PER_COLOR).fill(0),
                black: Array(MAX_TILES_PER_COLOR).fill(0),
                blue: Array(MAX_TILES_PER_COLOR).fill(0),
                yellow: Array(MAX_TILES_PER_COLOR).fill(0)
            }
        });
        setJokerCount(0);
    };

    const handleRandom = () => {
        // 初始化新的空模式
        const newPattern = {
            name: 'pattern',
            tiles: {
                red: Array(MAX_TILES_PER_COLOR).fill(0),
                black: Array(MAX_TILES_PER_COLOR).fill(0),
                blue: Array(MAX_TILES_PER_COLOR).fill(0),
                yellow: Array(MAX_TILES_PER_COLOR).fill(0)
            }
        };

        // 生成19张随机牌
        let remainingTiles = TOTAL_RANDOM_TILES;
        while (remainingTiles > 0) {
            // 随机选择颜色和数字
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            const index = Math.floor(Math.random() * MAX_TILES_PER_COLOR);
            
            // 确保每个位置最多有2张牌
            if (newPattern.tiles[color][index] < 2) {
                newPattern.tiles[color][index]++;
                remainingTiles--;
            }
        }

        setPattern(newPattern);
        // 随机设置joker数量 (0-2)
        setJokerCount(Math.floor(Math.random() * 3));
    };

    return (
        <div className="tile-editor">
            <div className="tile-grid">
                <div className="header-row">
                    <div className="header-label"></div>
                    <div className="header-numbers">
                        {Array.from({ length: MAX_TILES_PER_COLOR }, (_, i) => (
                            <div key={i} className="header-number">
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>

                {COLORS.map(color => (
                    <div 
                        key={color} 
                        className="color-row"
                        data-color={color}
                    >
                        <div className={`color-label ${color}`}>{color}</div>
                        <div className="number-inputs">
                            {Array.from({ length: MAX_TILES_PER_COLOR }, (_, i) => (
                                <div
                                    key={i}
                                    className={`tile-button ${pattern.tiles[color][i] > 0 ? 'active' : ''}`}
                                    onClick={() => handleTileClick(color, i)}
                                >
                                    {pattern.tiles[color][i]}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="controls">
                <div className="joker-control">
                    <span>Joker Count:</span>
                    <div 
                        className="joker-button"
                        onClick={handleJokerClick}
                    >
                        {jokerCount}
                    </div>
                </div>
                
                <div className="buttons">
                    <button onClick={handleRandom}>Random</button>
                    <button onClick={handleSolve}>Solve</button>
                    <button onClick={handleClear}>Clear</button>
                </div>
            </div>
        </div>
    );
}; 