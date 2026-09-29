const topic = {
  id: 'sql-acid',
  category: 'sql',
  title: 'ACID Properties',
  description: "The four guarantees of reliable transactions, Atomicity, Consistency, Isolation and Durability, explained with bank transfers, plus WAL and ACID vs BASE.",
  difficulty: 'Intermediate',
  overview: "ACID is an acronym for four properties that a database transaction guarantees: Atomicity, Consistency, Isolation and Durability. Together they mean you can trust the database: a transfer either fully happens or does not happen, business rules are never broken, concurrent users do not corrupt each other's work, and once the database says \"committed\", the data survives a crash.\n\nThe classic example is a bank transfer of 500 from Asha's account to Ravi's. Two updates are needed: subtract 500 from Asha, add 500 to Ravi. ACID ensures the money is never lost or created out of thin air, whatever happens in between: a power cut, a bug, or thousands of other transfers running at the same time.\n\nRelational databases such as PostgreSQL are fully ACID. Many distributed NoSQL systems relax some of these guarantees for scale and availability, a model called BASE. Examples use an `accounts(id, owner, balance)` table alongside `employees`, `departments`, `customers` and `orders`.",

  subtopics: [
    {
      id: 'what-is-acid',
      title: 'What is ACID?',
      explanation: "ACID describes what a reliable transaction must provide. Atomicity: all or nothing. Consistency: the database moves from one valid state to another. Isolation: concurrent transactions do not see each other's intermediate states. Durability: committed data is not lost. A transaction is the unit these guarantees apply to.",
      example: `CREATE TABLE accounts (
  id      BIGSERIAL PRIMARY KEY,
  owner   TEXT NOT NULL,
  balance NUMERIC(12, 2) NOT NULL CHECK (balance >= 0)
);

BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 1;  -- Asha
UPDATE accounts SET balance = balance + 500 WHERE id = 2;  -- Ravi
COMMIT;`,
      interviewPoints: [
        "A = all or nothing, C = valid states, I = no interference, D = survives crashes.",
        "ACID applies to transactions, not individual tables.",
      ],
    },
    {
      id: 'atomicity',
      title: 'Atomicity',
      explanation: "Atomicity means a transaction is indivisible: either every statement in it takes effect, or none of them do. If the second update of a transfer fails, or the server crashes before COMMIT, the first update is undone too. You never see Asha debited without Ravi credited.\n\nPostgreSQL achieves this because uncommitted row versions are never visible and are simply ignored after a rollback or crash; the write-ahead log records whether each transaction committed.",
      example: `BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 999;  -- no such account, 0 rows
-- application notices 0 rows updated and cancels
ROLLBACK;   -- Asha's debit is undone as well`,
      interviewPoints: [
        "All or nothing.",
        "Rollback on error or crash undoes partial work.",
        "Spring @Transactional rolls back on unchecked exceptions by default.",
      ],
    },
    {
      id: 'consistency',
      title: 'Consistency',
      explanation: "Consistency means a transaction brings the database from one valid state to another valid state, respecting all rules: constraints (NOT NULL, UNIQUE, CHECK, foreign keys), triggers and cascades. If a transfer would make Asha's balance negative and a `CHECK (balance >= 0)` exists, the statement fails and the transaction cannot commit.\n\nNote that the database only enforces rules it knows about. Business invariants such as \"total money in the bank stays the same\" are the application's job, which it fulfils by writing correct transactions. Consistency in ACID is different from consistency in the CAP theorem, which is about replicas agreeing.",
      example: `-- Asha has 300; this violates CHECK (balance >= 0)
BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
-- ERROR: new row for relation "accounts" violates check constraint
ROLLBACK;

-- foreign keys also protect consistency
INSERT INTO orders (customer_id, amount) VALUES (12345, 10);
-- ERROR: violates foreign key constraint`,
      interviewPoints: [
        "Valid state before and after every transaction.",
        "Enforced by constraints plus correct application logic.",
        "ACID consistency is not CAP consistency.",
      ],
    },
    {
      id: 'isolation',
      title: 'Isolation',
      explanation: "Isolation means concurrent transactions do not interfere with each other; ideally each behaves as if it were running alone. While Asha's transfer is in progress, another session calculating the bank's total balance should not see the money \"in flight\" (debited but not yet credited).\n\nFull isolation (SERIALIZABLE) is expensive, so databases offer weaker isolation levels. PostgreSQL's default, READ COMMITTED, guarantees you never see uncommitted data, but a later statement in your transaction may see data others committed meanwhile. PostgreSQL implements isolation with MVCC snapshots and row locks.",
      example: `-- Session A
BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
-- not yet committed

-- Session B (at the same time)
SELECT balance FROM accounts WHERE id = 1;   -- still sees the OLD balance

-- Session A
UPDATE accounts SET balance = balance + 500 WHERE id = 2;
COMMIT;   -- now B sees both changes on its next statement`,
      interviewPoints: [
        "Concurrent transactions should not see each other's partial work.",
        "Tunable via isolation levels.",
        "PostgreSQL uses MVCC and locks.",
      ],
    },
    {
      id: 'durability',
      title: 'Durability',
      explanation: "Durability means that once COMMIT returns successfully, the change is permanent, even if the server loses power a millisecond later. The database achieves this by writing the change to the write-ahead log and flushing it to disk (fsync) before confirming the commit. After a crash, it replays the log to restore committed work.\n\nDurability can be traded for speed: setting `synchronous_commit = off` in PostgreSQL returns from COMMIT before the flush, risking the last few hundred milliseconds of commits on a crash, but never corrupting data. Replication to another server adds protection against losing the whole machine.",
      example: `-- default: wait for WAL flush before COMMIT returns
SHOW synchronous_commit;   -- on

-- relax durability for a low-value, high-volume session
SET synchronous_commit = off;
INSERT INTO page_views (url, viewed_at) VALUES ('/home', now());`,
      interviewPoints: [
        "Committed = permanent.",
        "Implemented by flushing the WAL to disk before acknowledging commit.",
        "synchronous_commit trades durability for latency.",
      ],
    },
    {
      id: 'wal',
      title: 'Write-Ahead Log (WAL)',
      explanation: "The write-ahead log is an append-only file of every change made to the database. The rule is simple: log first, data files later. Before a modified data page is written to disk, the log record describing the change must already be on disk. On commit, only the WAL needs flushing, which is a fast sequential write; the actual table and index pages are written lazily in the background and at checkpoints.\n\nAfter a crash, PostgreSQL starts from the last checkpoint and replays WAL records to bring data files up to date (redo). The WAL is also the foundation of streaming replication and point-in-time recovery (PITR).",
      example: `-- current WAL position
SELECT pg_current_wal_lsn();

-- force a checkpoint (data pages flushed, older WAL can be recycled)
CHECKPOINT;

-- relevant settings
SHOW wal_level;          -- replica
SHOW checkpoint_timeout; -- 5min`,
      interviewPoints: [
        "Log before data: WAL record must hit disk before the data page.",
        "Commit = sequential WAL flush, cheap compared to random page writes.",
        "Crash recovery replays WAL from the last checkpoint.",
        "Also powers replication and PITR.",
      ],
    },
    {
      id: 'acid-vs-base',
      title: 'ACID vs BASE',
      explanation: "BASE stands for Basically Available, Soft state, Eventually consistent. It describes many distributed NoSQL systems (Cassandra, DynamoDB by default, many caches) that prefer staying available and fast across many servers over strict, immediate consistency. Data written on one node may take a moment to appear on others, and the system converges to a consistent state eventually.\n\nACID fits money, orders, inventory and anything where a wrong or stale answer is unacceptable. BASE fits social feeds, analytics, shopping-cart counters and huge-scale workloads where a short delay is fine. In microservices, where one transaction cannot span several databases, teams often use patterns like Saga and the outbox pattern to get eventual consistency between services.",
      example: `-- ACID (PostgreSQL): both rows change together or not at all
BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;
COMMIT;

-- BASE-style, across services (conceptual):
-- 1. Payment service debits and writes an event to its outbox table
-- 2. Event is published to Kafka
-- 3. Wallet service consumes it and credits later (eventually consistent)`,
      interviewPoints: [
        "ACID: strong consistency, pessimistic about failure.",
        "BASE: availability and scale, eventual consistency.",
        "CAP theorem: during a network partition, choose consistency or availability.",
        "Sagas and outbox pattern give eventual consistency in microservices.",
      ],
    },
  ],

  commonMistakes: [
    "Thinking Consistency means replicas agree (that is CAP consistency, not ACID consistency).",
    "Assuming the database guarantees business rules it was never told about; add constraints for invariants you rely on.",
    "Believing each statement inside a Spring service method is atomic together without `@Transactional` on a public method called through the proxy.",
    "Assuming checked exceptions roll back a Spring transaction; by default only unchecked exceptions and errors do.",
    "Turning off fsync (not just synchronous_commit) for speed, which can corrupt the database after a crash.",
    "Expecting ACID guarantees across two different databases or microservices without a distributed transaction or saga.",
  ],

  interviewTips: [
    "Explain each letter with the same bank-transfer example; it keeps the answer coherent and memorable.",
    "Give the mechanism behind each property: rollback/undo for A, constraints for C, MVCC and locks for I, WAL and fsync for D.",
    "Mention that isolation is tunable and PostgreSQL defaults to READ COMMITTED.",
    "When asked about NoSQL or microservices, contrast ACID with BASE and mention eventual consistency and sagas.",
  ],

  interviewQuestions: [
    {
      id: 'sql-acid-q1',
      question: "What does ACID stand for? Explain each property.",
      answer: "Atomicity: a transaction is all or nothing; if any part fails, everything is rolled back. Consistency: a transaction moves the database from one valid state to another, never violating constraints. Isolation: concurrent transactions do not see each other's uncommitted, intermediate work, as if they ran one after another (to the degree the isolation level allows). Durability: once committed, changes survive crashes and power loss.",
      points: [
        "Atomicity = all or nothing.",
        "Consistency = rules always hold.",
        "Isolation = no interference.",
        "Durability = committed data persists.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-acid-q2',
      question: "Explain atomicity using a bank transfer example.",
      answer: "Transferring 500 from account 1 to account 2 needs two updates: debit account 1 and credit account 2. Atomicity guarantees they happen together. If the credit fails, for example because the target account does not exist or the server crashes, the debit is rolled back too, so money is never lost or duplicated.",
      example: `BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;
COMMIT;
-- any failure before COMMIT leaves both balances unchanged`,
      points: [
        "Both updates or neither.",
        "Crash before COMMIT is treated as rollback.",
        "In Spring: annotate the transfer method with @Transactional.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-acid-q3',
      question: "What does Consistency mean in ACID, and how is it enforced?",
      answer: "Consistency means every committed transaction leaves the database in a valid state that satisfies all defined rules. The database enforces declared rules: primary keys, foreign keys, UNIQUE, NOT NULL, CHECK constraints and triggers. If a statement would break one, it fails and the transaction cannot commit. Rules the database does not know about, such as \"the sum of all balances must stay the same during a transfer\", are the application's responsibility, achieved by writing correct transactions.",
      example: `ALTER TABLE accounts ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);`,
      points: [
        "Valid state to valid state.",
        "Constraints are the database's part.",
        "Correct transaction logic is the application's part.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-acid-q4',
      question: "How does a database guarantee durability?",
      answer: "Before confirming a COMMIT, the database writes a record of the changes to the write-ahead log (WAL) and forces it to disk with fsync. Data pages themselves can be written later. If the server crashes, on restart it replays the WAL from the last checkpoint and restores every committed change. For protection against losing the whole machine, WAL is also streamed to replicas, optionally synchronously, and archived for point-in-time recovery.",
      points: [
        "WAL flushed to disk before commit is acknowledged.",
        "Crash recovery replays WAL.",
        "Replication and backups protect against hardware loss.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-acid-q5',
      question: "What is the Write-Ahead Log and why is it fast?",
      answer: "The WAL is an append-only log of every change. The write-ahead rule says a change must be recorded in the log on disk before the modified data page is written. It is fast because committing only requires a sequential append and flush of a small log record, instead of random writes to every table and index page touched. Many commits can share one flush (group commit). The dirty data pages are written in the background and at checkpoints.",
      example: `SELECT pg_current_wal_lsn();          -- current log position
SELECT * FROM pg_stat_wal;             -- WAL statistics (PostgreSQL 14+)`,
      points: [
        "Log first, data later.",
        "Sequential I/O is cheap.",
        "Checkpoints bound recovery time.",
        "Basis for replication and PITR.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-acid-q6',
      question: "Which mechanisms does PostgreSQL use to implement each ACID property?",
      answer: "Atomicity: changes from a transaction are only visible once its commit record is in the WAL; aborted transactions' row versions are simply ignored and later vacuumed. Consistency: constraints, foreign keys and triggers are checked on each statement (or at commit for deferred constraints). Isolation: MVCC snapshots decide which row versions each transaction sees, row-level locks serialise writers to the same row, and SSI provides SERIALIZABLE. Durability: the WAL is flushed to disk on commit, and crash recovery replays it.",
      points: [
        "A: commit status in WAL / commit log, no in-place overwrite.",
        "C: constraints and triggers.",
        "I: MVCC + locks + SSI.",
        "D: WAL + fsync.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-acid-q7',
      question: "What is BASE and how does it compare to ACID?",
      answer: "BASE means Basically Available, Soft state, Eventually consistent. It describes distributed systems that stay available and scale horizontally by allowing replicas to be temporarily out of sync; given no new writes, all copies eventually converge. ACID prioritises correctness and immediate consistency, typically within one database node or cluster.\n\nChoose ACID for financial data, orders and inventory, where stale or partial results are unacceptable. BASE fits high-volume, globally distributed data such as feeds, likes, logs and caches, where a short delay is acceptable in exchange for availability and scale.",
      points: [
        "ACID: strong consistency.",
        "BASE: availability, eventual consistency.",
        "Trade-off explained by the CAP theorem.",
        "Many systems mix both.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-acid-q8',
      question: "Can you have ACID transactions across multiple microservices? What are the alternatives?",
      answer: "Not easily. Each microservice owns its own database, and one local transaction cannot span them. Two-phase commit (2PC, via XA) can coordinate several resources, but it is slow, blocks when the coordinator fails and is poorly supported by modern brokers and cloud databases, so it is rarely used.\n\nThe common alternative is the Saga pattern: a sequence of local ACID transactions, each publishing an event, with compensating transactions to undo earlier steps if a later one fails (for example, refund the payment if stock reservation fails). The transactional outbox pattern ensures the database change and the event are recorded atomically, by writing the event to an outbox table in the same local transaction and relaying it to Kafka afterwards.",
      example: `-- outbox pattern: one local ACID transaction
BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
INSERT INTO outbox (aggregate_id, event_type, payload)
VALUES (1, 'MoneyDebited', '{"amount": 500, "to": 2}');
COMMIT;
-- a relay later publishes outbox rows to Kafka`,
      points: [
        "Local transactions are ACID; cross-service ones are not.",
        "2PC exists but hurts availability.",
        "Saga with compensating actions.",
        "Outbox pattern keeps DB change and event atomic.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-acid-q9',
      question: "What happens to durability if you set synchronous_commit = off or fsync = off in PostgreSQL?",
      answer: "With `synchronous_commit = off`, COMMIT returns before the WAL is flushed; the WAL writer flushes it shortly after (within about three times `wal_writer_delay`). A crash can lose the most recent commits, but the database stays consistent and uncorrupted, so it is a reasonable trade-off for low-value data and can be set per session or transaction.\n\nWith `fsync = off`, PostgreSQL never forces data to disk at all. A crash or power loss can leave the database corrupted and unrecoverable. It should only be used for throwaway data, such as loading a test database.",
      example: `BEGIN;
SET LOCAL synchronous_commit = off;   -- only this transaction
INSERT INTO audit_log (message) VALUES ('user viewed page');
COMMIT;`,
      points: [
        "synchronous_commit off: may lose recent commits, no corruption.",
        "fsync off: risk of corruption, never in production.",
        "Can be tuned per transaction with SET LOCAL.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
