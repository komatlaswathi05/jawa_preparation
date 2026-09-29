const topic = {
  id: 'sql-window-functions',
  category: 'sql',
  title: 'Window Functions',
  description: "Rank, compare and accumulate across related rows without collapsing them: OVER, PARTITION BY, ROW_NUMBER, RANK, LAG/LEAD, running totals and frames.",
  difficulty: 'Advanced',
  overview: "A window function performs a calculation across a set of rows that are related to the current row, called the window, while still returning every individual row. GROUP BY squashes rows into one row per group; a window function keeps the detail and adds the group-level result next to it.\n\nImagine a class results sheet. GROUP BY would give you one line per class with the average mark. A window function lets you keep every student's line and add columns such as \"class average\", \"rank in class\" and \"difference from the previous student\".\n\nWindow functions are the standard answer for top-N-per-group, nth-highest, running totals, moving averages and comparing a row with the previous one. Examples use `employees(id, name, email, salary, department_id, manager_id)`, `departments(id, name)`, `customers(id, name, email, city)` and `orders(id, customer_id, amount, status, created_at)`.",

  subtopics: [
    {
      id: 'over-clause',
      title: 'The OVER clause',
      explanation: "Any aggregate or ranking function becomes a window function when followed by `OVER (...)`. An empty `OVER ()` means the window is the whole result set. Inside OVER you can add PARTITION BY (split into groups), ORDER BY (order within the group) and a frame (which rows around the current row to include).",
      example: `SELECT name, salary,
       AVG(salary) OVER () AS company_avg,
       salary - AVG(salary) OVER () AS diff_from_avg
FROM employees;`,
      interviewPoints: [
        "OVER turns a function into a window function.",
        "Rows are not collapsed; every input row appears in the output.",
      ],
    },
    {
      id: 'partition-by',
      title: 'PARTITION BY',
      explanation: "`PARTITION BY` divides rows into independent groups, and the window function restarts for each group. It is similar to GROUP BY, except rows are not merged. `AVG(salary) OVER (PARTITION BY department_id)` puts each department's average on every employee row of that department.",
      example: `SELECT name, department_id, salary,
       AVG(salary) OVER (PARTITION BY department_id) AS dept_avg,
       COUNT(*)    OVER (PARTITION BY department_id) AS dept_size
FROM employees;`,
      interviewPoints: [
        "PARTITION BY is like GROUP BY without collapsing rows.",
        "Without PARTITION BY the whole result is one partition.",
      ],
    },
    {
      id: 'order-by-in-window',
      title: 'ORDER BY inside a window',
      explanation: "`ORDER BY` inside OVER defines the order of rows within each partition. Ranking functions and LAG/LEAD need it. For aggregate functions, adding ORDER BY changes the meaning: the default frame becomes \"from the first row up to the current row\", which produces running totals instead of whole-partition totals.",
      example: `SELECT name, salary,
       SUM(salary) OVER ()                    AS total_all,
       SUM(salary) OVER (ORDER BY salary)     AS running_total
FROM employees;`,
      interviewPoints: [
        "ORDER BY in OVER is independent from the query's final ORDER BY.",
        "Adding ORDER BY to SUM OVER makes it cumulative.",
      ],
    },
    {
      id: 'row-number-rank-dense-rank',
      title: 'ROW_NUMBER, RANK & DENSE_RANK',
      explanation: "All three number rows in the window order, but they treat ties differently. `ROW_NUMBER()` gives unique numbers 1, 2, 3, 4 even for ties (order among ties is arbitrary unless you add a tie-breaker). `RANK()` gives ties the same number and then skips: 1, 2, 2, 4. `DENSE_RANK()` gives ties the same number without gaps: 1, 2, 2, 3.",
      example: `SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
       RANK()       OVER (ORDER BY salary DESC) AS rnk,
       DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk
FROM employees;

-- salary 90k, 80k, 80k, 70k gives
-- row_num: 1, 2, 3, 4
-- rnk:     1, 2, 2, 4
-- dense:   1, 2, 2, 3`,
      interviewPoints: [
        "ROW_NUMBER: always unique, good for deduplication and pagination.",
        "RANK: ties share a rank, gaps follow.",
        "DENSE_RANK: ties share a rank, no gaps; use it for nth highest value.",
      ],
    },
    {
      id: 'top-n-per-group',
      title: 'Top-N per group',
      explanation: "A very common pattern: rank rows within each partition in a subquery or CTE, then filter on the rank in the outer query. Window functions cannot be used directly in WHERE, because WHERE runs before window functions are computed.",
      example: `WITH ranked AS (
  SELECT name, department_id, salary,
         DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk
  FROM employees
)
SELECT department_id, name, salary
FROM ranked
WHERE rnk <= 3
ORDER BY department_id, rnk;`,
      interviewPoints: [
        "Compute the rank in a CTE or subquery, filter outside.",
        "Pick ROW_NUMBER for exactly N rows, DENSE_RANK to include ties.",
      ],
    },
    {
      id: 'lag-lead',
      title: 'LAG & LEAD',
      explanation: "`LAG(col, n, default)` returns the value from n rows before the current row in the window order, and `LEAD` returns the value from n rows after. n defaults to 1 and default (returned when there is no such row) defaults to NULL. They are perfect for comparing a row with its neighbour: day-over-day change, time between orders, previous salary.",
      example: `SELECT customer_id, id AS order_id, created_at, amount,
       LAG(amount)  OVER w AS prev_amount,
       amount - LAG(amount) OVER w AS change,
       LEAD(created_at) OVER w AS next_order_at
FROM orders
WINDOW w AS (PARTITION BY customer_id ORDER BY created_at);`,
      interviewPoints: [
        "LAG looks back, LEAD looks forward.",
        "The third argument replaces NULL at the edges.",
        "The WINDOW clause lets you name and reuse a window definition.",
      ],
    },
    {
      id: 'running-totals',
      title: 'Running totals with SUM OVER',
      explanation: "A running (cumulative) total adds the current row to all previous rows. Use `SUM(amount) OVER (ORDER BY created_at)`, and add PARTITION BY to restart the total per customer or per month. To avoid surprises with ties, specify the frame explicitly with `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.",
      example: `SELECT customer_id, created_at, amount,
       SUM(amount) OVER (
         PARTITION BY customer_id
         ORDER BY created_at
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total
FROM orders
ORDER BY customer_id, created_at;`,
      interviewPoints: [
        "SUM OVER (ORDER BY ...) is a running total.",
        "PARTITION BY restarts it per group.",
      ],
    },
    {
      id: 'window-frames',
      title: 'Window frames: ROWS vs RANGE',
      explanation: "A frame picks which rows around the current row are used by aggregate functions. `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` means the current row plus the two physical rows before it, which gives a 3-row moving average. `RANGE` works on values instead of physical rows: rows with the same ORDER BY value (peers) are treated together.\n\nThe default frame when ORDER BY is present is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, so tied rows all get the same running total. Without ORDER BY the frame is the whole partition. Ranking functions and LAG/LEAD ignore frames.",
      example: `-- 7-day moving average of daily revenue
WITH daily AS (
  SELECT created_at::date AS day, SUM(amount) AS revenue
  FROM orders GROUP BY 1
)
SELECT day, revenue,
       ROUND(AVG(revenue) OVER (
         ORDER BY day
         ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
       ), 2) AS moving_avg_7d
FROM daily
ORDER BY day;`,
      interviewPoints: [
        "ROWS = physical rows; RANGE = rows with values within a range, peers included.",
        "Default with ORDER BY: RANGE UNBOUNDED PRECEDING to CURRENT ROW.",
        "Frames matter for aggregates, FIRST_VALUE, LAST_VALUE, NTH_VALUE.",
      ],
    },
    {
      id: 'first-last-value',
      title: 'FIRST_VALUE, LAST_VALUE & NTH_VALUE',
      explanation: "`FIRST_VALUE(col)` returns the value from the first row of the frame, `LAST_VALUE` from the last, and `NTH_VALUE(col, n)` from the nth. A classic trap: with the default frame, LAST_VALUE returns the current row (the frame ends at the current row), so you must extend the frame to `UNBOUNDED FOLLOWING`.",
      example: `SELECT name, department_id, salary,
       FIRST_VALUE(name) OVER w AS top_earner,
       LAST_VALUE(name)  OVER w AS lowest_earner
FROM employees
WINDOW w AS (
  PARTITION BY department_id
  ORDER BY salary DESC
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
);`,
      interviewPoints: [
        "LAST_VALUE needs an explicit full frame.",
        "FIRST_VALUE with ORDER BY DESC gives the top value per group.",
      ],
    },
    {
      id: 'ntile',
      title: 'NTILE',
      explanation: "`NTILE(n)` splits the ordered rows of each partition into n buckets of (as far as possible) equal size and returns the bucket number, starting at 1. It is used for quartiles, percentiles and splitting work into batches. If rows do not divide evenly, the earlier buckets get one extra row.",
      example: `SELECT name, salary,
       NTILE(4) OVER (ORDER BY salary DESC) AS salary_quartile
FROM employees;
-- quartile 1 = top 25% earners`,
      interviewPoints: [
        "NTILE(4) gives quartiles, NTILE(100) percentiles.",
        "Bucket sizes differ by at most one.",
        "PERCENT_RANK and CUME_DIST give relative position as a fraction.",
      ],
    },
    {
      id: 'window-vs-group-by',
      title: 'Window functions vs GROUP BY',
      explanation: "GROUP BY returns one row per group and you lose the individual rows. A window function returns every row and adds the aggregate as an extra column. If you need both detail and summary (\"each employee and their department average\"), a window function avoids a self-join or correlated subquery.\n\nWindow functions are computed after WHERE, GROUP BY and HAVING but before ORDER BY and LIMIT. So you cannot filter on them in WHERE, but you can use them together with GROUP BY (the window runs over the grouped rows).",
      example: `-- GROUP BY: one row per department
SELECT department_id, AVG(salary) FROM employees GROUP BY department_id;

-- window: every employee plus department average
SELECT name, department_id, salary,
       AVG(salary) OVER (PARTITION BY department_id) AS dept_avg
FROM employees;

-- both together: rank departments by total salary
SELECT department_id, SUM(salary) AS total,
       RANK() OVER (ORDER BY SUM(salary) DESC) AS rnk
FROM employees
GROUP BY department_id;`,
      interviewPoints: [
        "GROUP BY collapses rows; windows keep them.",
        "Windows run after GROUP BY/HAVING, before ORDER BY/LIMIT.",
        "You can window over aggregated values.",
      ],
    },
  ],

  commonMistakes: [
    "Putting a window function in WHERE (for example `WHERE ROW_NUMBER() OVER (...) = 1`), which is not allowed; filter in an outer query instead.",
    "Using ROW_NUMBER for \"nth highest salary\" when ties exist; DENSE_RANK is usually what the question means.",
    "Using LAST_VALUE with the default frame and getting the current row's value instead of the partition's last value.",
    "Adding ORDER BY inside `SUM() OVER` when you wanted the partition total, accidentally creating a running total.",
    "Relying on the default RANGE frame for running totals when the order column has ties, so tied rows get the same total.",
    "Forgetting a tie-breaker in ROW_NUMBER ordering, making results non-deterministic between runs.",
  ],

  interviewTips: [
    "When you hear \"top N per group\", \"nth highest\", \"previous row\" or \"running total\", say window function immediately.",
    "Explain ROW_NUMBER vs RANK vs DENSE_RANK with a tiny example that has a tie (90, 80, 80, 70).",
    "Mention that window functions cannot be filtered in WHERE and show the CTE wrapper pattern.",
    "Know the default frame rule; interviewers use LAST_VALUE to test whether you really understand frames.",
    "Use the WINDOW clause to avoid repeating long OVER definitions; it makes your answer tidy.",
  ],

  interviewQuestions: [
    {
      id: 'sql-window-functions-q1',
      question: "What is a window function and how is it different from an aggregate with GROUP BY?",
      answer: "A window function calculates a value across a set of related rows (the window) defined by OVER, but returns one output row for each input row. An aggregate with GROUP BY collapses each group into a single row. So with a window function you can show each employee alongside their department's average salary in the same row, which with GROUP BY would need a join back to the detail rows.",
      example: `SELECT name, department_id, salary,
       AVG(salary) OVER (PARTITION BY department_id) AS dept_avg
FROM employees;`,
      points: [
        "Defined with OVER.",
        "Does not collapse rows.",
        "PARTITION BY is the window's version of GROUP BY.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-window-functions-q2',
      question: "What is the difference between ROW_NUMBER, RANK and DENSE_RANK?",
      answer: "All three assign a number to each row based on the ORDER BY in the window. ROW_NUMBER always gives a unique sequential number, breaking ties arbitrarily. RANK gives tied rows the same number and then skips the following numbers. DENSE_RANK gives tied rows the same number with no gaps.\n\nFor salaries 90, 80, 80, 70: ROW_NUMBER gives 1, 2, 3, 4; RANK gives 1, 2, 2, 4; DENSE_RANK gives 1, 2, 2, 3.",
      example: `SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn,
       RANK()       OVER (ORDER BY salary DESC) AS rk,
       DENSE_RANK() OVER (ORDER BY salary DESC) AS drk
FROM employees;`,
      points: [
        "ROW_NUMBER: unique.",
        "RANK: ties equal, gaps after.",
        "DENSE_RANK: ties equal, no gaps.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-window-functions-q3',
      question: "Write a query to find the nth highest salary using a window function.",
      answer: "Rank distinct salary values with DENSE_RANK in descending order inside a CTE, then select the row whose rank equals N. DENSE_RANK is the right choice because tied salaries share a rank and there are no gaps, so rank 3 really means the third-highest distinct salary. Returning employees rather than just the value is also easy.",
      example: `WITH ranked AS (
  SELECT name, salary,
         DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
)
SELECT name, salary
FROM ranked
WHERE rnk = 3;   -- N = 3`,
      points: [
        "DENSE_RANK handles ties.",
        "Filter on the rank in an outer query.",
        "Returns all employees with that salary.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-window-functions-q4',
      question: "Write a query to find the top 3 salaries in each department.",
      answer: "Partition by department and order by salary descending, compute DENSE_RANK (so ties are included) in a CTE, and keep rows with rank at most 3. If the requirement is exactly three employees per department regardless of ties, use ROW_NUMBER with a tie-breaker instead.",
      example: `WITH ranked AS (
  SELECT d.name AS department, e.name, e.salary,
         DENSE_RANK() OVER (
           PARTITION BY e.department_id
           ORDER BY e.salary DESC
         ) AS rnk
  FROM employees e
  JOIN departments d ON d.id = e.department_id
)
SELECT department, name, salary, rnk
FROM ranked
WHERE rnk <= 3
ORDER BY department, rnk;`,
      points: [
        "PARTITION BY department restarts ranking per group.",
        "DENSE_RANK for top 3 salary values, ROW_NUMBER for exactly 3 rows.",
        "Filter in an outer query.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-window-functions-q5',
      question: "Write a query to remove duplicate employee rows that share the same email, keeping the one with the lowest id.",
      answer: "Number rows within each email group using ROW_NUMBER ordered by id. The first row (rn = 1) is the one to keep, and every row with rn greater than 1 is a duplicate. Delete those by id.",
      example: `-- inspect duplicates
SELECT id, email,
       ROW_NUMBER() OVER (PARTITION BY LOWER(email) ORDER BY id) AS rn
FROM employees;

-- delete them
DELETE FROM employees
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY LOWER(email) ORDER BY id) AS rn
    FROM employees
  ) t
  WHERE rn > 1
);`,
      points: [
        "ROW_NUMBER per duplicate group.",
        "Keep rn = 1, delete rn > 1.",
        "Add a UNIQUE constraint afterwards to prevent new duplicates.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-window-functions-q6',
      question: "What do LAG and LEAD do? Write a query showing each order and how much it changed from the customer's previous order.",
      answer: "LAG returns a value from a previous row in the window order and LEAD from a following row, without a self-join. Partition by customer and order by date so each customer's orders are compared only with their own earlier orders. The first order has no previous one, so LAG returns NULL (or a default you supply).",
      example: `SELECT customer_id, id, created_at, amount,
       LAG(amount) OVER (PARTITION BY customer_id ORDER BY created_at) AS prev_amount,
       amount - LAG(amount, 1, 0) OVER (PARTITION BY customer_id ORDER BY created_at) AS change
FROM orders
ORDER BY customer_id, created_at;`,
      points: [
        "LAG(col, offset, default).",
        "Replaces a self-join on the previous row.",
        "PARTITION BY keeps comparisons within one customer.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-window-functions-q7',
      question: "Write a query to compute a running total of order amounts per customer.",
      answer: "Use SUM as a window function, partitioned by customer and ordered by date. Specify the frame with ROWS so that two orders at the same timestamp are added one at a time; with the default RANGE frame they would both show the same, combined total.",
      example: `SELECT customer_id, id, created_at, amount,
       SUM(amount) OVER (
         PARTITION BY customer_id
         ORDER BY created_at, id
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total
FROM orders
ORDER BY customer_id, created_at, id;`,
      points: [
        "SUM OVER with ORDER BY = cumulative.",
        "ROWS avoids tie surprises.",
        "Add id as a tie-breaker for deterministic results.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-window-functions-q8',
      question: "Explain window frames. What is the difference between ROWS and RANGE, and what is the default frame?",
      answer: "A frame defines which rows around the current row an aggregate (or FIRST_VALUE / LAST_VALUE) looks at. ROWS counts physical rows, for example `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`. RANGE is based on the ORDER BY value: all peers with the same value are included together, and with numeric or date columns you can write offsets such as `RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW`.\n\nIf OVER has ORDER BY, the default frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. Without ORDER BY, the frame is the whole partition. That default is why LAST_VALUE surprises people and why running totals give equal values for ties.",
      example: `SELECT created_at::date AS day, amount,
       SUM(amount) OVER (
         ORDER BY created_at
         RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW
       ) AS last_7_days
FROM orders;`,
      points: [
        "ROWS = physical offset, RANGE = value-based with peers.",
        "Default with ORDER BY: RANGE UNBOUNDED PRECEDING .. CURRENT ROW.",
        "Default without ORDER BY: entire partition.",
        "GROUPS mode (PostgreSQL 11+) counts peer groups.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-window-functions-q9',
      question: "Why does LAST_VALUE often return the current row's value, and how do you fix it?",
      answer: "When OVER contains ORDER BY, the default frame ends at the current row (and its peers). So the last row of the frame is the current row itself, and LAST_VALUE simply returns the current value. To get the last value of the entire partition, extend the frame explicitly to `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`, or use FIRST_VALUE with the order reversed.",
      example: `SELECT name, department_id, salary,
       LAST_VALUE(name) OVER (
         PARTITION BY department_id
         ORDER BY salary DESC
         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
       ) AS lowest_paid
FROM employees;`,
      points: [
        "Default frame stops at the current row.",
        "Use UNBOUNDED FOLLOWING.",
        "Or FIRST_VALUE with ORDER BY salary ASC.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-window-functions-q10',
      question: "Why can't you use a window function in WHERE, and how do you filter on its result?",
      answer: "Window functions are evaluated after FROM, WHERE, GROUP BY and HAVING, just before ORDER BY and LIMIT. When WHERE runs, the window values do not exist yet, so PostgreSQL raises an error. To filter on a window result, compute it in a subquery or CTE, then filter in the outer query. (Some databases such as Snowflake and BigQuery offer a QUALIFY clause for this, but PostgreSQL does not.)",
      example: `SELECT *
FROM (
  SELECT o.*,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS rn
  FROM orders o
) latest
WHERE rn = 1;   -- latest order per customer`,
      points: [
        "Logical order: WHERE runs before window functions.",
        "Wrap in a subquery or CTE.",
        "QUALIFY exists in some databases, not PostgreSQL.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-window-functions-q11',
      question: "Write a query that finds, for each customer, the gap in days between consecutive orders and flags gaps longer than 30 days.",
      answer: "Use LAG to fetch the previous order's timestamp for the same customer, subtract it from the current one, and wrap the result in a CTE so you can filter or flag on the computed gap. Subtracting two dates gives an integer number of days in PostgreSQL.",
      example: `WITH gaps AS (
  SELECT customer_id, id, created_at,
         created_at::date
           - LAG(created_at::date) OVER (PARTITION BY customer_id ORDER BY created_at)
           AS days_since_prev
  FROM orders
)
SELECT customer_id, id, created_at, days_since_prev,
       days_since_prev > 30 AS long_gap
FROM gaps
ORDER BY customer_id, created_at;`,
      points: [
        "LAG over the timestamp per customer.",
        "date - date = integer days in PostgreSQL.",
        "CTE to reuse the computed column.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
