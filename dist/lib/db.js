"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const prisma_1 = require("../generated/prisma");
const globalForPrisma = globalThis;
exports.db = globalForPrisma.prisma || new prisma_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'error',
        },
        {
            emit: 'event',
            level: 'info',
        },
        {
            emit: 'event',
            level: 'warn',
        },
    ] : [],
});
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.db;
