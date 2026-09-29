const questions = [
  {
    id: 'stacks-queues-01',
    category: 'Stacks & Queues',
    topicId: 'java-collections',
    title: 'Valid Parentheses',
    problem: 'Given a string containing only the characters ( ) { } [ ], return true if every opening bracket is closed by the same type of bracket in the correct order.',
    input: 's = "{[()]}()"',
    output: 'true   (and "(]" or "([)]" return false)',
    explanation: "A stack is the natural fit because the most recently opened bracket must be the first one closed (last in, first out). Push every opening bracket. For a closing bracket, the stack must not be empty and its top must be the matching opening bracket; pop it.\n\nAt the end the stack must be empty, otherwise some brackets were never closed. Use `ArrayDeque` rather than the legacy `Stack` class, which is synchronized and extends `Vector`.",
    solution: `public static boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        switch (c) {
            case '(', '{', '[' -> stack.push(c);
            case ')' -> { if (stack.isEmpty() || stack.pop() != '(') return false; }
            case '}' -> { if (stack.isEmpty() || stack.pop() != '{') return false; }
            case ']' -> { if (stack.isEmpty() || stack.pop() != '[') return false; }
            default -> { return false; }       // unexpected character
        }
    }
    return stack.isEmpty();
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'stacks-queues-02',
    category: 'Stacks & Queues',
    topicId: 'java-collections',
    title: 'Min Stack',
    problem: 'Design a stack that supports push, pop, top and getMin, all in O(1) time. getMin returns the smallest element currently in the stack.',
    input: 'push(5), push(3), push(7), getMin(), pop(), pop(), getMin()',
    output: '3, then 5',
    explanation: "Scanning the stack for the minimum would be O(n). Instead keep a second stack that holds the minimum at each depth. When you push x, also push `min(x, current minimum)` onto the min stack. When you pop, pop both stacks. The top of the min stack is always the minimum of everything below it.\n\nThis works because a stack only changes at the top, so the minimum for each depth never changes once computed.",
    solution: `class MinStack {
    private final Deque<Integer> values = new ArrayDeque<>();
    private final Deque<Integer> mins = new ArrayDeque<>();

    public void push(int x) {
        values.push(x);
        mins.push(mins.isEmpty() ? x : Math.min(x, mins.peek()));
    }

    public int pop() {
        mins.pop();
        return values.pop();
    }

    public int top() {
        return values.peek();
    }

    public int getMin() {
        return mins.peek();
    }
}`,
    complexity: 'Time: O(1) for every operation, Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'stacks-queues-03',
    category: 'Stacks & Queues',
    topicId: 'java-collections',
    title: 'Next Greater Element',
    problem: 'For each element of an array, find the next element to its right that is greater than it. Use -1 if there is none.',
    input: 'nums = [4, 5, 2, 25, 7]',
    output: '[5, 25, 25, -1, -1]',
    explanation: "The brute force checks every element to the right, O(n^2). A monotonic stack does it in one pass: the stack holds indexes of elements still waiting for their next greater element, and their values are decreasing from bottom to top.\n\nFor each new element, pop every index whose value is smaller than it; the new element is their answer. Then push the new index. Each index is pushed and popped at most once, so the total work is O(n). Whatever remains on the stack at the end has no greater element.",
    solution: `public static int[] nextGreater(int[] nums) {
    int[] result = new int[nums.length];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();          // indexes, values decreasing
    for (int i = 0; i < nums.length; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
            result[stack.pop()] = nums[i];
        }
        stack.push(i);
    }
    return result;
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'stacks-queues-04',
    category: 'Stacks & Queues',
    topicId: 'java-collections',
    title: 'Daily Temperatures',
    problem: 'Given daily temperatures, return for each day how many days you have to wait until a warmer temperature. Use 0 if there is no warmer day.',
    input: 'temps = [73, 74, 75, 71, 69, 72, 76, 73]',
    output: '[1, 1, 4, 2, 1, 1, 0, 0]',
    explanation: "This is the next greater element problem, but the answer is a distance instead of a value. Keep a stack of indexes of days that have not yet seen a warmer day. When today's temperature is higher than the day on top of the stack, that day's answer is `today - thatDay`; pop it and repeat.\n\nThe same monotonic stack pattern solves stock span, the largest rectangle in a histogram and trapping rain water.",
    solution: `public static int[] dailyTemperatures(int[] temps) {
    int[] wait = new int[temps.length];                  // defaults to 0
    Deque<Integer> stack = new ArrayDeque<>();
    for (int today = 0; today < temps.length; today++) {
        while (!stack.isEmpty() && temps[stack.peek()] < temps[today]) {
            int day = stack.pop();
            wait[day] = today - day;
        }
        stack.push(today);
    }
    return wait;
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'stacks-queues-05',
    category: 'Stacks & Queues',
    topicId: 'java-collections',
    title: 'Evaluate Reverse Polish Notation',
    problem: 'Evaluate an arithmetic expression in postfix notation (Reverse Polish Notation). Tokens are integers or one of + - * /. Division truncates toward zero.',
    input: 'tokens = ["2", "1", "+", "3", "*"]',
    output: '9   ((2 + 1) * 3)',
    explanation: "In postfix notation the operator comes after its operands, so no parentheses are needed. Scan the tokens left to right: push numbers onto a stack; when you see an operator, pop two numbers, apply the operator and push the result.\n\nThe order of the pops matters for - and /: the first value popped is the right operand. For [\"4\", \"2\", \"-\"] you pop 2 then 4 and compute 4 - 2. Java's integer division already truncates toward zero.",
    solution: `public static int evalRPN(String[] tokens) {
    Deque<Integer> stack = new ArrayDeque<>();
    for (String t : tokens) {
        switch (t) {
            case "+", "-", "*", "/" -> {
                int right = stack.pop();
                int left = stack.pop();
                stack.push(switch (t) {
                    case "+" -> left + right;
                    case "-" -> left - right;
                    case "*" -> left * right;
                    default -> left / right;
                });
            }
            default -> stack.push(Integer.parseInt(t));
        }
    }
    return stack.pop();
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'stacks-queues-06',
    category: 'Stacks & Queues',
    topicId: 'java-collections',
    title: 'Implement a Queue Using Two Stacks',
    problem: 'Implement a FIFO queue with push, pop, peek and isEmpty using only two stacks.',
    input: 'push(1), push(2), peek(), pop(), isEmpty()',
    output: '1, 1, false',
    explanation: "Use an `in` stack for pushes and an `out` stack for pops. Reversing a stack once turns LIFO into FIFO: when `out` is empty and you need to pop or peek, move every element from `in` to `out`. The oldest element is now on top of `out`.\n\nOnly move elements when `out` is empty; otherwise you would break the order. Each element is moved at most once, so although a single pop can be O(n), the amortized cost per operation is O(1).",
    solution: `class TwoStackQueue {
    private final Deque<Integer> in = new ArrayDeque<>();
    private final Deque<Integer> out = new ArrayDeque<>();

    public void push(int x) {
        in.push(x);
    }

    public int pop() {
        moveIfNeeded();
        return out.pop();
    }

    public int peek() {
        moveIfNeeded();
        return out.peek();
    }

    public boolean isEmpty() {
        return in.isEmpty() && out.isEmpty();
    }

    private void moveIfNeeded() {
        if (out.isEmpty()) {
            while (!in.isEmpty()) {
                out.push(in.pop());
            }
        }
    }
}`,
    complexity: 'Time: amortized O(1) per operation, Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'stacks-queues-07',
    category: 'Stacks & Queues',
    topicId: 'java-collections',
    title: 'Implement a Stack Using a Queue',
    problem: 'Implement a LIFO stack with push, pop, top and isEmpty using only queue operations (offer, poll, peek, size).',
    input: 'push(1), push(2), top(), pop(), isEmpty()',
    output: '2, 2, false',
    explanation: "After adding a new element to the back of the queue, rotate the queue: move every element that was there before to the back, one by one. The new element is now at the front, so the front of the queue always holds the most recently pushed element.\n\nThis makes push O(n) and pop O(1). The opposite trade-off (cheap push, expensive pop) is also possible. The question mainly tests whether you understand the difference between FIFO and LIFO.",
    solution: `class QueueStack {
    private final Queue<Integer> queue = new ArrayDeque<>();

    public void push(int x) {
        queue.offer(x);
        for (int i = 0; i < queue.size() - 1; i++) {
            queue.offer(queue.poll());        // rotate older elements behind x
        }
    }

    public int pop() {
        return queue.poll();
    }

    public int top() {
        return queue.peek();
    }

    public boolean isEmpty() {
        return queue.isEmpty();
    }
}`,
    complexity: 'Time: O(n) push, O(1) pop and top; Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'stacks-queues-08',
    category: 'Stacks & Queues',
    topicId: 'java-collections',
    title: 'Sliding Window Maximum',
    problem: 'Given an array and a window size k, return the maximum of each window of k consecutive elements as the window slides from left to right.',
    input: 'nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3',
    output: '[3, 3, 5, 5, 6, 7]',
    explanation: "Recomputing each window is O(n * k). Use a deque of indexes whose values are decreasing from front to back. The front is always the maximum of the current window.\n\nFor each new index i: remove the front if it has slid out of the window (index <= i - k). Remove from the back every index whose value is smaller than nums[i], because it can never be a maximum again while nums[i] is in the window. Add i to the back. Once the first window is complete (i >= k - 1), the front is that window's answer. Each index enters and leaves the deque once, giving O(n).",
    solution: `public static int[] maxSlidingWindow(int[] nums, int k) {
    int[] result = new int[nums.length - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();          // indexes, values decreasing
    for (int i = 0; i < nums.length; i++) {
        if (!deque.isEmpty() && deque.peekFirst() <= i - k) {
            deque.pollFirst();                          // out of the window
        }
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
            deque.pollLast();                           // can never be the max
        }
        deque.offerLast(i);
        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }
    return result;
}`,
    complexity: 'Time: O(n), Space: O(k)',
    difficulty: 'Hard',
  },
  {
    id: 'stacks-queues-09',
    category: 'Stacks & Queues',
    topicId: 'java-collections',
    title: 'Design a Circular Queue',
    problem: 'Implement a fixed-capacity queue on top of an array, with enqueue, dequeue, front, isEmpty and isFull. enqueue returns false when the queue is full.',
    input: 'capacity 3: enqueue(1), enqueue(2), enqueue(3), enqueue(4), dequeue(), enqueue(4), front()',
    output: 'true, true, true, false, 1, true, 2',
    explanation: "A plain array queue wastes the slots at the front after dequeues. A circular (ring) buffer reuses them by wrapping indexes around with modulo: the next slot after the last index is index 0.\n\nKeep the index of the front element (`head`) and a `size` counter. The back position is `(head + size) % capacity`. Tracking size separately avoids the classic ambiguity where head == tail could mean either empty or full. Ring buffers are used in logging systems, network drivers and `ArrayDeque` itself.",
    solution: `class CircularQueue {
    private final int[] data;
    private int head = 0;
    private int size = 0;

    CircularQueue(int capacity) {
        data = new int[capacity];
    }

    public boolean enqueue(int x) {
        if (isFull()) return false;
        data[(head + size) % data.length] = x;
        size++;
        return true;
    }

    public int dequeue() {
        if (isEmpty()) throw new NoSuchElementException("queue is empty");
        int value = data[head];
        head = (head + 1) % data.length;
        size--;
        return value;
    }

    public int front() {
        if (isEmpty()) throw new NoSuchElementException("queue is empty");
        return data[head];
    }

    public boolean isEmpty() { return size == 0; }

    public boolean isFull() { return size == data.length; }
}`,
    complexity: 'Time: O(1) for every operation, Space: O(capacity)',
    difficulty: 'Medium',
  },
  {
    id: 'stacks-queues-10',
    category: 'Stacks & Queues',
    topicId: 'java-collections',
    title: 'Decode a String',
    problem: 'Decode strings of the form k[encoded], where the encoded part inside the brackets is repeated k times. Brackets can be nested.',
    input: 's = "3[a2[c]]"',
    output: '"accaccacc"',
    explanation: "Nesting suggests a stack. Scan the string while building the current string and the current number. On `[`, push the count and the string built so far onto two stacks, then start fresh for the inside. On `]`, the current string is the inside part: pop the count and the outer string, and set current = outer + inside repeated count times.\n\nDigits can form multi-digit numbers such as 12[a], so build the number with `num = num * 10 + digit`.",
    solution: `public static String decode(String s) {
    Deque<Integer> counts = new ArrayDeque<>();
    Deque<StringBuilder> outers = new ArrayDeque<>();
    StringBuilder current = new StringBuilder();
    int num = 0;

    for (char c : s.toCharArray()) {
        if (Character.isDigit(c)) {
            num = num * 10 + (c - '0');
        } else if (c == '[') {
            counts.push(num);
            outers.push(current);
            current = new StringBuilder();
            num = 0;
        } else if (c == ']') {
            String inside = current.toString();
            current = outers.pop().append(inside.repeat(counts.pop()));
        } else {
            current.append(c);
        }
    }
    return current.toString();
}`,
    complexity: 'Time: O(length of the output), Space: O(length of the output)',
    difficulty: 'Medium',
  },
  {
    id: 'stacks-queues-11',
    category: 'Stacks & Queues',
    topicId: 'java-collections',
    title: 'Simplify a Unix File Path',
    problem: 'Given an absolute Unix path, return its simplified canonical form. "." means the current directory, ".." means the parent directory, and multiple slashes count as one.',
    input: 'path = "/home//user/./docs/../photos/"',
    output: '"/home/user/photos"',
    explanation: "Split the path on \"/\" and process the parts in order with a stack of directory names. Skip empty parts (from repeated slashes) and \".\". For \"..\", pop the last directory if there is one (you cannot go above the root). Any other name is pushed.\n\nFinally join the stack from bottom to top with \"/\". Using a `Deque` with `addLast` and `pollLast` lets you read the elements in the right order with `String.join` at the end.",
    solution: `public static String simplifyPath(String path) {
    Deque<String> dirs = new ArrayDeque<>();
    for (String part : path.split("/")) {
        if (part.isEmpty() || part.equals(".")) {
            continue;
        }
        if (part.equals("..")) {
            dirs.pollLast();                 // no-op at the root
        } else {
            dirs.addLast(part);
        }
    }
    return "/" + String.join("/", dirs);
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'stacks-queues-12',
    category: 'Stacks & Queues',
    topicId: 'java-collections',
    title: 'Largest Rectangle in a Histogram',
    problem: 'Given bar heights of a histogram where each bar has width 1, return the area of the largest rectangle that fits inside the histogram.',
    input: 'heights = [2, 1, 5, 6, 2, 3]',
    output: '10   (bars 5 and 6, height 5, width 2)',
    explanation: "For each bar, the largest rectangle using that bar's full height extends left and right until it meets a shorter bar. A monotonic stack of indexes with increasing heights finds both boundaries in one pass.\n\nWhen the current bar is shorter than the bar on top of the stack, the top bar cannot extend further right. Pop it: its right boundary is the current index, and its left boundary is the new top of the stack (or -1 if empty). Its area is height * (right - left - 1). Processing a final bar of height 0 flushes everything left on the stack.",
    solution: `public static int largestRectangle(int[] heights) {
    Deque<Integer> stack = new ArrayDeque<>();          // indexes, heights increasing
    int best = 0;
    for (int i = 0; i <= heights.length; i++) {
        int h = (i == heights.length) ? 0 : heights[i];  // sentinel bar at the end
        while (!stack.isEmpty() && heights[stack.peek()] > h) {
            int height = heights[stack.pop()];
            int left = stack.isEmpty() ? -1 : stack.peek();
            best = Math.max(best, height * (i - left - 1));
        }
        stack.push(i);
    }
    return best;
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Hard',
  },
]

export default questions
