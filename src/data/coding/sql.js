const questions = [
  {
    id: 'sql-01',
    category: 'SQL',
    topicId: 'sql-subqueries',
    title: 'Second Highest Salary',
    problem: 'From the `employees` table, find the second highest distinct salary. If there is no second highest salary, return NULL.',
    input: 'employees(id, name, email, salary, department_id, manager_id)\n\nid | name  | salary\n1  | Asha  | 90000\n2  | Ravi  | 75000\n3  | Meera | 90000\n4  | John  | 60000',
    output: 'second_highest_salary\n75000',
    explanation: 'Approach 1 finds the maximum salary that is smaller than the overall maximum. It is easy to read and naturally returns NULL when there is no second salary.\n\nApproach 2 sorts the distinct salaries from high to low and skips the first one with `OFFSET 1`. Wrapping it in an outer `SELECT` turns "no row" into NULL. Approach 3 uses `DENSE_RANK()`, a window function that gives equal salaries the same rank with no gaps, so it generalises to any Nth salary. Note the `DISTINCT` / `DENSE_RANK`: two people earning 90000 must not both count as "highest".',
    solution: `-- Approach 1: subquery with MAX
SELECT MAX(salary) AS second_highest_salary
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Approach 2: DISTINCT + ORDER BY + LIMIT/OFFSET
SELECT (
  SELECT DISTINCT salary
  FROM employees
  ORDER BY salary DESC
  LIMIT 1 OFFSET 1
) AS second_highest_salary;

-- Approach 3: window function DENSE_RANK
SELECT MAX(salary) AS second_highest_salary
FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
) ranked
WHERE rnk = 2;`,
    complexity: 'Time: O(n) for approach 1, O(n log n) for the sorting approaches (faster with an index on salary)',
    difficulty: 'Easy',
  },
  {
    id: 'sql-02',
    category: 'SQL',
    topicId: 'sql-window-functions',
    title: 'Nth Highest Salary',
    problem: 'Find the Nth highest distinct salary in the `employees` table (the example uses N = 3). Return NULL if fewer than N distinct salaries exist.',
    input: 'employees\n\nid | name  | salary\n1  | Asha  | 90000\n2  | Ravi  | 75000\n3  | Meera | 90000\n4  | John  | 60000\n5  | Sara  | 50000',
    output: 'third_highest_salary\n60000',
    explanation: 'With `DENSE_RANK()` the salaries get ranks 1 (90000), 2 (75000), 3 (60000), 4 (50000). Equal salaries share a rank, so we simply filter `rnk = N`. `ROW_NUMBER()` would be wrong here because it gives two 90000 salaries different numbers, and `RANK()` leaves gaps after ties.\n\nThe `LIMIT 1 OFFSET N - 1` version skips the first N - 1 distinct salaries. The correlated subquery version says "a salary is the Nth highest if exactly N - 1 distinct salaries are greater than it"; it works everywhere but is slow on large tables.',
    solution: `-- Approach 1: DENSE_RANK (replace 3 with N)
SELECT MAX(salary) AS third_highest_salary
FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
) ranked
WHERE rnk = 3;

-- Approach 2: LIMIT / OFFSET (OFFSET = N - 1)
SELECT (
  SELECT DISTINCT salary
  FROM employees
  ORDER BY salary DESC
  LIMIT 1 OFFSET 2
) AS third_highest_salary;

-- Approach 3: correlated subquery (N - 1 = 2 salaries are higher)
SELECT DISTINCT e1.salary AS third_highest_salary
FROM employees e1
WHERE 2 = (
  SELECT COUNT(DISTINCT e2.salary)
  FROM employees e2
  WHERE e2.salary > e1.salary
);`,
    complexity: 'Time: O(n log n) for ranking/sorting, O(n^2) for the correlated subquery',
    difficulty: 'Medium',
  },
  {
    id: 'sql-03',
    category: 'SQL',
    topicId: 'sql-subqueries',
    title: 'Employees with the Highest Salary',
    problem: 'Return every employee who earns the highest salary in the company. If several employees tie for the top salary, return all of them.',
    input: 'employees\n\nid | name  | salary\n1  | Asha  | 90000\n2  | Ravi  | 75000\n3  | Meera | 90000\n4  | John  | 60000',
    output: 'id | name  | salary\n1  | Asha  | 90000\n3  | Meera | 90000',
    explanation: 'The inner query `SELECT MAX(salary) FROM employees` returns a single value (90000). The outer query keeps every row whose salary equals that value, so ties are handled automatically.\n\nA common mistake is `ORDER BY salary DESC LIMIT 1`, which returns only one of the tied employees. The window version with `RANK()` also keeps ties, because tied rows share rank 1.',
    solution: `-- Approach 1: subquery
SELECT id, name, salary
FROM employees
WHERE salary = (SELECT MAX(salary) FROM employees);

-- Approach 2: window function (keeps ties)
SELECT id, name, salary
FROM (
  SELECT id, name, salary, RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
) ranked
WHERE rnk = 1;`,
    complexity: 'Time: O(n) for the subquery version (two scans, or an index lookup)',
    difficulty: 'Easy',
  },
  {
    id: 'sql-04',
    category: 'SQL',
    topicId: 'sql-joins',
    title: 'Department-wise Average Salary',
    problem: 'Show each department name with the number of employees and the average salary, rounded to 2 decimals, highest average first.',
    input: 'employees\n\nid | name  | salary | department_id\n1  | Asha  | 90000  | 1\n2  | Ravi  | 75000  | 1\n3  | Meera | 90000  | 2\n4  | John  | 60000  | 2\n5  | Sara  | 50000  | 2\n\ndepartments\n\nid | name\n1  | Engineering\n2  | Sales',
    output: 'department  | employee_count | avg_salary\nEngineering | 2              | 82500.00\nSales       | 3              | 66666.67',
    explanation: 'Join `employees` to `departments` to get the department name, then `GROUP BY` the department. `AVG` and `COUNT` are aggregate functions that work on each group separately.\n\nWe group by both `d.id` and `d.name` so two departments with the same name are not merged. `ROUND(AVG(...), 2)` works in PostgreSQL because `AVG` of an integer or numeric column returns `numeric`. To filter groups (for example, average above 70000) you would use `HAVING`, not `WHERE`.',
    solution: `SELECT d.name AS department,
       COUNT(e.id) AS employee_count,
       ROUND(AVG(e.salary), 2) AS avg_salary
FROM departments d
JOIN employees e ON e.department_id = d.id
GROUP BY d.id, d.name
ORDER BY avg_salary DESC;

-- Only departments whose average is above 70000:
-- ... GROUP BY d.id, d.name
-- HAVING AVG(e.salary) > 70000;`,
    complexity: 'Time: O(n) for the join with a hash join plus grouping',
    difficulty: 'Easy',
  },
  {
    id: 'sql-05',
    category: 'SQL',
    topicId: 'sql-fundamentals',
    title: 'Find Duplicate Records',
    problem: 'The `employees` table contains duplicate rows where the same person (same name and email) was inserted more than once with different ids. List each duplicated person with how many times they appear, then show how to delete the extra copies while keeping the row with the smallest id.',
    input: 'employees\n\nid | name | email\n1  | Asha | asha@mail.com\n2  | Ravi | ravi@mail.com\n3  | Asha | asha@mail.com\n4  | Asha | asha@mail.com\n5  | Ravi | ravi@mail.com\n6  | John | john@mail.com',
    output: 'name | email         | copies\nAsha | asha@mail.com | 3\nRavi | ravi@mail.com | 2\n\n(after the delete, ids 1, 2 and 6 remain)',
    explanation: 'Grouping by the columns that define a duplicate collapses identical people into one group. `HAVING COUNT(*) > 1` keeps only groups with more than one row.\n\nTo see the full duplicate rows (with ids), `COUNT(*) OVER (PARTITION BY name, email)` adds the group size to every row without collapsing them. To delete extras, keep `MIN(id)` from each group and remove the rest; the PostgreSQL `DELETE ... USING` version joins the table to itself and deletes any row that has a twin with a smaller id.',
    solution: `-- 1. Which records are duplicated, and how often?
SELECT name, email, COUNT(*) AS copies
FROM employees
GROUP BY name, email
HAVING COUNT(*) > 1;

-- 2. Show every duplicate row (with its id) using a window function
SELECT id, name, email
FROM (
  SELECT id, name, email,
         COUNT(*) OVER (PARTITION BY name, email) AS copies
  FROM employees
) t
WHERE copies > 1
ORDER BY name, id;

-- 3a. Delete duplicates, keeping the smallest id per person
DELETE FROM employees
WHERE id NOT IN (
  SELECT MIN(id)
  FROM employees
  GROUP BY name, email
);

-- 3b. PostgreSQL alternative: self-join delete
-- DELETE FROM employees e
-- USING employees other
-- WHERE e.name = other.name
--   AND e.email = other.email
--   AND e.id > other.id;`,
    complexity: 'Time: O(n) to O(n log n) depending on hashing vs sorting for GROUP BY',
    difficulty: 'Medium',
  },
  {
    id: 'sql-06',
    category: 'SQL',
    topicId: 'sql-fundamentals',
    title: 'Duplicate Emails',
    problem: 'Find all email addresses that appear more than once in the `employees` table. Treat emails as case-insensitive.',
    input: 'employees\n\nid | name  | email\n1  | Asha  | asha@mail.com\n2  | Ravi  | ravi@mail.com\n3  | A. S. | Asha@Mail.com\n4  | John  | john@mail.com',
    output: 'email         | occurrences\nasha@mail.com | 2',
    explanation: '`LOWER(email)` makes "Asha@Mail.com" and "asha@mail.com" equal. Group by that lowered value and keep the groups with more than one row using `HAVING`.\n\n`WHERE` filters rows before grouping, while `HAVING` filters groups after aggregation, which is why the count check goes in `HAVING`. The self-join version finds pairs of different rows with the same email; `DISTINCT` removes repeats. To stop this at the source, add a unique index on `LOWER(email)`.',
    solution: `-- Approach 1: GROUP BY + HAVING
SELECT LOWER(email) AS email, COUNT(*) AS occurrences
FROM employees
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;

-- Approach 2: self join
SELECT DISTINCT LOWER(a.email) AS email
FROM employees a
JOIN employees b
  ON LOWER(a.email) = LOWER(b.email)
 AND a.id <> b.id;

-- Prevent future duplicates (PostgreSQL):
-- CREATE UNIQUE INDEX ux_employees_email ON employees (LOWER(email));`,
    complexity: 'Time: O(n) with hash aggregation, Space: O(k) distinct emails',
    difficulty: 'Easy',
  },
  {
    id: 'sql-07',
    category: 'SQL',
    topicId: 'sql-joins',
    title: 'Employees Without a Department',
    problem: 'List employees who are not assigned to any department. This includes employees whose `department_id` is NULL and employees whose `department_id` points to a department that no longer exists.',
    input: 'employees\n\nid | name  | department_id\n1  | Asha  | 1\n2  | Ravi  | NULL\n3  | Meera | 2\n4  | John  | 9\n\ndepartments\n\nid | name\n1  | Engineering\n2  | Sales',
    output: 'id | name\n2  | Ravi\n4  | John',
    explanation: 'A `LEFT JOIN` keeps every employee even when no department matches; the department columns are then NULL. Filtering `WHERE d.id IS NULL` keeps exactly the employees with no matching department, which covers both the NULL case and the missing department (id 9) case.\n\n`NOT EXISTS` expresses the same idea as "there is no department with this id". If you only care about NULL values, the simple `WHERE department_id IS NULL` is enough. Remember that `= NULL` never matches; always use `IS NULL`.',
    solution: `-- Approach 1: LEFT JOIN ... IS NULL (anti-join)
SELECT e.id, e.name
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id
WHERE d.id IS NULL;

-- Approach 2: NOT EXISTS
SELECT e.id, e.name
FROM employees e
WHERE NOT EXISTS (
  SELECT 1
  FROM departments d
  WHERE d.id = e.department_id
);

-- Only employees with no department_id at all:
SELECT id, name
FROM employees
WHERE department_id IS NULL;`,
    complexity: 'Time: O(n + m) with a hash anti-join',
    difficulty: 'Easy',
  },
  {
    id: 'sql-08',
    category: 'SQL',
    topicId: 'sql-window-functions',
    title: 'Top 3 Salaries per Department',
    problem: 'For each department, return the employees whose salary is among the top 3 distinct salaries in that department. Show department name, employee name and salary.',
    input: 'employees\n\nid | name  | salary | department_id\n1  | Joe   | 85000  | 1\n2  | Henry | 80000  | 2\n3  | Sam   | 60000  | 2\n4  | Max   | 90000  | 1\n5  | Janet | 69000  | 1\n6  | Randy | 85000  | 1\n7  | Will  | 70000  | 1\n\ndepartments\n\nid | name\n1  | IT\n2  | Sales',
    output: 'department | employee | salary\nIT         | Max      | 90000\nIT         | Joe      | 85000\nIT         | Randy    | 85000\nIT         | Will     | 70000\nSales      | Henry    | 80000\nSales      | Sam      | 60000',
    explanation: '`PARTITION BY department_id` restarts the ranking for each department, and `ORDER BY salary DESC` ranks from highest to lowest. `DENSE_RANK` gives Joe and Randy the same rank 2, so Will (70000) is still rank 3 and is included.\n\nWindow functions cannot be used directly in `WHERE`, so we compute the rank in a CTE (a named subquery using `WITH`) and filter outside it. If you need exactly 3 rows per department regardless of ties, use `ROW_NUMBER()` instead. The correlated subquery version counts how many distinct higher salaries exist in the same department.',
    solution: `-- Approach 1: CTE + DENSE_RANK window function
WITH ranked AS (
  SELECT e.name,
         e.salary,
         e.department_id,
         DENSE_RANK() OVER (
           PARTITION BY e.department_id
           ORDER BY e.salary DESC
         ) AS rnk
  FROM employees e
)
SELECT d.name AS department, r.name AS employee, r.salary
FROM ranked r
JOIN departments d ON d.id = r.department_id
WHERE r.rnk <= 3
ORDER BY d.name, r.salary DESC, r.name;

-- Approach 2: correlated subquery (no window functions)
SELECT d.name AS department, e.name AS employee, e.salary
FROM employees e
JOIN departments d ON d.id = e.department_id
WHERE (
  SELECT COUNT(DISTINCT e2.salary)
  FROM employees e2
  WHERE e2.department_id = e.department_id
    AND e2.salary > e.salary
) < 3
ORDER BY d.name, e.salary DESC, e.name;`,
    complexity: 'Time: O(n log n) for the window sort, O(n^2) for the correlated subquery',
    difficulty: 'Hard',
  },
  {
    id: 'sql-09',
    category: 'SQL',
    topicId: 'sql-joins',
    title: 'Employees Earning More Than Their Manager',
    problem: 'Find the employees who earn a higher salary than their own manager. The `manager_id` column refers to another row in the same `employees` table.',
    input: 'employees\n\nid | name  | salary | manager_id\n1  | Joe   | 70000  | 3\n2  | Henry | 80000  | 4\n3  | Sam   | 60000  | NULL\n4  | Max   | 90000  | NULL',
    output: 'employee | employee_salary | manager | manager_salary\nJoe      | 70000           | Sam     | 60000',
    explanation: 'This is a self join: we use the same table twice with different aliases, `e` for the employee and `m` for the manager. The join condition `e.manager_id = m.id` pairs each employee with their manager.\n\nAn inner join automatically drops employees without a manager (NULL `manager_id`). Then `WHERE e.salary > m.salary` keeps only those who out-earn their manager. Henry earns 80000 but his manager Max earns 90000, so he is not included.',
    solution: `-- Approach 1: self join
SELECT e.name   AS employee,
       e.salary AS employee_salary,
       m.name   AS manager,
       m.salary AS manager_salary
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;

-- Approach 2: correlated subquery
SELECT e.name AS employee
FROM employees e
WHERE e.salary > (
  SELECT m.salary
  FROM employees m
  WHERE m.id = e.manager_id
);`,
    complexity: 'Time: O(n) with a hash join on id (primary key)',
    difficulty: 'Medium',
  },
  {
    id: 'sql-10',
    category: 'SQL',
    topicId: 'sql-joins',
    title: 'Customers Who Never Ordered',
    problem: 'Using `customers(id, name, email, city)` and `orders(id, customer_id, order_date, amount)`, list the customers who have never placed an order.',
    input: 'customers\n\nid | name\n1  | Asha\n2  | Ravi\n3  | Meera\n4  | John\n\norders\n\nid | customer_id | amount\n1  | 3           | 250\n2  | 1           | 100\n3  | 3           | 75',
    output: 'id | name\n2  | Ravi\n4  | John',
    explanation: 'The `LEFT JOIN` version keeps all customers and fills order columns with NULL where there is no match; `WHERE o.id IS NULL` keeps exactly those customers. `NOT EXISTS` reads naturally as "no order exists for this customer" and is usually the fastest and safest choice.\n\nBe careful with `NOT IN`: if the subquery returns even one NULL `customer_id`, `NOT IN` returns no rows at all, because comparing with NULL is unknown. That is why the subquery filters out NULLs.',
    solution: `-- Approach 1: LEFT JOIN ... IS NULL
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;

-- Approach 2: NOT EXISTS (recommended)
SELECT c.id, c.name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
);

-- Approach 3: NOT IN (filter NULLs, or it may return nothing)
SELECT c.id, c.name
FROM customers c
WHERE c.id NOT IN (
  SELECT o.customer_id FROM orders o WHERE o.customer_id IS NOT NULL
);`,
    complexity: 'Time: O(n + m) with a hash anti-join (index on orders.customer_id helps)',
    difficulty: 'Easy',
  },
  {
    id: 'sql-11',
    category: 'SQL',
    topicId: 'sql-window-functions',
    title: 'Running Total of Orders',
    problem: 'For every order, show the order date, amount and the running total of all order amounts up to and including that order (ordered by date, then id). Also show a running total per customer.',
    input: 'orders\n\nid | customer_id | order_date | amount\n1  | 1           | 2024-01-01 | 100\n2  | 2           | 2024-01-02 | 200\n3  | 1           | 2024-01-03 | 50\n4  | 2           | 2024-01-03 | 25',
    output: 'id | customer_id | order_date | amount | running_total | customer_running_total\n1  | 1           | 2024-01-01 | 100    | 100           | 100\n2  | 2           | 2024-01-02 | 200    | 300           | 200\n3  | 1           | 2024-01-03 | 50     | 350           | 150\n4  | 2           | 2024-01-03 | 25     | 375           | 225',
    explanation: '`SUM(amount) OVER (ORDER BY ...)` is a window function: it adds up amounts from the first row up to the current row, without collapsing rows like `GROUP BY` would. Adding `PARTITION BY customer_id` restarts the total for each customer.\n\nWe write the frame `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` explicitly. The default frame is `RANGE`, which treats rows with the same `ORDER BY` value as one step, so two orders on the same date would both show the combined total. Ordering by `id` as a tie-breaker also keeps the result deterministic. The self-join version shows how it was done before window functions existed.',
    solution: `-- Approach 1: window functions
SELECT id,
       customer_id,
       order_date,
       amount,
       SUM(amount) OVER (
         ORDER BY order_date, id
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total,
       SUM(amount) OVER (
         PARTITION BY customer_id
         ORDER BY order_date, id
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS customer_running_total
FROM orders
ORDER BY order_date, id;

-- Approach 2: correlated subquery (older databases, O(n^2))
SELECT o.id, o.order_date, o.amount,
       (SELECT SUM(o2.amount)
        FROM orders o2
        WHERE o2.order_date < o.order_date
           OR (o2.order_date = o.order_date AND o2.id <= o.id)) AS running_total
FROM orders o
ORDER BY o.order_date, o.id;`,
    complexity: 'Time: O(n log n) for the window sort, O(n^2) for the subquery version',
    difficulty: 'Hard',
  },
  {
    id: 'sql-12',
    category: 'SQL',
    topicId: 'sql-fundamentals',
    title: 'Department with the Most Employees',
    problem: 'Find the department that has the most employees. If several departments tie for the most, return all of them.',
    input: 'employees\n\nid | name  | department_id\n1  | Asha  | 1\n2  | Ravi  | 1\n3  | Meera | 2\n4  | John  | 2\n5  | Sara  | 2\n6  | Tom   | 3\n\ndepartments\n\nid | name\n1  | Engineering\n2  | Sales\n3  | HR',
    output: 'department | employee_count\nSales      | 3',
    explanation: 'Group employees by department, count them, sort by the count descending and take the first row. This is the simplest answer but it silently drops ties.\n\nTo keep ties, compute the counts in a CTE and keep every department whose count equals the maximum count, or rank the counts with `RANK()`. PostgreSQL 13+ also supports `FETCH FIRST 1 ROW WITH TIES`, which returns every row tied with the last one.',
    solution: `-- Approach 1: GROUP BY + ORDER BY + LIMIT (ignores ties)
SELECT d.name AS department, COUNT(*) AS employee_count
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.id, d.name
ORDER BY employee_count DESC
LIMIT 1;

-- Approach 2: CTE, keeps ties
WITH dept_counts AS (
  SELECT d.name AS department, COUNT(*) AS employee_count
  FROM employees e
  JOIN departments d ON d.id = e.department_id
  GROUP BY d.id, d.name
)
SELECT department, employee_count
FROM dept_counts
WHERE employee_count = (SELECT MAX(employee_count) FROM dept_counts);

-- Approach 3: window function RANK, keeps ties
SELECT department, employee_count
FROM (
  SELECT d.name AS department,
         COUNT(*) AS employee_count,
         RANK() OVER (ORDER BY COUNT(*) DESC) AS rnk
  FROM employees e
  JOIN departments d ON d.id = e.department_id
  GROUP BY d.id, d.name
) ranked
WHERE rnk = 1;

-- Approach 4: PostgreSQL 13+ WITH TIES
-- SELECT d.name AS department, COUNT(*) AS employee_count
-- FROM employees e
-- JOIN departments d ON d.id = e.department_id
-- GROUP BY d.id, d.name
-- ORDER BY employee_count DESC
-- FETCH FIRST 1 ROW WITH TIES;`,
    complexity: 'Time: O(n) for grouping plus O(k log k) to sort k departments',
    difficulty: 'Medium',
  },
]

export default questions
