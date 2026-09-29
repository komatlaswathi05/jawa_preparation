const topic = {
  id: 'sql-views-procedures',
  category: 'sql',
  title: 'Views, Stored Procedures & Triggers',
  description: "Save queries as views and materialized views, write functions and stored procedures in PL/pgSQL, react to changes with triggers, and call them from Spring.",
  difficulty: 'Intermediate',
  overview: "Databases can store more than data. A view is a saved query that you can select from like a table. A materialized view is a saved query whose result is also stored on disk and refreshed when you ask. Functions and stored procedures are programs that run inside the database, and triggers are functions the database runs automatically when rows are inserted, updated or deleted.\n\nThink of a view as a window onto your tables: it shows a particular arrangement of the data but holds nothing itself. A materialized view is a photograph of that window, fast to look at but only as fresh as the moment it was taken. A trigger is a motion sensor that fires every time someone touches a row.\n\nThese tools are powerful but move logic out of your Java code and into the database, where it is harder to test, version and debug. Interviewers want to hear that you know how they work and when they are worth it. Examples use PostgreSQL with `employees(id, name, email, salary, department_id, manager_id)`, `departments(id, name)`, `customers(id, name, email, city)`, `orders(id, customer_id, amount, status, created_at)` and `accounts(id, owner, balance)`.",

  subtopics: [
    {
      id: 'views',
      title: 'Views',
      explanation: "A view is a named SELECT statement stored in the database. When you query a view, the database substitutes the view's query and runs it against the underlying tables, so the result is always up to date. A plain view stores no data.\n\nViews are useful for hiding complex joins behind a simple name, giving reports a stable interface while the underlying tables change, and for security: you can grant users access to a view that exposes only some columns or rows, without granting access to the base table.",
      example: `CREATE VIEW employee_details AS
SELECT e.id,
       e.name,
       e.email,
       d.name AS department
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id;

-- use it like a table
SELECT * FROM employee_details WHERE department = 'Engineering';

-- change the definition later without breaking callers
CREATE OR REPLACE VIEW employee_details AS
SELECT e.id, e.name, e.email, d.name AS department, e.manager_id
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id;

DROP VIEW employee_details;`,
      interviewPoints: [
        "A view is a stored query, not stored data.",
        "Always returns current data from the base tables.",
        "Simplifies complex joins and provides a stable interface.",
        "Can restrict access to columns and rows.",
      ],
    },
    {
      id: 'view-security',
      title: 'Views for security and hiding columns',
      explanation: "A common use of views is to expose only what a user or application needs. For example, a reporting user should see employee names and departments but not salaries. You create a view without the salary column and grant SELECT only on the view.\n\nIn PostgreSQL, a view runs with the privileges of its owner by default, so the reporting user does not need access to `employees` itself. From PostgreSQL 15 you can add `WITH (security_invoker = true)` to make the view check the caller's permissions instead, which matters when row-level security policies are in place.",
      example: `CREATE VIEW employee_public AS
SELECT id, name, email, department_id
FROM employees;              -- no salary column

CREATE ROLE reporting LOGIN PASSWORD 'secret';
GRANT SELECT ON employee_public TO reporting;
-- reporting has no privilege on employees itself

-- PostgreSQL 15+: check the caller's permissions and RLS policies
CREATE VIEW my_orders WITH (security_invoker = true) AS
SELECT * FROM orders;`,
      interviewPoints: [
        "Grant on the view, not on the base table.",
        "Hide sensitive columns such as salary or password hashes.",
        "By default a view runs with its owner's privileges.",
      ],
    },
    {
      id: 'updatable-views',
      title: 'Updatable views and WITH CHECK OPTION',
      explanation: "A simple view that selects from a single table, without aggregates, DISTINCT, GROUP BY, LIMIT or set operations, is automatically updatable in PostgreSQL: INSERT, UPDATE and DELETE on the view are applied to the base table.\n\nA problem appears when the view has a WHERE clause: you could insert a row through the view that the view itself would not show. `WITH CHECK OPTION` prevents that by rejecting any change that would make the row invisible through the view. For views that join tables, you can make them writable with an `INSTEAD OF` trigger.",
      example: `CREATE VIEW paid_orders AS
SELECT id, customer_id, amount, status
FROM orders
WHERE status = 'PAID'
WITH CHECK OPTION;

UPDATE paid_orders SET amount = 120 WHERE id = 10;   -- updates orders

INSERT INTO paid_orders (customer_id, amount, status)
VALUES (1, 50, 'PENDING');
-- ERROR: new row violates check option for view "paid_orders"`,
      interviewPoints: [
        "Single-table views without aggregates are auto-updatable.",
        "WITH CHECK OPTION blocks rows that would fall outside the view.",
        "Join views need INSTEAD OF triggers to be writable.",
      ],
    },
    {
      id: 'materialized-views',
      title: 'Materialized views and refresh',
      explanation: "A materialized view runs its query once and stores the result like a table. Reading it is fast, because nothing is recomputed, and you can put indexes on it. The trade-off is staleness: the data only changes when you run `REFRESH MATERIALIZED VIEW`.\n\nA normal refresh locks the view so readers wait. `REFRESH MATERIALIZED VIEW CONCURRENTLY` lets readers keep using the old data during the refresh, but it requires a UNIQUE index on the materialized view. Refresh is typically scheduled, for example every few minutes or nightly, with a cron job, `pg_cron`, or a Spring `@Scheduled` method.",
      example: `CREATE MATERIALIZED VIEW monthly_sales AS
SELECT date_trunc('month', created_at) AS month,
       customer_id,
       SUM(amount)  AS total,
       COUNT(*)     AS order_count
FROM orders
WHERE status = 'PAID'
GROUP BY 1, 2;

CREATE UNIQUE INDEX ON monthly_sales (month, customer_id);

SELECT * FROM monthly_sales WHERE month = '2026-09-01';

-- rebuild the data; readers are not blocked thanks to the unique index
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;`,
      interviewPoints: [
        "Stores the result on disk; fast reads, can be indexed.",
        "Data is stale until refreshed.",
        "CONCURRENTLY avoids blocking readers but needs a unique index.",
        "Good for dashboards and heavy reports.",
      ],
    },
    {
      id: 'functions',
      title: 'Functions (SQL and PL/pgSQL)',
      explanation: "A function takes parameters, runs inside the database and returns a value, a row or a set of rows. Functions can be used inside queries: `SELECT total_spent(42)` or `SELECT * FROM top_customers(10)`.\n\nSimple functions can be written in plain SQL. PL/pgSQL is PostgreSQL's procedural language: it adds variables, IF, loops and exception handling. Mark a function `STABLE` or `IMMUTABLE` when it does not modify data, so the planner can optimise calls. A function runs inside the caller's transaction and cannot COMMIT or ROLLBACK.",
      example: `-- plain SQL function returning one value
CREATE FUNCTION total_spent(p_customer_id BIGINT)
RETURNS NUMERIC
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM orders
  WHERE customer_id = p_customer_id AND status = 'PAID';
$$;

SELECT name, total_spent(id) FROM customers;

-- PL/pgSQL function returning a set of rows
CREATE FUNCTION top_customers(p_limit INT)
RETURNS TABLE (customer_id BIGINT, total NUMERIC)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  IF p_limit <= 0 THEN
    RAISE EXCEPTION 'limit must be positive, got %', p_limit;
  END IF;

  RETURN QUERY
    SELECT o.customer_id, SUM(o.amount)
    FROM orders o
    WHERE o.status = 'PAID'
    GROUP BY o.customer_id
    ORDER BY 2 DESC
    LIMIT p_limit;
END;
$$;

SELECT * FROM top_customers(5);`,
      interviewPoints: [
        "Functions return a value or rows and can be used in queries.",
        "LANGUAGE sql for simple cases, plpgsql for logic.",
        "Volatility (IMMUTABLE, STABLE, VOLATILE) helps the planner.",
        "Functions cannot control transactions.",
      ],
    },
    {
      id: 'stored-procedures',
      title: 'Stored procedures',
      explanation: "A stored procedure (PostgreSQL 11+) is invoked with `CALL` instead of SELECT and does not return a value the way a function does (it can have OUT/INOUT parameters). The key difference from functions is transaction control: a procedure can COMMIT and ROLLBACK inside its body, which is useful for long batch jobs that process data in chunks.\n\nIn other databases the terms differ: in MySQL, SQL Server and Oracle, stored procedures have existed for a long time and are commonly used for batch work and legacy business logic.",
      example: `CREATE PROCEDURE transfer(p_from BIGINT, p_to BIGINT, p_amount NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE accounts SET balance = balance - p_amount WHERE id = p_from;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'account % not found', p_from;
  END IF;

  UPDATE accounts SET balance = balance + p_amount WHERE id = p_to;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'account % not found', p_to;
  END IF;
END;
$$;

CALL transfer(1, 2, 500);

-- batch job: commit every 10,000 rows so locks and WAL stay small
CREATE PROCEDURE archive_old_orders()
LANGUAGE plpgsql
AS $$
DECLARE
  moved INT;
BEGIN
  LOOP
    WITH batch AS (
      DELETE FROM orders
      WHERE id IN (SELECT id FROM orders
                   WHERE created_at < now() - interval '2 years'
                   LIMIT 10000)
      RETURNING *
    )
    INSERT INTO orders_archive SELECT * FROM batch;

    GET DIAGNOSTICS moved = ROW_COUNT;
    EXIT WHEN moved = 0;
    COMMIT;
  END LOOP;
END;
$$;`,
      interviewPoints: [
        "Invoked with CALL.",
        "Can COMMIT/ROLLBACK inside (functions cannot).",
        "Useful for batch processing in chunks.",
        "An exception inside rolls back the current transaction.",
      ],
    },
    {
      id: 'function-vs-procedure',
      title: 'Function vs stored procedure',
      explanation: "Use a function when you need a value or a set of rows inside a query, for example a calculated column or a table-returning function in a FROM clause. Use a procedure when you perform an action, especially one that should commit in steps.\n\nIn PostgreSQL: functions are called with SELECT, must return something (possibly `void`), can be used in expressions and cannot control transactions. Procedures are called with CALL, cannot be used in expressions and can commit or roll back.",
      example: `SELECT total_spent(42);                  -- function in an expression
SELECT * FROM top_customers(10);          -- set-returning function in FROM

CALL transfer(1, 2, 500);                 -- procedure, a standalone action
-- SELECT transfer(1, 2, 500);            -- ERROR: transfer is a procedure`,
      interviewPoints: [
        "Function: returns data, used in SELECT.",
        "Procedure: performs an action, called with CALL.",
        "Only procedures can manage transactions.",
      ],
    },
    {
      id: 'triggers',
      title: 'Triggers',
      explanation: "A trigger tells the database to run a function automatically when a table is changed. You choose the timing (BEFORE, AFTER, or INSTEAD OF for views), the event (INSERT, UPDATE, DELETE, TRUNCATE) and the granularity (FOR EACH ROW or FOR EACH STATEMENT).\n\nIn a row-level trigger, `NEW` holds the new row (INSERT/UPDATE) and `OLD` holds the previous row (UPDATE/DELETE). A BEFORE row trigger can change `NEW` before it is saved, or return NULL to skip the row. AFTER triggers see the final data and are used for side effects such as audit logs. A trigger runs inside the same transaction as the statement that fired it, so if the trigger fails, the whole change is rolled back.",
      example: `-- keep updated_at correct no matter who updates the row
ALTER TABLE orders ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;          -- the modified row is what gets saved
END;
$$;

CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

UPDATE orders SET status = 'SHIPPED' WHERE id = 10;   -- updated_at is set automatically`,
      interviewPoints: [
        "BEFORE can modify or reject the row; AFTER is for side effects.",
        "Row-level triggers see NEW and OLD.",
        "Runs in the same transaction as the triggering statement.",
        "Trigger function returns trigger type.",
      ],
    },
    {
      id: 'audit-trigger',
      title: 'Audit log with triggers',
      explanation: "A classic trigger use case is an audit trail: record who changed what and when, regardless of whether the change came from the Java application, a migration script or a DBA's console. An AFTER trigger writes a row to an audit table with the operation, the old and new values (as JSONB) and the time.\n\nBecause the trigger is part of the same transaction, the audit row is saved only if the change commits. The cost is that every write to the table now does extra work, so keep audit triggers small.",
      example: `CREATE TABLE salary_audit (
  id           BIGSERIAL PRIMARY KEY,
  employee_id  BIGINT      NOT NULL,
  operation    TEXT        NOT NULL,
  old_salary   NUMERIC,
  new_salary   NUMERIC,
  changed_by   TEXT        NOT NULL DEFAULT current_user,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE FUNCTION audit_salary()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO salary_audit (employee_id, operation, old_salary)
    VALUES (OLD.id, TG_OP, OLD.salary);
    RETURN OLD;
  END IF;

  INSERT INTO salary_audit (employee_id, operation, old_salary, new_salary)
  VALUES (NEW.id, TG_OP,
          CASE WHEN TG_OP = 'UPDATE' THEN OLD.salary END,
          NEW.salary);
  RETURN NEW;
END;
$$;

CREATE TRIGGER employees_salary_audit
AFTER INSERT OR DELETE OR UPDATE OF salary ON employees
FOR EACH ROW
EXECUTE FUNCTION audit_salary();`,
      interviewPoints: [
        "Captures changes from every source, not just the app.",
        "TG_OP tells you INSERT, UPDATE or DELETE.",
        "UPDATE OF column fires only when that column is in the SET list.",
        "Adds overhead to every write.",
      ],
    },
    {
      id: 'spring-calls',
      title: 'Calling views, functions and procedures from Spring',
      explanation: "A view can be mapped to a JPA entity like a table; mark it `@Immutable` (Hibernate) so Hibernate never tries to update it. Functions can be called with a native query. Procedures can be called with Spring Data's `@Procedure`, with `JdbcTemplate`, or with `SimpleJdbcCall`.\n\nIf you use Flyway or Liquibase, create views, functions and triggers in migration scripts so they are versioned with the rest of your schema. Flyway's repeatable migrations (`R__*.sql`) are handy for views and functions because they re-run whenever the file changes.",
      example: `// View mapped as a read-only entity
@Entity
@Immutable
@Table(name = "employee_details")
public class EmployeeDetails {
    @Id
    private Long id;
    private String name;
    private String email;
    private String department;
    // getters
}

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    // call a function with a native query
    @Query(value = "SELECT total_spent(:customerId)", nativeQuery = true)
    BigDecimal totalSpent(@Param("customerId") Long customerId);
}

public interface AccountRepository extends JpaRepository<Account, Long> {

    // call a stored procedure
    @Procedure(procedureName = "transfer")
    void transfer(Long fromId, Long toId, BigDecimal amount);
}

// or with JdbcTemplate
jdbcTemplate.update("CALL transfer(?, ?, ?)", 1L, 2L, new BigDecimal("500"));

// Flyway: src/main/resources/db/migration/R__employee_details_view.sql`,
      interviewPoints: [
        "Map views as @Immutable entities.",
        "Native @Query for functions, @Procedure or JdbcTemplate for procedures.",
        "Keep database objects in Flyway/Liquibase migrations.",
      ],
    },
    {
      id: 'db-vs-app-logic',
      title: 'Database logic vs application logic',
      explanation: "Putting logic in the database has real benefits: data stays in the database (no network round trips for bulk work), rules apply to every client, and some things, such as audit trails and constraints, are simply more reliable there.\n\nThe costs are also real: SQL and PL/pgSQL are harder to unit test, debug and refactor than Java; logic is split across two places; triggers create hidden side effects that surprise developers; and scaling the database is harder than scaling stateless app instances. It also ties you to one database vendor.\n\nA common balanced approach in Spring Boot projects: keep business rules in Java services, use constraints for data integrity, use views and materialized views for reporting, and reserve procedures and triggers for bulk data work and auditing.",
      example: `-- good fits for the database
ALTER TABLE accounts ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);
CREATE MATERIALIZED VIEW monthly_sales AS ...;     -- reporting
CREATE TRIGGER employees_salary_audit ...;         -- auditing
CALL archive_old_orders();                         -- bulk data work

-- usually better in the Java service layer
--   discount rules, order workflows, calls to other services, emails`,
      interviewPoints: [
        "DB logic: fewer round trips, applies to all clients.",
        "App logic: easier to test, version, scale and debug.",
        "Triggers are hidden side effects; use them sparingly.",
        "Vendor lock-in is a consideration.",
      ],
    },
  ],

  commonMistakes: [
    "Thinking a normal view stores data or makes a query faster; it is just the saved query and runs every time.",
    "Forgetting to refresh a materialized view and serving stale reports, or refreshing without CONCURRENTLY and blocking readers.",
    "Using REFRESH MATERIALIZED VIEW CONCURRENTLY without a unique index on the view (it fails).",
    "Inserting through a filtered view without WITH CHECK OPTION and creating rows the view cannot see.",
    "Writing heavy logic in triggers, which slows every write and surprises developers who do not know the trigger exists.",
    "Returning NULL from a BEFORE row trigger by accident, which silently skips the insert or update.",
    "Trying to COMMIT inside a function; only procedures can control transactions.",
    "Creating views and functions by hand in production instead of in versioned Flyway or Liquibase migrations.",
  ],

  interviewTips: [
    "Define each object in one sentence: view = saved query, materialized view = saved result, procedure = program you CALL, trigger = function run automatically on change.",
    "When asked about materialized views, immediately mention staleness and how you refresh them.",
    "Give the audit-log trigger as your trigger example; it is the use case interviewers expect.",
    "Show balance: mention the testing and maintainability costs of database logic and where you would still use it.",
    "Connect to Spring: @Immutable entity for views, @Procedure for stored procedures, Flyway for versioning.",
  ],

  interviewQuestions: [
    {
      id: 'sql-views-procedures-q1',
      question: "What is a view and why would you use one?",
      answer: "A view is a named SELECT query stored in the database that you can query like a table. It stores no data; each time you query it, the database runs the underlying query, so the result is always current. Views hide complex joins behind a simple name, give applications and reports a stable interface while tables evolve, and improve security by exposing only certain columns or rows: you grant access to the view instead of the base table.",
      example: `CREATE VIEW employee_public AS
SELECT id, name, email, department_id FROM employees;

GRANT SELECT ON employee_public TO reporting;`,
      points: [
        "Stored query, no stored data.",
        "Always up to date.",
        "Simplifies queries, provides a stable interface.",
        "Limits access to sensitive columns.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-views-procedures-q2',
      question: "What is the difference between a view and a materialized view?",
      answer: "A view stores only the query; results are computed on every read, so they are always fresh but can be slow for expensive queries. A materialized view stores the query's result on disk. Reads are fast and you can index it, but the data is a snapshot that becomes stale until you run REFRESH MATERIALIZED VIEW. Use views for simplification and security, and materialized views for expensive aggregations, such as dashboards and reports, where slightly stale data is acceptable.",
      example: `CREATE MATERIALIZED VIEW monthly_sales AS
SELECT date_trunc('month', created_at) AS month, SUM(amount) AS total
FROM orders GROUP BY 1;

CREATE UNIQUE INDEX ON monthly_sales (month);
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;`,
      points: [
        "View: computed each time, always fresh.",
        "Materialized view: stored result, fast, stale until refreshed.",
        "Materialized views can have indexes.",
        "CONCURRENTLY refresh needs a unique index.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-views-procedures-q3',
      question: "Can you insert or update data through a view?",
      answer: "Yes, if the view is simple. In PostgreSQL, a view over a single table without aggregates, DISTINCT, GROUP BY, HAVING, LIMIT, window functions or set operations is automatically updatable, and changes go to the base table. If the view has a WHERE clause, add WITH CHECK OPTION so that rows inserted or updated through it must still satisfy the filter. More complex views, such as joins, can be made writable with INSTEAD OF triggers.",
      example: `CREATE VIEW paid_orders AS
SELECT id, customer_id, amount, status FROM orders
WHERE status = 'PAID'
WITH CHECK OPTION;`,
      points: [
        "Simple single-table views are auto-updatable.",
        "WITH CHECK OPTION enforces the view's filter.",
        "INSTEAD OF triggers for complex views.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-views-procedures-q4',
      question: "What is the difference between a function and a stored procedure?",
      answer: "In PostgreSQL, a function is called with SELECT, always returns something (a value, a row, a set of rows or void) and can be used inside queries and expressions. It runs within the caller's transaction and cannot commit or roll back. A stored procedure, added in PostgreSQL 11, is called with CALL, is not used in expressions, and can control transactions with COMMIT and ROLLBACK inside its body. Use functions to compute data and procedures to perform actions such as batch jobs.",
      example: `SELECT total_spent(42);        -- function
CALL transfer(1, 2, 500);       -- procedure`,
      points: [
        "Function: SELECT, returns data, usable in expressions.",
        "Procedure: CALL, performs an action.",
        "Only procedures can COMMIT/ROLLBACK.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-views-procedures-q5',
      question: "What is a trigger? Explain BEFORE vs AFTER and row vs statement triggers.",
      answer: "A trigger makes the database run a function automatically when a table is modified. BEFORE triggers run before the row is written and can change the NEW row (for example, normalising an email or setting updated_at) or skip the row by returning NULL. AFTER triggers run once the change is applied and are used for side effects such as audit logs. A row-level trigger (FOR EACH ROW) runs once per affected row and has access to NEW and OLD; a statement-level trigger (FOR EACH STATEMENT) runs once per statement, even if it affects zero or a million rows. Triggers run inside the same transaction as the statement.",
      example: `CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();`,
      points: [
        "BEFORE: modify or reject the row.",
        "AFTER: side effects on final data.",
        "Row-level has NEW/OLD; statement-level runs once.",
        "Same transaction as the triggering change.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-views-procedures-q6',
      question: "How would you implement an audit log for salary changes?",
      answer: "One option is a database trigger: create a salary_audit table and an AFTER INSERT OR UPDATE OF salary OR DELETE row trigger that inserts the employee id, operation (TG_OP), old and new salary, current_user and now(). This captures changes from every source, including scripts and manual fixes, and the audit row commits or rolls back with the change.\n\nThe application-level alternatives are Hibernate Envers (@Audited), JPA entity listeners or Spring Data auditing, which are easier to test and can record the logged-in application user rather than the database user. Many teams use Envers for business auditing and a trigger when they need a tamper-resistant trail at the database level.",
      example: `CREATE TRIGGER employees_salary_audit
AFTER INSERT OR DELETE OR UPDATE OF salary ON employees
FOR EACH ROW
EXECUTE FUNCTION audit_salary();`,
      points: [
        "AFTER row trigger writing to an audit table.",
        "Catches changes from all clients.",
        "Alternatives: Hibernate Envers, entity listeners.",
        "App-level auditing knows the application user.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-views-procedures-q7',
      question: "What are the pros and cons of putting business logic in stored procedures?",
      answer: "Pros: logic runs next to the data, avoiding network round trips for bulk operations; rules apply to every client of the database; and it can be very fast for set-based work. Cons: PL/pgSQL is harder to unit test, debug, review and refactor than Java; logic ends up split between the app and the database; it ties you to one vendor; and the database is harder to scale horizontally than stateless application servers, so moving CPU work there can create a bottleneck.\n\nIn modern Spring Boot applications, business rules usually live in the service layer, with constraints for integrity and procedures reserved for batch jobs, data migrations and performance-critical set operations.",
      points: [
        "Pro: fewer round trips, consistent for all clients.",
        "Con: testing, debugging, version control are harder.",
        "Con: vendor lock-in and a harder-to-scale database.",
        "Balanced approach: business logic in Java, integrity in the DB.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-views-procedures-q8',
      question: "How do you call a stored procedure or database function from Spring Boot?",
      answer: "With Spring Data JPA you can annotate a repository method with @Procedure(procedureName = \"transfer\") to call a procedure, or use a native @Query such as SELECT total_spent(:id) for a function. With plain JDBC you can use jdbcTemplate.update(\"CALL transfer(?, ?, ?)\", ...) or SimpleJdbcCall for procedures with OUT parameters. A view can be mapped to an @Entity marked @Immutable so it is read-only. All these database objects should be created in Flyway or Liquibase migrations so they are versioned and deployed with the application.",
      example: `@Procedure(procedureName = "transfer")
void transfer(Long fromId, Long toId, BigDecimal amount);

@Query(value = "SELECT total_spent(:customerId)", nativeQuery = true)
BigDecimal totalSpent(@Param("customerId") Long customerId);`,
      points: [
        "@Procedure for stored procedures.",
        "Native @Query for functions.",
        "JdbcTemplate / SimpleJdbcCall as alternatives.",
        "@Immutable entity for views.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-views-procedures-q9',
      question: "A dashboard query over millions of orders takes 20 seconds. How could a materialized view help, and what are the trade-offs?",
      answer: "Create a materialized view that pre-aggregates the data the dashboard needs, for example sales per day per customer, and add indexes that match the dashboard's filters. The dashboard then reads a small, indexed table in milliseconds. Refresh it on a schedule (pg_cron, a Spring @Scheduled job) with REFRESH MATERIALIZED VIEW CONCURRENTLY, which needs a unique index but lets readers continue during refresh.\n\nTrade-offs: data is only as fresh as the last refresh; a full refresh recomputes everything and can be expensive on big tables; and storage is used twice. If you need near-real-time numbers, alternatives are a summary table updated incrementally by the application or triggers, or a separate analytics store.",
      example: `CREATE MATERIALIZED VIEW daily_sales AS
SELECT created_at::date AS day, customer_id, SUM(amount) AS total
FROM orders
WHERE status = 'PAID'
GROUP BY 1, 2;

CREATE UNIQUE INDEX ON daily_sales (day, customer_id);

-- every 10 minutes
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales;`,
      points: [
        "Pre-aggregate and index the result.",
        "Schedule refresh; use CONCURRENTLY.",
        "Trade-off: staleness and refresh cost.",
        "Alternatives: incremental summary tables.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
