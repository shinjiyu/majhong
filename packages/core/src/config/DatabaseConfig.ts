import * as fs from 'fs';
import * as path from 'path';

export interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    charset: string;
}

export class ConfigLoader {
    private static instance: ConfigLoader;
    private config: DatabaseConfig;

    private constructor() {
        const configPath = path.join(__dirname, '../../config/database.json');
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    public static getInstance(): ConfigLoader {
        if (!ConfigLoader.instance) {
            ConfigLoader.instance = new ConfigLoader();
        }
        return ConfigLoader.instance;
    }

    public getDatabaseConfig(): DatabaseConfig {
        return this.config;
    }
} 