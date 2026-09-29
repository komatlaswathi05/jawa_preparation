// All problems use this node class:
//
// class ListNode {
//     int val;
//     ListNode next;
//     ListNode(int val) { this.val = val; }
// }

const questions = [
  {
    id: 'linked-lists-01',
    category: 'Linked Lists',
    topicId: 'java-collections',
    title: 'Build and Print a Linked List',
    problem: 'Define a singly linked list node class, build a list from an array, and print it in the form 1 -> 2 -> 3 -> null.',
    input: 'values = [1, 2, 3]',
    output: '1 -> 2 -> 3 -> null',
    explanation: "A singly linked list is a chain of nodes. Each node stores a value and a reference to the next node; the last node points to null. Unlike an array, there is no index, so to reach the fifth node you must walk from the head.\n\nA handy trick when building a list is a dummy (sentinel) head node: you always append to `tail.next`, so the first element needs no special case. At the end, `dummy.next` is the real head. Every other problem in this category builds on these two helpers.",
    solution: `class ListNode {
    int val;
    ListNode next;

    ListNode(int val) {
        this.val = val;
    }
}

public static ListNode fromArray(int[] values) {
    ListNode dummy = new ListNode(0);
    ListNode tail = dummy;
    for (int v : values) {
        tail.next = new ListNode(v);
        tail = tail.next;
    }
    return dummy.next;
}

public static String toText(ListNode head) {
    StringBuilder sb = new StringBuilder();
    for (ListNode cur = head; cur != null; cur = cur.next) {
        sb.append(cur.val).append(" -> ");
    }
    return sb.append("null").toString();
}`,
    complexity: 'Time: O(n), Space: O(n) for the nodes',
    difficulty: 'Easy',
  },
  {
    id: 'linked-lists-02',
    category: 'Linked Lists',
    topicId: 'java-collections',
    title: 'Reverse a Linked List (Iterative)',
    problem: 'Reverse a singly linked list in place and return the new head.',
    input: '1 -> 2 -> 3 -> 4 -> 5',
    output: '5 -> 4 -> 3 -> 2 -> 1',
    explanation: "Walk the list once and flip each `next` pointer to point backwards. You need three references: `prev` (the already-reversed part, initially null), `cur` (the node being processed) and `next` (saved before you overwrite `cur.next`, otherwise you lose the rest of the list).\n\nAt each step: save `next`, point `cur.next` to `prev`, then move `prev` and `cur` one step forward. When `cur` becomes null, `prev` is the new head. This is the single most frequently asked linked list question.",
    solution: `public static ListNode reverse(ListNode head) {
    ListNode prev = null;
    ListNode cur = head;
    while (cur != null) {
        ListNode next = cur.next;   // remember the rest
        cur.next = prev;            // flip the pointer
        prev = cur;                 // advance prev
        cur = next;                 // advance cur
    }
    return prev;
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'linked-lists-03',
    category: 'Linked Lists',
    topicId: 'java-collections',
    title: 'Reverse a Linked List (Recursive)',
    problem: 'Reverse a singly linked list using recursion.',
    input: '1 -> 2 -> 3',
    output: '3 -> 2 -> 1',
    explanation: "Trust the recursion: `reverse(head.next)` reverses everything after the head and returns the new head (the old last node). After that call, `head.next` is still the node that used to follow head, and it is now the tail of the reversed part. So set `head.next.next = head` to attach head at the end, and `head.next = null` to make it the new tail.\n\nThe base case is an empty list or a single node, which is already reversed. This version uses O(n) stack space, so the iterative version is preferred for long lists.",
    solution: `public static ListNode reverseRecursive(ListNode head) {
    if (head == null || head.next == null) {
        return head;                          // base case
    }
    ListNode newHead = reverseRecursive(head.next);
    head.next.next = head;                    // node after head now points back to head
    head.next = null;                         // head becomes the tail
    return newHead;
}`,
    complexity: 'Time: O(n), Space: O(n) for the call stack',
    difficulty: 'Medium',
  },
  {
    id: 'linked-lists-04',
    category: 'Linked Lists',
    topicId: 'java-collections',
    title: 'Find the Middle Node',
    problem: 'Return the middle node of a linked list. If there are two middle nodes, return the second one.',
    input: '1 -> 2 -> 3 -> 4 -> 5 -> 6',
    output: '4',
    explanation: "Use two pointers moving at different speeds: `slow` moves one step and `fast` moves two steps at a time. When `fast` reaches the end, `slow` has covered half the distance and is at the middle.\n\nThis fast/slow (tortoise and hare) technique finds the middle in one pass without counting the length first. It is also the first step of many other problems, such as checking for a palindrome or sorting a list with merge sort.",
    solution: `public static ListNode middle(ListNode head) {
    ListNode slow = head;
    ListNode fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'linked-lists-05',
    category: 'Linked Lists',
    topicId: 'java-collections',
    title: 'Detect a Cycle (Floyd)',
    problem: 'Return true if the linked list contains a cycle, meaning some node can be reached again by following next pointers.',
    input: '3 -> 2 -> 0 -> -4, and -4 points back to 2',
    output: 'true',
    explanation: "A HashSet of visited nodes works but needs O(n) extra memory. Floyd's cycle detection uses O(1): move `slow` one step and `fast` two steps. If there is no cycle, `fast` reaches null. If there is a cycle, both pointers eventually loop inside it, and because `fast` gains one node per step on `slow`, it must land on the same node.\n\nCompare node references with `==`, not values: two different nodes can hold the same value.",
    solution: `public static boolean hasCycle(ListNode head) {
    ListNode slow = head;
    ListNode fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {        // same node, not same value
            return true;
        }
    }
    return false;
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'linked-lists-06',
    category: 'Linked Lists',
    topicId: 'java-collections',
    title: 'Find the Start of a Cycle',
    problem: 'If the list has a cycle, return the node where the cycle begins; otherwise return null.',
    input: '3 -> 2 -> 0 -> -4, and -4 points back to 2',
    output: 'node with value 2',
    explanation: "First find a meeting point with Floyd's algorithm. Then put one pointer back at the head and keep the other at the meeting point, and move both one step at a time. They meet exactly at the start of the cycle.\n\nWhy: let the distance from head to cycle start be a, and from cycle start to the meeting point be b, with cycle length c. Fast travelled twice as far as slow, so 2(a + b) = a + b + k*c, which gives a = k*c - b. Walking a steps from the meeting point therefore lands on the cycle start, the same place a pointer from the head reaches after a steps.",
    solution: `public static ListNode cycleStart(ListNode head) {
    ListNode slow = head;
    ListNode fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            ListNode p = head;
            while (p != slow) {
                p = p.next;
                slow = slow.next;
            }
            return p;               // start of the cycle
        }
    }
    return null;                    // no cycle
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'linked-lists-07',
    category: 'Linked Lists',
    topicId: 'java-collections',
    title: 'Merge Two Sorted Lists',
    problem: 'Merge two sorted linked lists into one sorted list by splicing the nodes together, and return its head.',
    input: 'l1 = 1 -> 2 -> 4, l2 = 1 -> 3 -> 4',
    output: '1 -> 1 -> 2 -> 3 -> 4 -> 4',
    explanation: "Use a dummy head and a `tail` pointer. Compare the heads of both lists, attach the smaller node to `tail`, and advance that list. When one list runs out, attach the remainder of the other list in one step, because it is already sorted.\n\nNo new nodes are created; we only relink existing ones. This is the merge step of merge sort, and a building block for merging k sorted lists with a PriorityQueue.",
    solution: `public static ListNode mergeSorted(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0);
    ListNode tail = dummy;
    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) {
            tail.next = l1;
            l1 = l1.next;
        } else {
            tail.next = l2;
            l2 = l2.next;
        }
        tail = tail.next;
    }
    tail.next = (l1 != null) ? l1 : l2;   // attach the leftover part
    return dummy.next;
}`,
    complexity: 'Time: O(n + m), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'linked-lists-08',
    category: 'Linked Lists',
    topicId: 'java-collections',
    title: 'Remove the Nth Node from the End',
    problem: 'Remove the nth node from the end of the list in one pass and return the head.',
    input: '1 -> 2 -> 3 -> 4 -> 5, n = 2',
    output: '1 -> 2 -> 3 -> 5',
    explanation: "Move a `fast` pointer n + 1 steps ahead of a `slow` pointer, both starting at a dummy node placed before the head. Then move both together until `fast` is null. Now `slow` is exactly one node before the one to delete, so `slow.next = slow.next.next` removes it.\n\nThe dummy node handles the tricky case where the head itself must be removed (n equals the length) without any special code.",
    solution: `public static ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode fast = dummy;
    ListNode slow = dummy;
    for (int i = 0; i <= n; i++) {      // n + 1 steps ahead
        fast = fast.next;
    }
    while (fast != null) {
        fast = fast.next;
        slow = slow.next;
    }
    slow.next = slow.next.next;         // skip the target node
    return dummy.next;
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'linked-lists-09',
    category: 'Linked Lists',
    topicId: 'java-collections',
    title: 'Palindrome Linked List',
    problem: 'Return true if the values of the linked list read the same forwards and backwards.',
    input: '1 -> 2 -> 2 -> 1',
    output: 'true',
    explanation: "Copying values into an array works in O(n) space. For O(1) space: find the middle with slow/fast pointers, reverse the second half, then compare the first half with the reversed second half node by node.\n\nFor an odd-length list the middle node ends up at the end of the reversed half and is simply not compared against anything, which is correct. In production code you would reverse the second half back afterwards so the caller's list is unchanged.",
    solution: `public static boolean isPalindrome(ListNode head) {
    // 1. find the middle
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    // 2. reverse the second half
    ListNode second = reverse(slow);
    // 3. compare both halves
    ListNode p1 = head, p2 = second;
    boolean result = true;
    while (p2 != null) {
        if (p1.val != p2.val) {
            result = false;
            break;
        }
        p1 = p1.next;
        p2 = p2.next;
    }
    reverse(second);                 // optional: restore the list
    return result;
}

private static ListNode reverse(ListNode head) {
    ListNode prev = null;
    while (head != null) {
        ListNode next = head.next;
        head.next = prev;
        prev = head;
        head = next;
    }
    return prev;
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'linked-lists-10',
    category: 'Linked Lists',
    topicId: 'java-collections',
    title: 'Intersection of Two Linked Lists',
    problem: 'Two singly linked lists may join at some node and share the rest. Return the first shared node, or null if they never meet.',
    input: 'A = 4 -> 1 -> 8 -> 4 -> 5, B = 5 -> 6 -> 1 -> 8 -> 4 -> 5 (sharing the nodes from 8 onwards)',
    output: 'node with value 8',
    explanation: "Walk pointer `a` along list A and pointer `b` along list B. When a pointer reaches the end, redirect it to the head of the other list. Both pointers then travel exactly lenA + lenB steps, so they line up and arrive at the intersection at the same time.\n\nIf the lists do not intersect, both pointers become null at the same moment after lenA + lenB steps, and the loop ends returning null. Like cycle detection, this compares node references, not values.",
    solution: `public static ListNode intersection(ListNode headA, ListNode headB) {
    ListNode a = headA;
    ListNode b = headB;
    while (a != b) {
        a = (a == null) ? headB : a.next;
        b = (b == null) ? headA : b.next;
    }
    return a;          // intersection node, or null
}`,
    complexity: 'Time: O(n + m), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'linked-lists-11',
    category: 'Linked Lists',
    topicId: 'java-collections',
    title: 'Add Two Numbers Stored as Lists',
    problem: 'Two non-negative numbers are stored as linked lists with digits in reverse order (the ones digit first). Return their sum as a list in the same format.',
    input: 'l1 = 2 -> 4 -> 3 (342), l2 = 5 -> 6 -> 4 (465)',
    output: '7 -> 0 -> 8 (807)',
    explanation: "This is school addition, digit by digit, starting from the ones place, which is conveniently at the head. At each step add the two digits and the carry, append `sum % 10` to the result and keep `sum / 10` as the new carry.\n\nKeep looping while either list has digits left or the carry is non-zero, so that a final carry such as 5 + 5 = 10 produces an extra node. Because we never convert to int or long, this works for numbers with thousands of digits.",
    solution: `public static ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0);
    ListNode tail = dummy;
    int carry = 0;
    while (l1 != null || l2 != null || carry != 0) {
        int sum = carry;
        if (l1 != null) {
            sum += l1.val;
            l1 = l1.next;
        }
        if (l2 != null) {
            sum += l2.val;
            l2 = l2.next;
        }
        tail.next = new ListNode(sum % 10);
        tail = tail.next;
        carry = sum / 10;
    }
    return dummy.next;
}`,
    complexity: 'Time: O(max(n, m)), Space: O(max(n, m)) for the result',
    difficulty: 'Medium',
  },
  {
    id: 'linked-lists-12',
    category: 'Linked Lists',
    topicId: 'java-collections',
    title: 'Reverse Nodes in Groups of K',
    problem: 'Reverse the nodes of a linked list k at a time. If the number of remaining nodes is less than k, leave them as they are.',
    input: '1 -> 2 -> 3 -> 4 -> 5, k = 2',
    output: '2 -> 1 -> 4 -> 3 -> 5',
    explanation: "Process the list group by group. `groupPrev` is the node just before the current group (start with a dummy). First check that k nodes exist ahead; if not, stop. Then reverse exactly those k nodes with the usual prev/cur loop, where `prev` starts as the node after the group so the reversed group links correctly to the rest.\n\nAfter reversing, the old first node of the group is now its last node. Connect `groupPrev.next` to the new first node and move `groupPrev` to the old first node, ready for the next group.",
    solution: `public static ListNode reverseKGroup(ListNode head, int k) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode groupPrev = dummy;

    while (true) {
        // find the kth node of this group
        ListNode kth = groupPrev;
        for (int i = 0; i < k && kth != null; i++) {
            kth = kth.next;
        }
        if (kth == null) {
            break;                            // fewer than k nodes left
        }
        ListNode groupNext = kth.next;

        // reverse the group
        ListNode prev = groupNext;
        ListNode cur = groupPrev.next;
        while (cur != groupNext) {
            ListNode next = cur.next;
            cur.next = prev;
            prev = cur;
            cur = next;
        }

        ListNode oldFirst = groupPrev.next;   // now the last node of the group
        groupPrev.next = kth;                 // kth is the new first node
        groupPrev = oldFirst;
    }
    return dummy.next;
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Hard',
  },
]

export default questions
