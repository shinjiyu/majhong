import { TilePattern, Color } from './TilePattern';

export interface PatternInput {
    name: string;
    tiles: {
        red: number[];
        black: number[];
        blue: number[];
        yellow: number[];
    };
}

export class PatternParser {
    static fromJSON(input: PatternInput): TilePattern {
        const pattern = new TilePattern();
        
        // 添加红色牌
        for (const number of input.tiles.red) {
            pattern.addTile(number, Color.RED);
        }
        
        // 添加黑色牌
        for (const number of input.tiles.black) {
            pattern.addTile(number, Color.BLACK);
        }
        
        // 添加蓝色牌
        for (const number of input.tiles.blue) {
            pattern.addTile(number, Color.BLUE);
        }
        
        // 添加黄色牌
        for (const number of input.tiles.yellow) {
            pattern.addTile(number, Color.YELLOW);
        }
        
        return pattern;
    }
} 