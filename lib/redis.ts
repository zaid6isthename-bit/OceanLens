import Redis from 'ioredis'

const url = process.env.REDIS_URL
let client: Redis.Redis

if (!url) {
  client = new Redis()
} else {
  client = new Redis(url)
}

export default client
