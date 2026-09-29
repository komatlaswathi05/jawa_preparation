const topic = {
  id: 'sql-transactions',
  category: 'sql',
  title: 'Transactions, Isolation & Locks',
  description: "Group statements into all-or-nothing units, choose isolation levels, avoid read anomalies and lost updates, and understand locks, deadlocks and MVCC.",
  difficulty: 'Advanced',
  overview: "A transaction is a group of SQL statements that the database treats as one unit of work: either all of them take effect (COMMIT) or none of them do (ROLLBACK). Transferring money is the classic example. Subtracting from one account and adding to another must happen together; a crash in between must not lose the money.\n\nWhen many users run transactions at the same time, they can interfere with each other: one might read another's half-finished work, or two might overwrite each other's changes. Isolation levels and locks are how the database controls this interference. Stronger isolation means fewer surprises but more waiting or more retries.\n\nPostgreSQL uses MVCC (Multi-Version Concurrency Control), which keeps several versions of a row so that readers never block writers and writers never block readers. In Spring Boot, `@Transactional` starts and commits these database transactions for you, so understanding what happens underneath is essential. Examples use `employees`, `departments`, `customers`, `orders` and an `accounts(id, owner, balance)` table.",

  subtopics: [
    {
      id: 'begin-commit-rollback',
      title: 'BEGIN, COMMIT & ROLLBACK',
      explanation: "`BEGIN` (or `START TRANSACTION`) opens a transaction. `COMMIT` makes all its changes permanent and visible to others. `ROLLBACK` undoes every change made since BEGIN. If you do not start a transaction explicitly, PostgreSQL runs each statement in its own transaction and commits it automatically (autocommit mode).\n\nIn PostgreSQL, after any error inside a transaction, the transaction is aborted and every following statement fails until you ROLLBACK.",
      example: `BEGIN;

UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;

COMMIT;     -- or ROLLBACK; to undo both updates`,
      interviewPoints: [
        "Autocommit: each statement is its own transaction.",
        "After an error, PostgreSQL requires ROLLBACK (current transaction is aborted).",
        "Spring's @Transactional wraps a method in BEGIN/COMMIT, rolling back on RuntimeException by default.",
      ],
    },
    {
      id: 'savepoints',
      title: 'Savepoints',
      explanation: "A savepoint is a named marker inside a transaction. `ROLLBACK TO SAVEPOINT name` undoes only the work done after that marker, while keeping earlier work and leaving the transaction open. It is useful for optional steps that may fail without aborting everything. `RELEASE SAVEPOINT` discards the marker. Spring uses savepoints to implement `Propagation.NESTED`.",
      example: `BEGIN;
INSERT INTO orders (customer_id, amount) VALUES (1, 100);

SAVEPOINT before_bonus;
INSERT INTO loyalty_points (customer_id, points) VALUES (1, 10);
-- something went wrong with the optional step
ROLLBACK TO SAVEPOINT before_bonus;

COMMIT;   -- the order is saved, the points are not`,
      interviewPoints: [
        "Partial rollback inside a transaction.",
        "Recovers from an error without aborting the whole transaction.",
        "Basis of Spring's NESTED propagation.",
      ],
    },
    {
      id: 'read-anomalies',
      title: 'Dirty, non-repeatable and phantom reads',
      explanation: "A dirty read happens when a transaction reads data another transaction has changed but not yet committed; if that other transaction rolls back, you read data that never existed. A non-repeatable read happens when you read the same row twice and get different values because someone committed an update in between. A phantom read happens when you run the same query with a condition twice and get a different set of rows because someone inserted or deleted matching rows.\n\nThere is also serialization anomaly (write skew): the combined result of concurrent transactions could not have happened in any one-at-a-time order.",
      example: `-- Non-repeatable read (READ COMMITTED)
-- T1: BEGIN; SELECT salary FROM employees WHERE id = 1;   -- 50000
-- T2: UPDATE employees SET salary = 60000 WHERE id = 1; COMMIT;
-- T1: SELECT salary FROM employees WHERE id = 1;          -- 60000 (changed!)

-- Phantom read (READ COMMITTED)
-- T1: SELECT COUNT(*) FROM employees WHERE department_id = 2;  -- 5
-- T2: INSERT INTO employees (..., department_id) VALUES (..., 2); COMMIT;
-- T1: SELECT COUNT(*) FROM employees WHERE department_id = 2;  -- 6`,
      interviewPoints: [
        "Dirty read: uncommitted data.",
        "Non-repeatable read: same row, different value.",
        "Phantom read: same query, different set of rows.",
      ],
    },
    {
      id: 'isolation-levels',
      title: 'Isolation levels',
      explanation: "The SQL standard defines four isolation levels. READ UNCOMMITTED may allow dirty reads. READ COMMITTED prevents dirty reads; each statement sees data committed before that statement began. REPEATABLE READ also prevents non-repeatable reads. SERIALIZABLE prevents all anomalies: the result equals some serial order.\n\nPostgreSQL specifics: READ COMMITTED is the default. READ UNCOMMITTED behaves exactly like READ COMMITTED, so dirty reads never happen. REPEATABLE READ is implemented as snapshot isolation: the whole transaction sees one snapshot, which also prevents phantom reads. SERIALIZABLE uses Serializable Snapshot Isolation (SSI) and aborts transactions with a serialization failure (SQLSTATE 40001) that the application must retry.",
      example: `BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT SUM(balance) FROM accounts;
-- ... other work; the snapshot stays the same
SELECT SUM(balance) FROM accounts;   -- same result as before
COMMIT;

-- change default for the session
SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL SERIALIZABLE;`,
      interviewPoints: [
        "PostgreSQL default: READ COMMITTED (MySQL InnoDB default: REPEATABLE READ).",
        "PostgreSQL never allows dirty reads.",
        "REPEATABLE READ in PostgreSQL also blocks phantoms.",
        "SERIALIZABLE may throw 40001 errors; retry the transaction.",
      ],
    },
    {
      id: 'isolation-matrix',
      title: 'Isolation level vs anomaly table',
      explanation: "This is the table interviewers expect, per the SQL standard, with PostgreSQL's stricter behaviour in comments. Remember it as: each level up removes one more anomaly.",
      example: `-- Level              Dirty   Non-repeatable  Phantom   Serialization anomaly
-- READ UNCOMMITTED   Yes*    Yes             Yes       Yes
-- READ COMMITTED     No      Yes             Yes       Yes
-- REPEATABLE READ    No      No              Yes*      Yes
-- SERIALIZABLE       No      No              No        No
--
-- * PostgreSQL: dirty reads never happen, and phantoms are not
--   possible at REPEATABLE READ.`,
      interviewPoints: [
        "Higher isolation = fewer anomalies, more blocking or retries.",
        "Standard says 'may occur'; databases can be stricter.",
      ],
    },
    {
      id: 'lost-update',
      title: 'Lost update',
      explanation: "A lost update happens when two transactions read the same value, both compute a new value from it, and both write back; the second write silently overwrites the first. For example, two requests read stock = 10, each subtracts 1, and both write 9 instead of 8.\n\nFixes: do the calculation in a single atomic UPDATE (`SET stock = stock - 1`), lock the row first with `SELECT ... FOR UPDATE` (pessimistic locking), use a version column and check it on update (optimistic locking, what JPA's `@Version` does), or use REPEATABLE READ/SERIALIZABLE in PostgreSQL, where the second writer fails and must retry.",
      example: `-- Atomic update: safe
UPDATE products SET stock = stock - 1 WHERE id = 7 AND stock > 0;

-- Optimistic locking with a version column
UPDATE products
SET stock = 9, version = version + 1
WHERE id = 7 AND version = 3;
-- 0 rows updated means someone else changed it: reload and retry`,
      interviewPoints: [
        "Read-modify-write in application code causes lost updates.",
        "Atomic UPDATE, FOR UPDATE, or version checks prevent it.",
        "JPA @Version implements optimistic locking.",
      ],
    },
    {
      id: 'row-locks-for-update',
      title: 'Row locks and SELECT ... FOR UPDATE',
      explanation: "UPDATE and DELETE automatically take a row-level lock on the rows they modify; other writers to the same rows wait until the transaction ends. `SELECT ... FOR UPDATE` takes the same exclusive row lock while reading, so you can read, decide and write safely (pessimistic locking). Plain SELECTs are not blocked by these locks thanks to MVCC.\n\nVariants: `FOR SHARE` (others can read-lock but not modify), `FOR NO KEY UPDATE` (weaker, what UPDATE usually takes), `NOWAIT` (fail immediately instead of waiting) and `SKIP LOCKED` (skip rows that are already locked, perfect for job queues).",
      example: `BEGIN;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;   -- lock the row
-- application checks balance >= 500
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
COMMIT;                                                 -- lock released

-- job queue: each worker grabs a different job
BEGIN;
SELECT id FROM jobs
WHERE status = 'PENDING'
ORDER BY id
LIMIT 1
FOR UPDATE SKIP LOCKED;
-- process, then UPDATE jobs SET status = 'DONE' ...
COMMIT;`,
      interviewPoints: [
        "Row locks are held until COMMIT or ROLLBACK.",
        "FOR UPDATE = pessimistic locking; JPA: @Lock(PESSIMISTIC_WRITE).",
        "SKIP LOCKED for queues, NOWAIT to fail fast.",
        "Readers are not blocked by row locks in PostgreSQL.",
      ],
    },
    {
      id: 'table-locks',
      title: 'Table-level locks',
      explanation: "PostgreSQL also takes table-level locks. Normal DML takes weak locks that do not conflict with each other. DDL such as `ALTER TABLE` or `DROP TABLE` takes an ACCESS EXCLUSIVE lock, which blocks even reads, and while it waits, it also blocks new queries queued behind it. That is why migrations on busy tables should use `lock_timeout` and online-friendly commands like `CREATE INDEX CONCURRENTLY`.",
      example: `SET lock_timeout = '5s';
ALTER TABLE orders ADD COLUMN note TEXT;   -- fails after 5s instead of blocking everyone

-- explicit table lock (rarely needed)
LOCK TABLE accounts IN SHARE ROW EXCLUSIVE MODE;`,
      interviewPoints: [
        "ALTER TABLE usually needs ACCESS EXCLUSIVE.",
        "Set lock_timeout for migrations.",
        "Inspect locks with pg_locks and pg_stat_activity.",
      ],
    },
    {
      id: 'deadlocks',
      title: 'Deadlocks',
      explanation: "A deadlock occurs when two transactions each hold a lock the other needs, so both wait forever. For example, T1 locks account 1 then wants account 2, while T2 locks account 2 then wants account 1. PostgreSQL detects this after `deadlock_timeout` (1 second by default), aborts one transaction with a \"deadlock detected\" error, and lets the other continue.\n\nPrevention: always lock rows in a consistent order (for example, by ascending id), keep transactions short, lock everything you need up front, and retry transactions that fail with a deadlock error.",
      example: `-- T1                                         -- T2
-- BEGIN;                                      BEGIN;
-- UPDATE accounts ... WHERE id = 1;           UPDATE accounts ... WHERE id = 2;
-- UPDATE accounts ... WHERE id = 2; (waits)   UPDATE accounts ... WHERE id = 1; (deadlock!)

-- Prevention: lock both rows in id order
BEGIN;
SELECT id FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE;
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;
COMMIT;`,
      interviewPoints: [
        "Circular wait on locks.",
        "PostgreSQL detects it and aborts one victim (SQLSTATE 40P01).",
        "Consistent lock order is the main prevention.",
        "Application should retry the aborted transaction.",
      ],
    },
    {
      id: 'mvcc',
      title: 'MVCC in PostgreSQL',
      explanation: "MVCC (Multi-Version Concurrency Control) means an UPDATE does not overwrite a row in place. It creates a new row version and marks the old one as expired. Each row version carries `xmin` (the transaction that created it) and `xmax` (the one that deleted or replaced it). Each transaction reads using a snapshot that decides which versions are visible to it.\n\nThe result: readers never block writers and writers never block readers; only writers to the same row wait for each other. The cost is dead row versions that pile up, which VACUUM (usually autovacuum) cleans so the space can be reused. Long-running transactions prevent cleanup and cause table bloat.",
      example: `-- see the hidden version columns
SELECT xmin, xmax, id, balance FROM accounts WHERE id = 1;

UPDATE accounts SET balance = balance + 1 WHERE id = 1;

SELECT xmin, xmax, id, balance FROM accounts WHERE id = 1;  -- new xmin

-- dead tuples and vacuum status
SELECT relname, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
WHERE relname = 'accounts';`,
      interviewPoints: [
        "UPDATE = insert new version + expire old one.",
        "Snapshots decide visibility.",
        "Readers and writers do not block each other.",
        "VACUUM removes dead versions; long transactions cause bloat.",
      ],
    },
  ],

  commonMistakes: [
    "Reading a value, changing it in Java and writing it back without locking or versioning, causing lost updates.",
    "Keeping transactions open while calling slow external services, which holds locks and blocks other users.",
    "Locking rows in a different order in different code paths, which leads to deadlocks.",
    "Using SERIALIZABLE without retry logic, so serialization failures surface as user errors.",
    "Assuming PostgreSQL's READ UNCOMMITTED allows dirty reads; it behaves like READ COMMITTED.",
    "Continuing to run statements after an error inside a PostgreSQL transaction instead of rolling back.",
    "Leaving idle-in-transaction sessions open, which blocks VACUUM and causes bloat.",
  ],

  interviewTips: [
    "Use the bank-transfer example for transactions and the stock-counter example for lost updates; both are instantly understood.",
    "Draw two transaction timelines side by side when explaining anomalies or deadlocks.",
    "Memorise the isolation-level vs anomaly table and then add PostgreSQL's differences; it shows depth.",
    "Connect to Spring: `@Transactional(isolation = ...)`, `@Version` for optimistic locking and `@Lock(LockModeType.PESSIMISTIC_WRITE)` for FOR UPDATE.",
    "When asked how to handle concurrency, compare optimistic (version check, retry) and pessimistic (FOR UPDATE, wait) locking and say when each fits.",
  ],

  interviewQuestions: [
    {
      id: 'sql-transactions-q1',
      question: "What is a database transaction?",
      answer: "A transaction is a sequence of one or more SQL statements executed as a single unit of work. Either all its changes are committed together or, if anything fails, all are rolled back, so the database never ends up half-updated. Transactions are started with BEGIN, finished with COMMIT, or cancelled with ROLLBACK, and they provide the ACID guarantees.",
      example: `BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;`,
      points: [
        "All or nothing.",
        "BEGIN / COMMIT / ROLLBACK.",
        "Autocommit wraps each single statement in its own transaction.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-transactions-q2',
      question: "What is a savepoint and when would you use it?",
      answer: "A savepoint marks a point inside a transaction that you can roll back to without abandoning the whole transaction. It is useful when a later, optional step might fail: you roll back to the savepoint, maybe try an alternative, and still commit the earlier work. In PostgreSQL it is also the way to recover from an error within a transaction without restarting it.",
      example: `BEGIN;
INSERT INTO customers (name, email) VALUES ('Ravi', 'ravi@example.com');
SAVEPOINT sp1;
INSERT INTO customers (name, email) VALUES ('Dup', 'ravi@example.com'); -- unique violation
ROLLBACK TO SAVEPOINT sp1;
COMMIT;  -- Ravi is saved`,
      points: [
        "Partial rollback.",
        "Transaction stays open.",
        "Spring NESTED propagation uses savepoints.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-transactions-q3',
      question: "Explain dirty reads, non-repeatable reads and phantom reads.",
      answer: "A dirty read is reading data changed by another transaction that has not committed yet; if it rolls back you used data that never existed. A non-repeatable read is reading the same row twice in one transaction and getting different values because another transaction updated and committed it in between. A phantom read is running the same filtered query twice and getting a different set of rows because another transaction inserted or deleted matching rows.",
      points: [
        "Dirty: uncommitted data.",
        "Non-repeatable: a row's value changed.",
        "Phantom: the set of rows changed.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-transactions-q4',
      question: "What are the four isolation levels and which anomalies does each prevent?",
      answer: "READ UNCOMMITTED allows dirty, non-repeatable and phantom reads. READ COMMITTED prevents dirty reads. REPEATABLE READ additionally prevents non-repeatable reads (the standard still allows phantoms). SERIALIZABLE prevents all anomalies, making concurrent transactions behave as if they ran one after another.\n\nIn PostgreSQL the default is READ COMMITTED, READ UNCOMMITTED is treated as READ COMMITTED, and REPEATABLE READ also prevents phantoms because it reads from a single snapshot.",
      example: `BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- ...
COMMIT;`,
      points: [
        "Each level removes one more anomaly.",
        "PostgreSQL default: READ COMMITTED.",
        "Higher isolation costs throughput or causes retries.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-transactions-q5',
      question: "What is a lost update and how do you prevent it?",
      answer: "A lost update occurs when two transactions read the same row, both modify the value in application code, and both write it back; the later write overwrites the earlier one, so one change is lost. Prevent it with an atomic UPDATE that computes the new value in SQL, with pessimistic locking (`SELECT ... FOR UPDATE` before reading), or with optimistic locking (a version column checked in the WHERE clause, as JPA's `@Version` does, retrying when zero rows are updated). In PostgreSQL, REPEATABLE READ or SERIALIZABLE also detect it and fail the second transaction.",
      example: `-- Pessimistic
BEGIN;
SELECT stock FROM products WHERE id = 7 FOR UPDATE;
UPDATE products SET stock = stock - 1 WHERE id = 7;
COMMIT;

-- Optimistic
UPDATE products SET stock = 9, version = 4
WHERE id = 7 AND version = 3;   -- 0 rows = conflict`,
      points: [
        "Caused by read-modify-write.",
        "Atomic SQL update is simplest.",
        "Optimistic: version check + retry.",
        "Pessimistic: FOR UPDATE row lock.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-transactions-q6',
      question: "What does SELECT ... FOR UPDATE do? What are NOWAIT and SKIP LOCKED?",
      answer: "`SELECT ... FOR UPDATE` reads rows and locks them exclusively until the transaction ends, so no other transaction can update, delete or lock them for update in the meantime; they wait instead. Normal SELECTs still read without blocking. `NOWAIT` makes the statement fail immediately if a row is already locked. `SKIP LOCKED` silently skips locked rows, which lets several workers pull different jobs from the same queue table without blocking each other.",
      example: `BEGIN;
SELECT id, payload FROM jobs
WHERE status = 'PENDING'
ORDER BY created_at
LIMIT 10
FOR UPDATE SKIP LOCKED;
-- process jobs, mark them DONE
COMMIT;`,
      points: [
        "Pessimistic row lock held until commit.",
        "NOWAIT: fail fast.",
        "SKIP LOCKED: queue processing.",
        "JPA: @Lock(LockModeType.PESSIMISTIC_WRITE).",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-transactions-q7',
      question: "What is a deadlock and how do you prevent it?",
      answer: "A deadlock is a circular wait: transaction A holds a lock that B needs while B holds a lock that A needs, so neither can proceed. PostgreSQL detects this automatically and aborts one of the transactions with a deadlock error so the other can finish.\n\nPrevent deadlocks by acquiring locks in a consistent order across the codebase (for example, always update accounts in ascending id order), keeping transactions short, locking required rows up front with a single `SELECT ... FOR UPDATE`, and retrying a transaction that was chosen as the deadlock victim.",
      example: `-- always lock the lower id first
BEGIN;
SELECT * FROM accounts WHERE id IN (5, 9) ORDER BY id FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE id = 9;
UPDATE accounts SET balance = balance + 100 WHERE id = 5;
COMMIT;`,
      points: [
        "Circular lock wait.",
        "Database picks a victim and aborts it.",
        "Consistent ordering and short transactions.",
        "Retry on deadlock errors.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-transactions-q8',
      question: "What is MVCC and how does PostgreSQL implement it?",
      answer: "MVCC (Multi-Version Concurrency Control) lets many transactions work concurrently by keeping multiple versions of each row. In PostgreSQL an UPDATE writes a new row version and marks the old version as expired; each version records `xmin` (creating transaction id) and `xmax` (deleting transaction id). Every statement (READ COMMITTED) or transaction (REPEATABLE READ and above) takes a snapshot, and only versions committed before that snapshot are visible.\n\nBecause of this, readers never block writers and writers never block readers. Old versions become dead tuples that VACUUM (autovacuum) reclaims. Long-running or idle-in-transaction sessions keep old snapshots alive, block cleanup and cause bloat.",
      points: [
        "New row version on every update.",
        "Visibility decided by xmin/xmax and snapshots.",
        "No read/write blocking.",
        "VACUUM cleans dead tuples.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-transactions-q9',
      question: "How do REPEATABLE READ and SERIALIZABLE behave in PostgreSQL when there is a conflict?",
      answer: "Both use a snapshot taken at the first statement of the transaction. At REPEATABLE READ, if you try to update or lock a row that another transaction modified and committed after your snapshot, PostgreSQL raises \"could not serialize access due to concurrent update\" instead of silently overwriting. SERIALIZABLE (Serializable Snapshot Isolation) goes further: it tracks read/write dependencies between transactions and aborts one if their combination could not occur in any serial order, catching anomalies like write skew. Both errors use SQLSTATE 40001 and the application must retry the whole transaction.",
      example: `-- Write skew prevented only by SERIALIZABLE:
-- rule: at least one doctor must stay on call
-- T1: SELECT COUNT(*) FROM doctors WHERE on_call;  -- 2
-- T2: SELECT COUNT(*) FROM doctors WHERE on_call;  -- 2
-- T1: UPDATE doctors SET on_call = false WHERE id = 1; COMMIT;
-- T2: UPDATE doctors SET on_call = false WHERE id = 2; COMMIT;
-- REPEATABLE READ: both commit, nobody on call.
-- SERIALIZABLE: one transaction fails with 40001.`,
      points: [
        "Snapshot per transaction.",
        "Concurrent update conflicts raise 40001.",
        "SERIALIZABLE also catches write skew.",
        "Always implement retries (Spring Retry or a loop).",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-transactions-q10',
      question: "Optimistic vs pessimistic locking: what is the difference and when do you use each?",
      answer: "Pessimistic locking assumes conflicts are likely, so it locks rows before changing them (`SELECT ... FOR UPDATE`); other writers wait. It is simple and safe when contention is high and the transaction is short, but it reduces concurrency and risks deadlocks.\n\nOptimistic locking assumes conflicts are rare. It does not lock; instead each row has a version number, and an update succeeds only if the version is unchanged (`WHERE id = ? AND version = ?`). If zero rows are updated, someone else won, and the application reloads and retries or reports a conflict. It scales well for read-heavy data and long user think-time (such as edit forms), and is what JPA's `@Version` provides, throwing `OptimisticLockException`.",
      example: `-- optimistic
UPDATE employees
SET salary = 80000, version = version + 1
WHERE id = 12 AND version = 5;

-- pessimistic
BEGIN;
SELECT * FROM employees WHERE id = 12 FOR UPDATE;
UPDATE employees SET salary = 80000 WHERE id = 12;
COMMIT;`,
      points: [
        "Pessimistic: lock first, others wait.",
        "Optimistic: version check, retry on conflict.",
        "High contention favours pessimistic; low contention favours optimistic.",
        "JPA: @Version vs @Lock(PESSIMISTIC_WRITE).",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-transactions-q11',
      question: "Why are long-running transactions harmful, especially in a Spring Boot application?",
      answer: "A long transaction holds its row locks until it ends, so other requests that touch the same rows queue up, raising latency and the chance of deadlocks. It also keeps a database connection checked out from the pool (HikariCP), so under load the pool runs dry. In PostgreSQL an old snapshot stops VACUUM from removing dead row versions, causing table and index bloat.\n\nIn Spring Boot this often happens when a `@Transactional` method calls a slow external API, sends email or waits on user input. Keep transactions short: do remote calls outside the transaction, fetch only what you need, and set `idle_in_transaction_session_timeout` and statement timeouts as safety nets.",
      example: `-- find long or idle transactions
SELECT pid, state, now() - xact_start AS duration, query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY duration DESC;

ALTER DATABASE shop SET idle_in_transaction_session_timeout = '60s';`,
      points: [
        "Locks held longer, more blocking.",
        "Connection pool exhaustion.",
        "Blocks VACUUM, causes bloat.",
        "Never make remote calls inside a DB transaction.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
