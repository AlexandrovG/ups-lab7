import { resolve } from 'path';
import { generateApi } from 'swagger-typescript-api';

generateApi({
    name: 'Api.ts',
    output: resolve(process.cwd(), './src/api'),
    input: resolve(process.cwd(), '../office-ups-sprint-6-backend/docs/swagger.json'),
    httpClientType: 'axios',
});