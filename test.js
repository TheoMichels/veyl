const { PrismaClient } = require('@prisma/client');
const { fetchFeed } = require('./src/lib/rss.ts'); // wait, I can't require TS easily.
