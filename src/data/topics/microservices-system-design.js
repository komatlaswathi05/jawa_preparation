const topic = {
  id: 'microservices-system-design',
  category: 'microservices',
  title: 'System Design Basics',
  description: "Scale a backend from one server to millions of users: load balancing, stateless services, caching, replication, sharding, consistent hashing, CAP, IDs, rate limiting and a URL shortener walkthrough.",
  difficulty: 'Advanced',
  overview: "System design interviews ask you to sketch how a real service would work at scale: \"design a URL shortener\", \"design an order system for a flash sale\". There is no single correct answer. Interviewers want to see that you clarify requirements, estimate the load, pick sensible building blocks, and explain the trade-offs of each choice.\n\nThink of a restaurant that becomes famous. First you buy a bigger kitchen (vertical scaling). Then you open more kitchens and put a host at the door to send guests to whichever has space (horizontal scaling and a load balancer). You prepare popular dishes in advance (caching), keep copies of the recipe book in each kitchen (replication), and split the menu between kitchens when one book gets too big (sharding).\n\nThis topic covers those building blocks from a Java backend developer's point of view, and finishes with a step-by-step design of a URL shortener that ties them together. Many of the pieces (Redis, Kafka, circuit breakers, Kubernetes) have their own topics; here the focus is on when and why to use them.",

  subtopics: [
    {
      id: 'approach',
      title: 'How to approach a system design question',
      explanation: "Use a repeatable structure so you do not jump straight to boxes and arrows.\n\n1. Clarify requirements: the functional ones (what must the system do) and the non-functional ones (scale, latency, availability, consistency, durability).\n2. Estimate: users, requests per second, read/write ratio, data size per year. This tells you whether one database is enough.\n3. Define the API and the data model.\n4. Draw a high-level design: clients, load balancer, services, database, cache, queue.\n5. Deep-dive the hardest parts: the bottleneck, the hot key, the consistency problem.\n6. Discuss trade-offs, failure modes and how you would monitor it.",
      example: `Question: "Design a URL shortener"

1. Requirements   shorten a URL, redirect, optional expiry and custom alias
                  100M new URLs/month, reads 100x writes, redirect < 50 ms, highly available
2. Estimates      writes: 100M / (30 * 86,400 s) ~ 40/s     reads: ~4,000/s (peaks 10x)
                  storage: 100M * 12 months * 5 years * 500 bytes ~ 3 TB
3. API            POST /api/urls {longUrl} -> {shortCode}      GET /{code} -> 301/302
4. High level     LB -> stateless app servers -> Redis cache -> database
5. Deep dive      short code generation, cache hit rate, hot links
6. Trade-offs     301 vs 302, SQL vs NoSQL, eventual consistency of analytics`,
      interviewPoints: [
        "Requirements first, then estimates.",
        "API and data model before the architecture.",
        "Go deep on the bottleneck.",
        "Always discuss trade-offs and failures.",
      ],
    },
    {
      id: 'back-of-envelope',
      title: 'Back-of-the-envelope estimation',
      explanation: "Quick estimates guide every decision. A day has about 86,400 seconds, roughly 10^5, so 1 million requests per day is about 12 requests per second, and 1 billion per day is about 12,000 per second. Peak traffic is often 2 to 10 times the average.\n\nUseful rough numbers: a single well-tuned PostgreSQL server handles thousands of simple queries per second; Redis handles around 100,000 operations per second per node; a stateless Spring Boot instance handles hundreds to a few thousand requests per second depending on the work; reading from memory takes about 100 ns, from SSD about 100 µs, and a round trip within a data centre about 0.5 ms. Precision does not matter; the order of magnitude does.",
      example: `Photo-sharing app:
  10M daily active users, each views 50 photos and uploads 0.2 photos per day

  reads   = 10M * 50  / 86,400  ~ 5,800 req/s   (peak ~ 30,000/s)
  writes  = 10M * 0.2 / 86,400  ~ 23 req/s
  storage = 2M photos/day * 2 MB = 4 TB/day  -> object storage (S3), not a database
  => read-heavy: cache + CDN matter far more than write throughput`,
      interviewPoints: [
        "1M/day ~ 12/s; 1B/day ~ 12,000/s.",
        "Plan for peaks, not averages.",
        "Estimate storage to choose the right store.",
        "Order of magnitude is enough.",
      ],
    },
    {
      id: 'scaling',
      title: 'Vertical vs horizontal scaling',
      explanation: "Vertical scaling (scale up) means a bigger machine: more CPU, memory, faster disks. It is simple and needs no code changes, but it has a hard ceiling, gets expensive, and the machine is still a single point of failure.\n\nHorizontal scaling (scale out) means more machines sharing the load behind a load balancer. It can grow almost without limit and survives the loss of a machine, but the application must be designed for it: instances must be stateless, and shared state moves into databases, caches and queues. Application servers are easy to scale out; databases are the hard part, which is why replication and sharding exist.",
      example: `Vertical:    1 x (4 CPU, 16 GB)   ->  1 x (32 CPU, 256 GB)
Horizontal:  1 x (4 CPU, 16 GB)   ->  10 x (4 CPU, 16 GB) behind a load balancer

Kubernetes: horizontal scaling is one line
kubectl scale deployment order-service --replicas=10`,
      interviewPoints: [
        "Vertical: simple, limited, single point of failure.",
        "Horizontal: elastic and resilient, needs stateless design.",
        "App tier scales out easily; data tier is hard.",
      ],
    },
    {
      id: 'stateless',
      title: 'Stateless services and sessions',
      explanation: "A service is stateless when any instance can handle any request, because nothing about the user is kept in the instance's memory between requests. That is what lets a load balancer send each request anywhere and lets you add or remove instances freely.\n\nState must live somewhere shared. HTTP sessions can be stored in Redis (Spring Session) or replaced by self-contained JWT tokens. Uploaded files go to object storage, not the local disk. Caches either live in a shared Redis cluster or are treated as local, disposable copies. Sticky sessions (always routing a user to the same instance) are a workaround, but they break when that instance dies and make load uneven.",
      example: `# Spring Session with Redis: sessions survive instance restarts and scaling
spring:
  session:
    store-type: redis      # Spring Boot 2.x; in 3.x adding spring-session-data-redis is enough
  data:
    redis:
      host: redis

# or stateless JWT: every request carries its own identity
Authorization: Bearer eyJhbGciOiJSUzI1NiJ9...`,
      interviewPoints: [
        "Any instance can serve any request.",
        "Sessions in Redis or JWT; files in object storage.",
        "Sticky sessions are a fragile workaround.",
      ],
    },
    {
      id: 'load-balancing',
      title: 'Load balancers',
      explanation: "A load balancer spreads incoming requests over healthy backend instances, removes instances that fail health checks, and gives clients one stable address. Layer 4 load balancers route by IP and port (fast, protocol-agnostic); layer 7 load balancers understand HTTP and can route by path, host or header, terminate TLS and add headers.\n\nCommon algorithms: round robin (simple, even for similar requests), least connections (better when requests vary in cost), weighted (for instances of different sizes) and hashing on a key such as the client IP (for stickiness). Examples are NGINX, HAProxy, AWS ALB/NLB and Kubernetes Services and Ingress. The load balancer itself must be redundant, typically a managed service or a pair with failover.",
      example: `                    +---------------------+
   clients  ----->  |  Load balancer (L7)  |  TLS, /api/orders -> order-service
                    +----------+----------+
                ┌──────────────┼──────────────┐
                v              v              v
           order-svc-1    order-svc-2    order-svc-3     (health check: /actuator/health/readiness)

upstream order_service {          # NGINX
    least_conn;
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;
    server 10.0.1.12:8080;
}`,
      interviewPoints: [
        "Distributes load and hides failed instances.",
        "L4 (TCP) vs L7 (HTTP-aware).",
        "Round robin, least connections, weighted, hash.",
        "The load balancer must not be a single point of failure.",
      ],
    },
    {
      id: 'caching',
      title: 'Caching layers and strategies',
      explanation: "Caching stores the results of expensive work closer to the user. Layers, from the outside in: the browser cache, a CDN at the edge for static files and cacheable API responses, a local in-process cache (Caffeine) in each instance, a distributed cache (Redis) shared by all instances, and the database's own buffer cache.\n\nThe most common pattern is cache-aside: read from the cache, on a miss read the database and populate the cache; on writes, update the database and evict the cache entry. Write-through writes to the cache and database together, and write-behind writes to the cache and flushes to the database later (fast but can lose data). Every cache needs a TTL and an invalidation plan. Watch for a cache stampede, where many requests miss the same hot key at once, and mitigate it with request coalescing, locks or early refresh. See the Caching and Redis topics for the Spring details.",
      example: `// cache-aside
public Product getProduct(long id) {
    Product cached = redis.get("product:" + id);
    if (cached != null) return cached;                  // hit
    Product p = productRepository.findById(id).orElseThrow();
    redis.set("product:" + id, p, Duration.ofMinutes(10));
    return p;
}

public void updateProduct(Product p) {
    productRepository.save(p);
    redis.delete("product:" + p.getId());               // invalidate, next read refills
}`,
      interviewPoints: [
        "Layers: browser, CDN, local, distributed, database.",
        "Cache-aside is the default pattern.",
        "Always define TTL and invalidation.",
        "Beware stampedes on hot keys.",
      ],
    },
    {
      id: 'replication',
      title: 'Database replication and read replicas',
      explanation: "Replication keeps copies of the database on several servers. In the common leader-follower setup, all writes go to the leader (primary), which streams changes to followers (replicas). Reads can be served by replicas, which scales read-heavy workloads, and if the leader fails, a replica is promoted.\n\nAsynchronous replication is fast but replicas lag behind, so a user may write something and not see it on the next read from a replica. Fixes include reading your own writes from the leader for a short time, or routing strongly consistent reads to the leader. Synchronous replication guarantees the replica has the data before the commit returns, at the cost of latency and availability. In Spring you can route read-only transactions to replicas with a routing DataSource.",
      example: `                writes                     async replication
  app  ─────────────────────>  leader  ─────────────────┬──> replica 1
   │                                                     └──> replica 2
   └──── reads (@Transactional(readOnly = true)) ──────────> replicas

Replication lag problem:
  t=0  user updates profile  -> leader
  t=1  user reloads page     -> replica (not yet updated) -> old profile shown
Fix: read from the leader for this user for a few seconds after a write`,
      interviewPoints: [
        "Leader takes writes, replicas serve reads.",
        "Scales reads and enables failover.",
        "Async replication causes replication lag.",
        "Read-your-writes by routing to the leader.",
      ],
    },
    {
      id: 'sharding',
      title: 'Sharding (partitioning)',
      explanation: "When a single database can no longer hold the data or handle the writes, split the data into shards, each stored on a different server. A shard key decides where each row lives. Range-based sharding (users A-M on shard 1, N-Z on shard 2) keeps ranges together but can create hotspots. Hash-based sharding (hash(userId) % N) spreads data evenly but makes range queries hit every shard. Directory-based sharding keeps a lookup table of key to shard.\n\nChoose a shard key that matches the main access pattern, so most queries touch one shard: for an e-commerce system, customer_id keeps a customer's orders together. Costs: cross-shard queries and joins become expensive, transactions across shards need sagas or two-phase commit, and adding shards requires moving data. Shard only when replication, indexing, caching and vertical scaling are no longer enough.",
      example: `shard = hash(customer_id) % 4

customer 1001 -> shard 1      SELECT * FROM orders WHERE customer_id = 1001   (one shard)
customer 1002 -> shard 2
customer 1003 -> shard 3      SELECT SUM(amount) FROM orders                  (all 4 shards)

Problem with % N: going from 4 to 5 shards moves about 80% of keys.
=> use consistent hashing or a fixed number of logical shards mapped to servers`,
      interviewPoints: [
        "Splits data across servers by a shard key.",
        "Range vs hash vs directory sharding.",
        "Pick the key from the main query pattern.",
        "Cross-shard queries and transactions are expensive.",
      ],
    },
    {
      id: 'consistent-hashing',
      title: 'Consistent hashing',
      explanation: "With `hash(key) % N`, changing the number of servers N changes the result for almost every key, which forces a massive reshuffle of cached or stored data. Consistent hashing places both servers and keys on a ring of hash values. A key belongs to the first server clockwise from its position. When a server is added, it only takes over the keys between it and its predecessor; when one is removed, only its keys move to the next server. On average only K/N keys move.\n\nWith few servers, the ring can be uneven, so each physical server is placed at many points on the ring as virtual nodes, which spreads load evenly and lets bigger servers take more virtual nodes. Consistent hashing is used by DynamoDB, Cassandra, memcached clients, load balancers and CDNs. (Redis Cluster uses a related idea: 16,384 fixed hash slots assigned to nodes.)",
      example: `// minimal consistent hash ring with virtual nodes
public class ConsistentHashRing {
    private final TreeMap<Integer, String> ring = new TreeMap<>();
    private final int virtualNodes;

    public ConsistentHashRing(int virtualNodes) { this.virtualNodes = virtualNodes; }

    public void addServer(String server) {
        for (int i = 0; i < virtualNodes; i++) {
            ring.put(hash(server + "#" + i), server);
        }
    }

    public void removeServer(String server) {
        for (int i = 0; i < virtualNodes; i++) {
            ring.remove(hash(server + "#" + i));
        }
    }

    public String serverFor(String key) {
        Map.Entry<Integer, String> e = ring.ceilingEntry(hash(key));   // first clockwise
        return (e != null ? e : ring.firstEntry()).getValue();         // wrap around
    }

    // String.hashCode() clusters similar strings, so mix the bits (MurmurHash3 finalizer)
    private int hash(String s) {
        int h = s.hashCode();
        h ^= h >>> 16;
        h *= 0x85ebca6b;
        h ^= h >>> 13;
        h *= 0xc2b2ae35;
        h ^= h >>> 16;
        return h & 0x7fffffff;
    }
}`,
      interviewPoints: [
        "Keys and servers on a hash ring.",
        "Adding/removing a server moves only about K/N keys.",
        "Virtual nodes balance the load.",
        "Used by Cassandra, DynamoDB, caches and CDNs.",
      ],
    },
    {
      id: 'cap',
      title: 'CAP theorem and PACELC',
      explanation: "The CAP theorem says that when a network partition happens (nodes cannot talk to each other), a distributed data store must choose between Consistency (every read sees the latest write, or gets an error) and Availability (every request gets a non-error response, possibly stale). Partition tolerance is not optional in real networks, so the real choice is CP or AP during a partition.\n\nCP systems (etcd, ZooKeeper, a relational database with synchronous replicas) refuse some requests rather than return stale data; they suit money, inventory and locks. AP systems (Cassandra, DynamoDB in its default mode, DNS) keep answering and reconcile later; they suit feeds, likes and shopping-cart style data. PACELC extends CAP: if there is a Partition, choose A or C; Else, in normal operation, choose between Latency and Consistency, since synchronous replication costs latency even without failures.",
      example: `Partition between data centre A and B:

CP choice: B rejects writes for account 42 until it can reach A     -> correct but unavailable
AP choice: B accepts the write; A and B reconcile after the partition -> available but may conflict

Pick per feature, not per company:
  account balance, stock level   -> consistency
  product reviews, view counters -> availability`,
      interviewPoints: [
        "During a partition: consistency or availability.",
        "P is not optional in distributed systems.",
        "CP for money and inventory, AP for feeds and counters.",
        "PACELC adds the latency vs consistency trade-off without partitions.",
      ],
    },
    {
      id: 'async-queues',
      title: 'Message queues and asynchronous processing',
      explanation: "Putting a queue or log (Kafka, RabbitMQ, SQS) between services decouples them in time. The front-end service accepts the request, publishes an event and responds quickly; workers process the event at their own pace. This absorbs traffic spikes (the queue buffers them), isolates failures (if the email service is down, orders are still accepted) and lets you add consumers without changing the producer.\n\nThe cost is complexity: the result is eventually consistent, you need idempotent consumers because messages can be delivered more than once, dead-letter queues for poison messages, monitoring of consumer lag, and the transactional outbox pattern to publish events reliably with a database change. Use synchronous calls when the caller needs the answer now, and asynchronous messaging for work that can happen after the response.",
      example: `Synchronous (fragile under load):
  POST /orders -> order-service -> payment -> inventory -> email -> response (2 s)

Asynchronous:
  POST /orders -> order-service: save order + outbox event -> 202 Accepted (50 ms)
                         |
                         v  Kafka topic "orders"
          payment-worker   inventory-worker   email-worker   (scale each independently)`,
      interviewPoints: [
        "Decouples services and absorbs spikes.",
        "Faster responses; work continues in the background.",
        "Needs idempotency, DLQs and lag monitoring.",
        "Outbox pattern for reliable publishing.",
      ],
    },
    {
      id: 'unique-ids',
      title: 'Generating unique IDs at scale',
      explanation: "A single database's auto-increment ID becomes a bottleneck and a single point of failure when data is sharded or created in many services. Options:\n\nUUIDs (v4) can be generated anywhere with no coordination, but they are 128 bits, unordered and fragment B-tree indexes. UUID v7 (time-ordered) fixes the ordering problem and is a good default today. Snowflake-style IDs pack a timestamp, a machine id and a per-machine sequence into 64 bits: they are roughly time-sorted, compact and generated locally at high rates. Ticket servers or database sequences allocated in blocks (for example Hibernate's pooled optimizer) are another option.",
      example: `Snowflake 64-bit ID:
| 1 bit unused | 41 bits ms timestamp | 10 bits machine id | 12 bits sequence |
  ~69 years       1,024 machines        4,096 IDs per ms per machine

long id = ((System.currentTimeMillis() - EPOCH) << 22)
        | (machineId << 12)
        | sequence;

UUID v4:  f47ac10b-58cc-4372-a567-0e02b2c3d479   random, unordered
UUID v7:  0190b4c8-3e5a-7c3b-9f1a-2b4c6d8e0f12   time-ordered prefix`,
      interviewPoints: [
        "Auto-increment does not scale across shards.",
        "UUID v4: simple but unordered; v7 is time-ordered.",
        "Snowflake: 64-bit, time-sorted, locally generated.",
        "Block allocation from a sequence also works.",
      ],
    },
    {
      id: 'rate-limiting-algorithms',
      title: 'Rate limiting algorithms',
      explanation: "Rate limiting protects services from abuse and overload by capping requests per client. The main algorithms: fixed window counters (count requests per minute; simple but allows bursts at window edges), sliding window log or sliding window counter (smoother, more memory or approximation), token bucket (tokens refill at a fixed rate up to a capacity; each request spends one, allowing controlled bursts) and leaky bucket (requests leave a queue at a constant rate, smoothing traffic).\n\nIn a horizontally scaled system, counters must be shared, typically in Redis with an atomic increment and expiry or a Lua script, or enforced at the API gateway. Return HTTP 429 Too Many Requests with a Retry-After header. Bucket4j is a popular Java library for token buckets.",
      example: `// token bucket (single instance)
public class TokenBucket {
    private final long capacity;
    private final double refillPerNano;
    private double tokens;
    private long lastRefill = System.nanoTime();

    public TokenBucket(long capacity, long refillPerSecond) {
        this.capacity = capacity;
        this.refillPerNano = refillPerSecond / 1_000_000_000.0;
        this.tokens = capacity;
    }

    public synchronized boolean tryConsume() {
        long now = System.nanoTime();
        tokens = Math.min(capacity, tokens + (now - lastRefill) * refillPerNano);
        lastRefill = now;
        if (tokens >= 1) {
            tokens -= 1;
            return true;
        }
        return false;        // respond with 429 Too Many Requests
    }
}

// distributed fixed window with Redis:  INCR rate:user42:202609291530  +  EXPIRE 60`,
      interviewPoints: [
        "Fixed window, sliding window, token bucket, leaky bucket.",
        "Token bucket allows controlled bursts.",
        "Shared counters (Redis) or gateway enforcement across instances.",
        "Respond with 429 and Retry-After.",
      ],
    },
    {
      id: 'url-shortener',
      title: 'Putting it together: designing a URL shortener',
      explanation: "Requirements: create a short code for a long URL, redirect quickly, handle about 40 writes and 4,000 reads per second, and stay highly available.\n\nShort code: base62 (a-z, A-Z, 0-9) with 7 characters gives 62^7, about 3.5 trillion codes. Generate them by encoding a unique numeric ID (from a sequence allocated in blocks or a Snowflake generator), which avoids collisions entirely; hashing the URL and truncating needs collision checks. Storage: a simple key-value access pattern (code -> URL), so either PostgreSQL with a primary key on code or a key-value store such as DynamoDB works; about 3 TB over five years.\n\nRead path: stateless redirect service behind a load balancer, Redis cache in front of the database (a small fraction of links gets most traffic, so the hit rate is high), and optionally a CDN. Use 302 if you want to count every click (the browser asks you each time) or 301 to let browsers cache the redirect and reduce load. Click analytics go to Kafka asynchronously so they never slow down redirects.",
      example: `POST /api/urls  {"longUrl": "https://shop.example.com/products/42?ref=summer"}
  1. id = idGenerator.next()            -> 125_000_000_123
  2. code = base62(id)                  -> "2crtgef"
  3. INSERT INTO urls(code, long_url, created_at) VALUES (...)
  4. return {"shortUrl": "https://sho.rt/2crtgef"}

GET /2crtgef
  1. Redis GET url:2crtgef  -> hit? redirect
  2. miss -> SELECT long_url FROM urls WHERE code = '2crtgef' -> cache it
  3. publish ClickEvent to Kafka (async)
  4. 302 Location: https://shop.example.com/products/42?ref=summer

static String base62(long n) {
    String chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    StringBuilder sb = new StringBuilder();
    do {
        sb.append(chars.charAt((int) (n % 62)));
        n /= 62;
    } while (n > 0);
    return sb.reverse().toString();
}`,
      interviewPoints: [
        "Base62 of a unique ID avoids collisions.",
        "Read-heavy: cache + stateless service + load balancer.",
        "301 vs 302 trade-off.",
        "Analytics asynchronously via a queue.",
      ],
    },
  ],

  commonMistakes: [
    "Jumping straight into drawing boxes without clarifying requirements and estimating load.",
    "Designing for massive scale when the numbers show one database would easily cope.",
    "Keeping sessions or uploaded files on the application server, which breaks horizontal scaling.",
    "Adding a cache without a TTL, an invalidation strategy or a plan for stampedes on hot keys.",
    "Forgetting replication lag when reading from replicas right after a write.",
    "Choosing a shard key that creates hotspots or forces most queries to hit every shard.",
    "Using hash(key) % N and then being surprised that adding a node reshuffles almost all data.",
    "Saying a system is \"CA\"; in a distributed system partitions happen, so the choice is CP or AP.",
    "Using asynchronous messaging without idempotent consumers or a dead-letter queue.",
    "Leaving single points of failure, such as one load balancer, one Redis node or one database without a replica.",
  ],

  interviewTips: [
    "Follow a structure out loud: requirements, estimates, API, data model, high-level design, deep dive, trade-offs.",
    "Do the maths: requests per second, read/write ratio and storage decide the architecture.",
    "Explain every component by the problem it solves and what it costs.",
    "Mention failure handling: what happens when the cache, a replica or a whole zone goes down.",
    "Relate choices to the Spring ecosystem you know: Spring Session, Redis, Kafka, Resilience4j, Kubernetes.",
    "It is fine to say \"it depends\" as long as you then explain on what, and pick one.",
  ],

  interviewQuestions: [
    {
      id: 'microservices-system-design-q1',
      question: "What is the difference between vertical and horizontal scaling? Which would you choose?",
      answer: "Vertical scaling means running on a bigger machine with more CPU, memory or faster storage. It needs no code changes, but has a hard upper limit, becomes expensive, and still leaves a single point of failure. Horizontal scaling means adding more machines behind a load balancer. It scales almost indefinitely and tolerates machine failures, but requires stateless application instances and moves the challenge into shared data stores. In practice, application servers are scaled horizontally from the start (it is cheap with containers), while databases are first scaled vertically and with read replicas, and sharded only when that is no longer enough.",
      points: [
        "Vertical: bigger machine, simple, limited.",
        "Horizontal: more machines, resilient, needs statelessness.",
        "App tier horizontal; database vertical then replicas then shards.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-system-design-q2',
      question: "How do you make a Spring Boot application horizontally scalable?",
      answer: "Make every instance stateless so the load balancer can send any request to any instance. Store HTTP sessions in Redis with Spring Session or use stateless JWT authentication. Put uploaded files in object storage such as S3 instead of the local disk. Use a distributed cache (Redis) for shared cached data, or accept that local caches differ per instance and keep TTLs short. Make scheduled jobs run once across the cluster with ShedLock or a Kubernetes CronJob. Externalise configuration with environment variables or ConfigMaps. Size the database connection pool so that instances times pool size stays within the database limit. Then add readiness probes and graceful shutdown so instances can be added and removed without errors.",
      points: [
        "No local state: sessions, files, caches.",
        "Scheduled jobs coordinated across instances.",
        "Connection pool sizing across instances.",
        "Health checks and graceful shutdown.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-system-design-q3',
      question: "What is database sharding and what problems does it introduce?",
      answer: "Sharding splits a large dataset across multiple database servers, each holding a subset of rows chosen by a shard key, for example hash(customer_id). It lets writes and storage scale beyond one server. Problems: queries that do not include the shard key must be sent to every shard and merged; joins and transactions across shards are hard, needing sagas or two-phase commit; a poorly chosen key creates hotspots where one shard gets most of the traffic; re-sharding when adding servers requires moving data, which is why consistent hashing or a fixed number of logical shards is used; and operations such as backups, migrations and unique constraints become more complex. Shard only after indexing, caching, read replicas and vertical scaling are exhausted.",
      points: [
        "Split data by a shard key across servers.",
        "Cross-shard queries, joins and transactions are costly.",
        "Hotspots from bad keys.",
        "Re-sharding moves data; use consistent hashing.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-system-design-q4',
      question: "Explain consistent hashing and why it is useful.",
      answer: "Consistent hashing maps both servers and keys onto the same circular hash space. Each key is assigned to the first server found moving clockwise from the key's hash. When a server is added, it only takes the keys between itself and the previous server on the ring; when a server is removed, only its keys move to the next one. On average only K/N keys are remapped, compared with nearly all keys when using hash(key) % N. To avoid uneven distribution, each physical server is placed on the ring many times as virtual nodes, and more powerful servers can be given more virtual nodes. It is used in distributed caches, Cassandra and DynamoDB partitioning, and load balancers.",
      points: [
        "Keys and servers on a ring.",
        "Only neighbouring keys move when servers change.",
        "Virtual nodes for balance.",
        "Contrast with modulo hashing.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-system-design-q5',
      question: "Explain the CAP theorem with an example.",
      answer: "CAP states that a distributed data store cannot simultaneously guarantee Consistency (every read returns the latest write or an error), Availability (every request receives a non-error response) and Partition tolerance (the system keeps working despite lost messages between nodes). Because network partitions do happen, the practical choice during a partition is between consistency and availability. Example: an inventory database replicated across two regions loses connectivity between them. A CP design rejects orders in one region until the regions reconnect, so stock is never oversold. An AP design keeps accepting orders in both regions and reconciles afterwards, risking overselling. PACELC adds that even without a partition, there is a trade-off between latency and consistency.",
      points: [
        "Consistency vs availability during a partition.",
        "Partitions are unavoidable.",
        "CP for inventory/money, AP for feeds/counters.",
        "PACELC: latency vs consistency otherwise.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-system-design-q6',
      question: "What caching strategies do you know, and what problems can caching cause?",
      answer: "Cache-aside (lazy loading): the application reads from the cache and, on a miss, loads from the database and stores the result; on update it writes the database and evicts the cache key. Read-through: the cache itself loads missing data. Write-through: writes go to the cache and database together, keeping the cache fresh. Write-behind: writes go to the cache and are flushed to the database later, which is fast but risks data loss. Problems: stale data if invalidation is missed, so always set TTLs; cache stampede when a hot key expires and many requests hit the database at once, mitigated by locking, request coalescing or early refresh; cache penetration from requests for keys that do not exist, mitigated by caching empty results or a Bloom filter; and inconsistency between local caches on different instances.",
      points: [
        "Cache-aside, read-through, write-through, write-behind.",
        "Staleness and invalidation, TTLs.",
        "Stampede and penetration.",
        "Local vs distributed cache consistency.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-system-design-q7',
      question: "Your application reads from a replica and users complain that their changes sometimes disappear after saving. Why, and how do you fix it?",
      answer: "This is replication lag. Writes go to the primary and are copied to replicas asynchronously, so for a short time a replica still returns the old data. A user who saves and immediately reloads may be routed to a replica that has not received the change. Fixes: read-your-writes consistency by routing reads for that user (or that entity) to the primary for a few seconds after a write; routing all reads inside the same request that performed the write to the primary; returning the updated data directly in the save response so the client does not need to re-read; monitoring replication lag and removing lagging replicas from the read pool; or using synchronous replication for data where this matters, at the cost of write latency.",
      points: [
        "Asynchronous replication lag.",
        "Read-your-writes via the primary after a write.",
        "Return updated data in the response.",
        "Monitor lag; synchronous replication if critical.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'microservices-system-design-q8',
      question: "How would you design a rate limiter for an API used by many clients across multiple instances?",
      answer: "Identify the client by API key, user id or IP, and choose an algorithm: a token bucket allows short bursts up to a capacity while enforcing an average rate; a sliding window counter gives smoother limits than a fixed window. Because requests for the same client hit different instances, the counters must be shared: store them in Redis and update them atomically, for example with INCR and EXPIRE for a fixed window or a Lua script for a token bucket, or enforce limits in the API gateway (Spring Cloud Gateway's RequestRateLimiter uses Redis). Return 429 Too Many Requests with Retry-After and rate-limit headers. Decide how to fail if Redis is unavailable (usually allow traffic and alert), and consider separate limits per endpoint and per plan.",
      points: [
        "Token bucket or sliding window.",
        "Shared counters in Redis or the gateway.",
        "429 with Retry-After.",
        "Plan for limiter failure.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'microservices-system-design-q9',
      question: "Design a URL shortener. How do you generate short codes, and how do you handle the read load?",
      answer: "Clarify requirements and estimate: say 100 million new links per month (about 40 writes per second) and 100 times more reads (about 4,000 per second, with peaks higher). For codes, take a unique 64-bit ID from a Snowflake-style generator or a database sequence allocated in blocks, and encode it in base62; seven characters give about 3.5 trillion combinations and there are no collisions to check. Hashing the long URL and truncating is an alternative but requires collision handling. Store code to URL in a table with code as the primary key or in a key-value store. The redirect path is read-heavy and skewed, so put stateless redirect services behind a load balancer, cache mappings in Redis with a high hit rate, and optionally cache at a CDN. Return 302 if every click must be tracked or 301 to reduce load. Publish click events to Kafka asynchronously for analytics, and consider expiry, custom aliases and abuse protection with rate limiting.",
      points: [
        "Estimate reads and writes first.",
        "Base62 of a unique ID.",
        "Cache + stateless services for reads.",
        "301 vs 302; async analytics.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
