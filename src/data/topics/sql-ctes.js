const topic = {
  id: 'sql-ctes',
  category: 'sql',
  title: 'Common Table Expressions (CTEs)',
  description: "Name intermediate results with WITH, chain multiple CTEs, walk hierarchies with recursive CTEs and understand materialization.",
  difficulty: 'Intermediate',
  overview: "A Common Table Expression (CTE) is a named, temporary result set that you define at the start of a query with the `WITH` keyword and then use like a table in the main query. It exists only while that single statement runs.\n\nThink of a CTE as writing down intermediate results on a sticky note with a label. Instead of one giant nested query, you write step 1 (\"department averages\"), step 2 (\"employees above their department average\"), and then the final answer. Each step has a name, so the query reads top to bottom like a recipe.\n\nCTEs also unlock recursive queries, which can walk tree-shaped data such as an org chart (`employees.manager_id`) or category hierarchies. Examples use `employees(id, name, email, salary, department_id, manager_id)`, `departments(id, name)`, `customers(id, name, email, city)` and `orders(id, customer_id, amount, status, created_at)`.",

  subtopics: [
    {
      id: 'with-clause',
      title: 'The WITH clause',
      explanation: "A CTE is written as `WITH name AS (SELECT ...)` followed by the main statement that uses `name`. You can optionally list column names: `WITH name (col1, col2) AS (...)`. The CTE is visible only inside that one statement; it is not stored anywhere.",
      example: `WITH dept_avg AS (
  SELECT department_id, AVG(salary) AS avg_salary
  FROM employees
  GROUP BY department_id
)
SELECT e.name, e.salary, d.avg_salary
FROM employees e
JOIN dept_avg d ON d.department_id = e.department_id
WHERE e.salary > d.avg_salary;`,
      interviewPoints: [
        "A CTE lives only for the duration of one statement.",
        "It improves readability by naming steps.",
      ],
    },
    {
      id: 'multiple-ctes',
      title: 'Multiple CTEs',
      explanation: "You can define several CTEs in one WITH clause, separated by commas. Later CTEs can refer to earlier ones, so you can build a pipeline of steps. Only write `WITH` once at the start.",
      example: `WITH customer_totals AS (
  SELECT customer_id, SUM(amount) AS total_spent
  FROM orders
  WHERE status = 'PAID'
  GROUP BY customer_id
),
vip_customers AS (
  SELECT customer_id, total_spent
  FROM customer_totals
  WHERE total_spent > 10000
)
SELECT c.name, v.total_spent
FROM vip_customers v
JOIN customers c ON c.id = v.customer_id
ORDER BY v.total_spent DESC;`,
      interviewPoints: [
        "One WITH keyword, CTEs separated by commas.",
        "A CTE can reference CTEs defined before it.",
      ],
    },
    {
      id: 'cte-vs-subquery-vs-view',
      title: 'CTE vs subquery vs view',
      explanation: "A subquery (derived table) is anonymous and nested; it is fine for small cases but deep nesting is hard to read. A CTE does the same job but is named, can be referenced several times in the same query, and can be recursive. A view is a named query stored permanently in the database and reusable by any query or user.\n\nChoose a CTE for readability within one query, a view for logic shared across many queries, and a subquery for small one-off filters.",
      example: `-- same logic, three ways

-- 1. derived table
SELECT * FROM (SELECT department_id, COUNT(*) AS n FROM employees GROUP BY 1) t
WHERE n > 5;

-- 2. CTE
WITH t AS (SELECT department_id, COUNT(*) AS n FROM employees GROUP BY 1)
SELECT * FROM t WHERE n > 5;

-- 3. view
CREATE VIEW dept_headcount AS
SELECT department_id, COUNT(*) AS n FROM employees GROUP BY 1;
SELECT * FROM dept_headcount WHERE n > 5;`,
      interviewPoints: [
        "CTE: named, per statement, can be recursive, reusable within the query.",
        "View: stored in the schema, reusable everywhere.",
        "Subquery: anonymous, inline.",
      ],
    },
    {
      id: 'recursive-ctes',
      title: 'Recursive CTEs',
      explanation: "A recursive CTE refers to itself, which lets you walk hierarchical or graph data. It has two parts joined by `UNION ALL`: the anchor member (the starting rows, such as the CEO) and the recursive member (joins the CTE to the table to find the next level). PostgreSQL repeats the recursive member until it returns no new rows.\n\nYou must write `WITH RECURSIVE` in PostgreSQL. Always make sure the recursion ends; cycles in the data can cause infinite loops, so add a depth limit or cycle check.",
      example: `WITH RECURSIVE org_chart AS (
  -- anchor: top of the tree
  SELECT id, name, manager_id, 1 AS level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- recursive step: direct reports of the previous level
  SELECT e.id, e.name, e.manager_id, oc.level + 1
  FROM employees e
  JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT level, name
FROM org_chart
ORDER BY level, name;`,
      interviewPoints: [
        "Anchor member + UNION ALL + recursive member.",
        "Stops when the recursive step returns no rows.",
        "Guard against cycles with a depth limit, a path array, or the CYCLE clause (PostgreSQL 14+).",
      ],
    },
    {
      id: 'recursive-hierarchy-path',
      title: 'Hierarchy paths and subtrees',
      explanation: "Recursive CTEs can also build a readable path (\"CEO > VP > Manager\") and find every person under a given manager, at any depth. Tracking the path in an array also gives you a simple cycle check: stop if the next id is already in the path.",
      example: `WITH RECURSIVE reports AS (
  SELECT id, name, manager_id, ARRAY[id] AS path, name::text AS chain
  FROM employees
  WHERE id = 10                      -- start from manager 10

  UNION ALL

  SELECT e.id, e.name, e.manager_id,
         r.path || e.id,
         r.chain || ' > ' || e.name
  FROM employees e
  JOIN reports r ON e.manager_id = r.id
  WHERE NOT e.id = ANY (r.path)      -- cycle protection
)
SELECT id, name, chain FROM reports WHERE id <> 10;`,
      interviewPoints: [
        "Walk down (subordinates) by joining e.manager_id = cte.id.",
        "Walk up (chain of managers) by joining e.id = cte.manager_id.",
      ],
    },
    {
      id: 'generate-series-recursive',
      title: 'Recursive CTEs for sequences',
      explanation: "Recursion is not only for trees. A recursive CTE can generate a sequence of numbers or dates, which is useful for filling gaps in reports. In PostgreSQL the built-in `generate_series` is usually simpler, but the recursive version works in any database that supports recursive CTEs.",
      example: `WITH RECURSIVE days AS (
  SELECT DATE '2026-01-01' AS day
  UNION ALL
  SELECT day + 1 FROM days WHERE day < DATE '2026-01-07'
)
SELECT d.day, COALESCE(SUM(o.amount), 0) AS revenue
FROM days d
LEFT JOIN orders o ON o.created_at::date = d.day
GROUP BY d.day
ORDER BY d.day;`,
      interviewPoints: [
        "The WHERE in the recursive member is the stop condition.",
        "generate_series is the idiomatic PostgreSQL alternative.",
      ],
    },
    {
      id: 'materialization',
      title: 'CTE materialization',
      explanation: "Before PostgreSQL 12, every CTE was materialized: computed once and stored in a temporary result, acting as an optimization fence (filters from the outer query were not pushed inside). Since PostgreSQL 12, a non-recursive CTE that is referenced only once and has no side effects is inlined, so it performs like a subquery.\n\nYou can control this with `AS MATERIALIZED` (compute once, useful when the CTE is expensive and used many times) or `AS NOT MATERIALIZED` (force inlining so the planner can push filters and use indexes).",
      example: `-- force computing once and reusing
WITH totals AS MATERIALIZED (
  SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id
)
SELECT * FROM totals t1
JOIN totals t2 ON t1.total = t2.total AND t1.customer_id < t2.customer_id;

-- force inlining so the WHERE can use an index on orders.customer_id
WITH o AS NOT MATERIALIZED (
  SELECT * FROM orders
)
SELECT * FROM o WHERE customer_id = 42;`,
      interviewPoints: [
        "PostgreSQL 12+ inlines simple single-use CTEs.",
        "Recursive CTEs and CTEs used more than once are materialized by default.",
        "MATERIALIZED / NOT MATERIALIZED give explicit control.",
      ],
    },
    {
      id: 'data-modifying-ctes',
      title: 'Data-modifying CTEs',
      explanation: "In PostgreSQL a CTE can contain INSERT, UPDATE or DELETE with RETURNING, and the main query can use the returned rows. This lets you do several related changes in one atomic statement, such as moving rows from one table to another.",
      example: `WITH moved AS (
  DELETE FROM orders
  WHERE created_at < now() - interval '2 years'
  RETURNING *
)
INSERT INTO orders_archive
SELECT * FROM moved;`,
      interviewPoints: [
        "Requires RETURNING to pass rows on.",
        "All parts run in one statement, so they succeed or fail together.",
      ],
    },
  ],

  commonMistakes: [
    "Writing `WITH` before every CTE instead of once, with commas between CTEs.",
    "Forgetting `RECURSIVE` in PostgreSQL, which makes a self-referencing CTE fail.",
    "Using `UNION` instead of `UNION ALL` in a recursive CTE without realising it removes duplicates (and costs extra work).",
    "Writing a recursive CTE with no stop condition or cycle protection, causing an infinite loop on cyclic data.",
    "Assuming a CTE is stored like a temporary table and can be used by the next statement; it only exists for one statement.",
    "Assuming CTEs are always an optimization fence; that stopped being true in PostgreSQL 12.",
  ],

  interviewTips: [
    "Use CTEs in live coding: naming each step makes your reasoning easy for the interviewer to follow.",
    "For any hierarchy question (org chart, categories, bill of materials), say \"recursive CTE\" and explain anchor plus recursive member.",
    "Mention the PostgreSQL 12 change in CTE materialization; it shows depth.",
    "Be ready to compare CTE, subquery, view and temporary table in one or two sentences each.",
  ],

  interviewQuestions: [
    {
      id: 'sql-ctes-q1',
      question: "What is a CTE and why would you use one?",
      answer: "A CTE (Common Table Expression) is a named temporary result set defined with WITH at the start of a statement and used like a table in the rest of that statement. It improves readability by breaking a complex query into named steps, lets you reference the same intermediate result more than once, and enables recursive queries for hierarchical data.",
      example: `WITH high_earners AS (
  SELECT * FROM employees WHERE salary > 100000
)
SELECT department_id, COUNT(*) FROM high_earners GROUP BY department_id;`,
      points: [
        "Defined with WITH.",
        "Scoped to one statement.",
        "Readability, reuse, recursion.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-ctes-q2',
      question: "What is the difference between a CTE and a subquery?",
      answer: "Functionally a non-recursive CTE and a derived-table subquery can express the same thing. A CTE is named and defined up front, so the query reads top to bottom and the same CTE can be referenced multiple times; a subquery is anonymous and must be repeated if needed twice. Only CTEs can be recursive.\n\nIn PostgreSQL 12+, a simple CTE used once is inlined, so performance is usually the same as a subquery.",
      points: [
        "CTE is named and reusable within the statement.",
        "CTEs can be recursive; subqueries cannot.",
        "Performance is usually equal in modern PostgreSQL.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-ctes-q3',
      question: "Write a query using a CTE to show each department's average salary and the employees who earn above it.",
      answer: "First compute the average salary per department in a CTE, then join employees to it on department and keep only employees whose salary exceeds their department's average. Joining departments adds the readable name.",
      example: `WITH dept_avg AS (
  SELECT department_id, ROUND(AVG(salary), 2) AS avg_salary
  FROM employees
  GROUP BY department_id
)
SELECT d.name AS department, e.name, e.salary, da.avg_salary
FROM employees e
JOIN dept_avg da   ON da.department_id = e.department_id
JOIN departments d ON d.id = e.department_id
WHERE e.salary > da.avg_salary
ORDER BY d.name, e.salary DESC;`,
      points: [
        "Aggregate once in the CTE.",
        "Join back to the detail rows.",
        "Same idea as a correlated subquery but aggregated only once.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-ctes-q4',
      question: "What is a recursive CTE? Explain its parts.",
      answer: "A recursive CTE is a CTE that references itself, used to process hierarchical or graph data. It has an anchor member that produces the starting rows, then `UNION ALL`, then a recursive member that joins the CTE to the base table to produce the next set of rows. The database repeatedly runs the recursive member on the rows produced in the previous iteration until no new rows appear. In PostgreSQL you must write `WITH RECURSIVE`.",
      example: `WITH RECURSIVE numbers AS (
  SELECT 1 AS n          -- anchor
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 5   -- recursive member + stop condition
)
SELECT n FROM numbers;   -- 1, 2, 3, 4, 5`,
      points: [
        "Anchor, UNION ALL, recursive member.",
        "Terminates when an iteration returns no rows.",
        "Needs a stop condition.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-ctes-q5',
      question: "Write a recursive query to display the full org chart with each employee's level.",
      answer: "Start with the employees who have no manager (level 1). In the recursive step, join employees whose `manager_id` matches an id already in the CTE, and add 1 to the level. Keeping a path lets you sort the output as an indented tree.",
      example: `WITH RECURSIVE org AS (
  SELECT id, name, manager_id, 1 AS level, ARRAY[name] AS path
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT e.id, e.name, e.manager_id, org.level + 1, org.path || e.name
  FROM employees e
  JOIN org ON e.manager_id = org.id
)
SELECT repeat('  ', level - 1) || name AS org_chart, level
FROM org
ORDER BY path;`,
      points: [
        "Anchor is the root (manager_id IS NULL).",
        "Recursive join: e.manager_id = org.id.",
        "Sorting by the path array prints a tree.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-ctes-q6',
      question: "Write a query to find all managers above a given employee (the chain of command).",
      answer: "Walk up the tree instead of down. The anchor is the given employee; the recursive member joins employees whose id equals the current row's `manager_id`. The recursion stops when it reaches someone whose manager is NULL.",
      example: `WITH RECURSIVE chain AS (
  SELECT id, name, manager_id, 0 AS steps_up
  FROM employees
  WHERE id = 57

  UNION ALL

  SELECT m.id, m.name, m.manager_id, c.steps_up + 1
  FROM employees m
  JOIN chain c ON m.id = c.manager_id
)
SELECT steps_up, name
FROM chain
WHERE steps_up > 0
ORDER BY steps_up;`,
      points: [
        "Up the tree: join on m.id = c.manager_id.",
        "Down the tree: join on e.manager_id = c.id.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-ctes-q7',
      question: "When would you use a CTE, a view or a temporary table?",
      answer: "Use a CTE to structure a single complex query into readable steps; it disappears when the statement ends. Use a view when the same logic should be reused by many queries, reports or users; it is stored in the schema but holds no data (unless materialized). Use a temporary table when an intermediate result is large or needed across several statements in the same session, and you may want to index it or run ANALYZE on it.",
      example: `CREATE TEMP TABLE big_spenders AS
SELECT customer_id, SUM(amount) AS total
FROM orders GROUP BY customer_id HAVING SUM(amount) > 5000;

CREATE INDEX ON big_spenders (customer_id);
ANALYZE big_spenders;`,
      points: [
        "CTE: one statement.",
        "View: permanent definition, shared.",
        "Temp table: one session, can be indexed.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-ctes-q8',
      question: "Are CTEs an optimization fence in PostgreSQL? Explain MATERIALIZED and NOT MATERIALIZED.",
      answer: "Up to PostgreSQL 11, yes: every CTE was computed once and stored, and outer filters were not pushed into it, which sometimes prevented index use. Since PostgreSQL 12, a CTE that is non-recursive, side-effect free and referenced only once is inlined into the main query and optimized like a subquery.\n\nYou can override the default: `AS MATERIALIZED` forces the CTE to be computed once (good for an expensive CTE referenced several times, or to stop a bad plan), and `AS NOT MATERIALIZED` forces inlining even if it is referenced more than once.",
      example: `WITH recent AS NOT MATERIALIZED (
  SELECT * FROM orders WHERE created_at > now() - interval '30 days'
)
SELECT * FROM recent WHERE customer_id = 42;`,
      points: [
        "Pre-12: always materialized (fence).",
        "12+: single-use CTEs inlined.",
        "Explicit hints: MATERIALIZED / NOT MATERIALIZED.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-ctes-q9',
      question: "How do you prevent infinite loops in a recursive CTE?",
      answer: "Recursion stops only when an iteration returns no new rows, so cyclic data (A manages B, B manages A) loops forever. Protect against this by tracking visited ids in an array and excluding rows already in the path, by adding a maximum depth condition, or, in PostgreSQL 14+, by using the `CYCLE` clause which marks and stops cycles automatically. Using `UNION` instead of `UNION ALL` also stops exact duplicate rows but does not help if the rows differ (for example by level).",
      example: `WITH RECURSIVE org AS (
  SELECT id, manager_id, ARRAY[id] AS path, 1 AS depth
  FROM employees WHERE id = 1
  UNION ALL
  SELECT e.id, e.manager_id, org.path || e.id, org.depth + 1
  FROM employees e
  JOIN org ON e.manager_id = org.id
  WHERE e.id <> ALL (org.path)   -- not visited yet
    AND org.depth < 20           -- hard depth limit
)
SELECT * FROM org;

-- PostgreSQL 14+
WITH RECURSIVE org AS (
  SELECT id, manager_id FROM employees WHERE id = 1
  UNION ALL
  SELECT e.id, e.manager_id FROM employees e JOIN org ON e.manager_id = org.id
) CYCLE id SET is_cycle USING path
SELECT * FROM org WHERE NOT is_cycle;`,
      points: [
        "Track the path and skip visited nodes.",
        "Add a depth limit as a safety net.",
        "PostgreSQL 14+ has the CYCLE clause.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
