import { RedisMemoryServer } from 'redis-memory-server';

const port = Number(process.env.REDIS_PORT || 6399);

const server = new RedisMemoryServer({
  instance: { port },
  autoStart: false,
});

await server.start();
const host = await server.getHost();
const actualPort = await server.getPort();
console.log(`Redis memory server running at ${host}:${actualPort}`);

process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.stop();
  process.exit(0);
});
