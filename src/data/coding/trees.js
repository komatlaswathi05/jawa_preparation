// All problems use this node class:
//
// class TreeNode {
//     int val;
//     TreeNode left, right;
//     TreeNode(int val) { this.val = val; }
// }

const questions = [
  {
    id: 'trees-01',
    category: 'Trees & BST',
    topicId: 'java-collections',
    title: 'Inorder, Preorder and Postorder Traversal',
    problem: 'Given the root of a binary tree, return the values in inorder (left, root, right), preorder (root, left, right) and postorder (left, right, root) order.',
    input: 'Tree:     4\n        /   \\\n       2     6\n      / \\   / \\\n     1   3 5   7',
    output: 'inorder [1, 2, 3, 4, 5, 6, 7], preorder [4, 2, 1, 3, 6, 5, 7], postorder [1, 3, 2, 5, 7, 6, 4]',
    explanation: "A binary tree node has a value and up to two children. The three depth-first traversals differ only in when you visit the current node relative to its subtrees. The recursive code is almost identical: recurse left, recurse right, and put the \"visit\" line before, between or after them.\n\nInorder on a binary search tree gives the values in sorted order, which is why it appears in so many BST problems. Preorder is used to copy or serialize a tree, and postorder to delete a tree or compute values that depend on the children first, such as height.",
    solution: `class TreeNode {
    int val;
    TreeNode left, right;

    TreeNode(int val) {
        this.val = val;
    }
}

public static void inorder(TreeNode node, List<Integer> out) {
    if (node == null) return;
    inorder(node.left, out);
    out.add(node.val);          // visit between the children
    inorder(node.right, out);
}

public static void preorder(TreeNode node, List<Integer> out) {
    if (node == null) return;
    out.add(node.val);          // visit first
    preorder(node.left, out);
    preorder(node.right, out);
}

public static void postorder(TreeNode node, List<Integer> out) {
    if (node == null) return;
    postorder(node.left, out);
    postorder(node.right, out);
    out.add(node.val);          // visit last
}`,
    complexity: 'Time: O(n), Space: O(h) for the call stack, where h is the tree height',
    difficulty: 'Easy',
  },
  {
    id: 'trees-02',
    category: 'Trees & BST',
    topicId: 'java-collections',
    title: 'Iterative Inorder Traversal',
    problem: 'Return the inorder traversal of a binary tree without using recursion.',
    input: 'Tree:  1\n        \\\n         2\n        /\n       3',
    output: '[1, 3, 2]',
    explanation: "Recursion uses the call stack implicitly; the iterative version uses an explicit `Deque` as a stack. Go as far left as possible, pushing every node on the way. When you cannot go left any more, pop a node, visit it, and then move to its right child and repeat.\n\nInterviewers ask for this to check that you understand what recursion does under the hood. It also avoids a StackOverflowError on very deep (unbalanced) trees.",
    solution: `public static List<Integer> inorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !stack.isEmpty()) {
        while (cur != null) {          // go left as far as possible
            stack.push(cur);
            cur = cur.left;
        }
        cur = stack.pop();
        result.add(cur.val);           // visit
        cur = cur.right;               // then the right subtree
    }
    return result;
}`,
    complexity: 'Time: O(n), Space: O(h)',
    difficulty: 'Medium',
  },
  {
    id: 'trees-03',
    category: 'Trees & BST',
    topicId: 'java-collections',
    title: 'Level Order Traversal (BFS)',
    problem: 'Return the values of a binary tree level by level, from left to right, as a list of lists.',
    input: 'Tree:    3\n        / \\\n       9   20\n          /  \\\n         15   7',
    output: '[[3], [9, 20], [15, 7]]',
    explanation: "Breadth-first search visits nodes in order of their distance from the root, which is exactly level by level. Use a queue: start with the root, and repeatedly take nodes from the front and add their children to the back.\n\nTo group values by level, record the queue size at the start of each round. That many nodes belong to the current level; process exactly those, and the children you add form the next level. The same pattern solves right side view, zigzag order and minimum depth.",
    solution: `public static List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> levels = new ArrayList<>();
    if (root == null) return levels;

    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();             // nodes on this level
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        levels.add(level);
    }
    return levels;
}`,
    complexity: 'Time: O(n), Space: O(w), where w is the maximum width of the tree',
    difficulty: 'Medium',
  },
  {
    id: 'trees-04',
    category: 'Trees & BST',
    topicId: 'java-collections',
    title: 'Maximum Depth of a Binary Tree',
    problem: 'Return the maximum depth of a binary tree: the number of nodes on the longest path from the root down to a leaf.',
    input: 'Tree:    3\n        / \\\n       9   20\n          /  \\\n         15   7',
    output: '3',
    explanation: "The depth of a tree is one (for the root) plus the larger of the depths of its two subtrees. An empty tree has depth 0. This is the classic example of a problem that becomes one line once you think recursively.\n\nThe recursion is a postorder traversal: you need both children's answers before you can compute the current node's answer.",
    solution: `public static int maxDepth(TreeNode root) {
    if (root == null) {
        return 0;
    }
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`,
    complexity: 'Time: O(n), Space: O(h)',
    difficulty: 'Easy',
  },
  {
    id: 'trees-05',
    category: 'Trees & BST',
    topicId: 'java-collections',
    title: 'Check if a Tree Is Balanced',
    problem: 'A binary tree is height-balanced if, for every node, the heights of its left and right subtrees differ by at most one. Return true if the tree is balanced.',
    input: 'Tree:    1\n        / \\\n       2   2\n      / \\\n     3   3\n    / \\\n   4   4',
    output: 'false',
    explanation: "The naive solution calls a height function at every node, which is O(n^2) for skewed trees. Instead, compute height and balance in the same postorder pass: a helper returns the height of a subtree, or -1 as a signal that it is already unbalanced.\n\nAs soon as any subtree reports -1, or the two heights differ by more than one, return -1 immediately. Each node is visited once, so the whole check is O(n).",
    solution: `public static boolean isBalanced(TreeNode root) {
    return height(root) != -1;
}

// returns the height, or -1 if the subtree is not balanced
private static int height(TreeNode node) {
    if (node == null) return 0;

    int left = height(node.left);
    if (left == -1) return -1;
    int right = height(node.right);
    if (right == -1) return -1;

    if (Math.abs(left - right) > 1) return -1;
    return 1 + Math.max(left, right);
}`,
    complexity: 'Time: O(n), Space: O(h)',
    difficulty: 'Easy',
  },
  {
    id: 'trees-06',
    category: 'Trees & BST',
    topicId: 'java-collections',
    title: 'Invert (Mirror) a Binary Tree',
    problem: 'Invert a binary tree by swapping the left and right child of every node, and return the root.',
    input: 'Tree:    4\n        / \\\n       2   7\n      / \\ / \\\n     1  3 6  9',
    output: 'Tree:    4\n        / \\\n       7   2\n      / \\ / \\\n     9  6 3  1',
    explanation: "Swap the two children of the current node, then invert each subtree recursively. The order does not matter: you can swap first and recurse after (preorder) or recurse first and swap after (postorder); both visit every node once.\n\nAn iterative version works the same way with a queue or stack of nodes to process.",
    solution: `public static TreeNode invert(TreeNode root) {
    if (root == null) {
        return null;
    }
    TreeNode tmp = root.left;
    root.left = root.right;
    root.right = tmp;

    invert(root.left);
    invert(root.right);
    return root;
}`,
    complexity: 'Time: O(n), Space: O(h)',
    difficulty: 'Easy',
  },
  {
    id: 'trees-07',
    category: 'Trees & BST',
    topicId: 'java-collections',
    title: 'Validate a Binary Search Tree',
    problem: 'Return true if a binary tree is a valid binary search tree: for every node, all values in its left subtree are smaller and all values in its right subtree are larger.',
    input: 'Tree:    5\n        / \\\n       1   4\n          / \\\n         3   6',
    output: 'false (3 is in the right subtree of 5 but is smaller than 5)',
    explanation: "Checking only that `left.val < node.val < right.val` is the classic mistake: it misses a small value deep in the right subtree, as in the example. Every node must lie within a range (low, high) inherited from all its ancestors.\n\nStart with no limits. Going left, the current value becomes the new upper bound; going right, it becomes the new lower bound. Use `Long` bounds (or nullable Integers) so that nodes holding Integer.MIN_VALUE or Integer.MAX_VALUE are handled correctly. An alternative is to do an inorder traversal and check that values are strictly increasing.",
    solution: `public static boolean isValidBST(TreeNode root) {
    return valid(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private static boolean valid(TreeNode node, long low, long high) {
    if (node == null) return true;
    if (node.val <= low || node.val >= high) return false;
    return valid(node.left, low, node.val)        // left: must be < node.val
        && valid(node.right, node.val, high);     // right: must be > node.val
}`,
    complexity: 'Time: O(n), Space: O(h)',
    difficulty: 'Medium',
  },
  {
    id: 'trees-08',
    category: 'Trees & BST',
    topicId: 'java-collections',
    title: 'Search and Insert in a BST',
    problem: 'Implement search (return the node with a given value, or null) and insert (add a value and return the root) for a binary search tree.',
    input: 'BST with 4, 2, 7, 1, 3; insert 5; search 2',
    output: 'insert places 5 as the left child of 7; search returns the node 2 with children 1 and 3',
    explanation: "The BST property tells you which way to go at every node: if the target is smaller, go left, if larger, go right. You never need to look at the other side, so each operation follows a single path from the root, costing O(h).\n\nInsert walks the same path until it finds an empty spot (null) and places the new node there. In a balanced tree h is about log n; in a degenerate tree built from sorted input, h can be n, which is why Java's TreeMap uses a self-balancing red-black tree.",
    solution: `public static TreeNode search(TreeNode root, int target) {
    TreeNode cur = root;
    while (cur != null && cur.val != target) {
        cur = (target < cur.val) ? cur.left : cur.right;
    }
    return cur;
}

public static TreeNode insert(TreeNode root, int val) {
    if (root == null) {
        return new TreeNode(val);
    }
    if (val < root.val) {
        root.left = insert(root.left, val);
    } else if (val > root.val) {
        root.right = insert(root.right, val);
    }                                    // equal: already present, ignore
    return root;
}`,
    complexity: 'Time: O(h), which is O(log n) if balanced and O(n) in the worst case; Space: O(1) for search, O(h) for recursive insert',
    difficulty: 'Easy',
  },
  {
    id: 'trees-09',
    category: 'Trees & BST',
    topicId: 'java-collections',
    title: 'Lowest Common Ancestor',
    problem: 'Given a binary tree and two nodes p and q, return their lowest common ancestor: the deepest node that has both p and q as descendants (a node counts as its own descendant).',
    input: 'Tree:      3\n         /   \\\n        5     1\n       / \\   / \\\n      6   2 0   8\n         / \\\n        7   4\np = 5, q = 4',
    output: '5',
    explanation: "Search both subtrees recursively. If the current node is null, p or q, return it. Otherwise ask the left and right subtrees. If both return a non-null node, p and q are on different sides, so the current node is the lowest common ancestor. If only one side returns something, pass that result up.\n\nFor a binary search tree there is a simpler O(h) solution: if both values are smaller than the current node go left, if both are larger go right, otherwise the current node is the answer.",
    solution: `public static TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) {
        return root;
    }
    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);
    if (left != null && right != null) {
        return root;                     // p and q are on different sides
    }
    return (left != null) ? left : right;
}

// BST version: use the ordering to walk down one path
public static TreeNode lcaBst(TreeNode root, int p, int q) {
    TreeNode cur = root;
    while (cur != null) {
        if (p < cur.val && q < cur.val) cur = cur.left;
        else if (p > cur.val && q > cur.val) cur = cur.right;
        else return cur;
    }
    return null;
}`,
    complexity: 'Time: O(n) for a binary tree, O(h) for a BST; Space: O(h)',
    difficulty: 'Medium',
  },
  {
    id: 'trees-10',
    category: 'Trees & BST',
    topicId: 'java-collections',
    title: 'Root-to-Leaf Path Sum',
    problem: 'Return true if the tree has a root-to-leaf path whose values add up to a target sum. Then return all such paths.',
    input: 'Tree:      5\n         /   \\\n        4     8\n       /     / \\\n      11    13  4\n     /  \\      / \\\n    7    2    5   1\ntarget = 22',
    output: 'true; paths [[5, 4, 11, 2], [5, 8, 4, 5]]',
    explanation: "Subtract the node's value from the remaining target as you go down. At a leaf (no children), the path is valid if the remaining target is exactly zero.\n\nTo collect all paths, use backtracking: add the node to the current path, recurse into the children, and remove it again before returning. When you find a valid leaf, add a copy of the current path to the results, because the path list keeps changing.",
    solution: `public static boolean hasPathSum(TreeNode node, int target) {
    if (node == null) return false;
    int remaining = target - node.val;
    if (node.left == null && node.right == null) {
        return remaining == 0;           // leaf
    }
    return hasPathSum(node.left, remaining) || hasPathSum(node.right, remaining);
}

public static List<List<Integer>> pathSum(TreeNode root, int target) {
    List<List<Integer>> result = new ArrayList<>();
    collect(root, target, new ArrayList<>(), result);
    return result;
}

private static void collect(TreeNode node, int remaining, List<Integer> path,
                            List<List<Integer>> result) {
    if (node == null) return;
    path.add(node.val);
    remaining -= node.val;
    if (node.left == null && node.right == null && remaining == 0) {
        result.add(new ArrayList<>(path));   // copy, path will change
    } else {
        collect(node.left, remaining, path, result);
        collect(node.right, remaining, path, result);
    }
    path.remove(path.size() - 1);            // backtrack
}`,
    complexity: 'Time: O(n) for hasPathSum, O(n * h) for collecting paths; Space: O(h)',
    difficulty: 'Medium',
  },
  {
    id: 'trees-11',
    category: 'Trees & BST',
    topicId: 'java-collections',
    title: 'Diameter of a Binary Tree',
    problem: 'Return the diameter of a binary tree: the number of edges on the longest path between any two nodes. The path does not have to pass through the root.',
    input: 'Tree:    1\n        / \\\n       2   3\n      / \\\n     4   5',
    output: '3 (the path 4 -> 2 -> 1 -> 3 or 5 -> 2 -> 1 -> 3)',
    explanation: "The longest path through a particular node goes down into its left subtree and down into its right subtree, so its length is height(left) + height(right) in edges. The diameter is the maximum of that value over all nodes.\n\nCompute heights with a postorder traversal and update a running maximum at every node as you go. That way one pass computes both, instead of calling height separately for each node.",
    solution: `private static int best;

public static int diameter(TreeNode root) {
    best = 0;
    depth(root);
    return best;
}

// returns the height of the subtree in nodes
private static int depth(TreeNode node) {
    if (node == null) return 0;
    int left = depth(node.left);
    int right = depth(node.right);
    best = Math.max(best, left + right);     // path through this node, in edges
    return 1 + Math.max(left, right);
}`,
    complexity: 'Time: O(n), Space: O(h)',
    difficulty: 'Medium',
  },
  {
    id: 'trees-12',
    category: 'Trees & BST',
    topicId: 'java-collections',
    title: 'Kth Smallest Element in a BST',
    problem: 'Return the kth smallest value (1-indexed) in a binary search tree.',
    input: 'BST:      5\n         / \\\n        3   6\n       / \\\n      2   4\n     /\n    1\nk = 3',
    output: '3',
    explanation: "An inorder traversal of a BST visits values in ascending order, so the kth node visited is the answer. Use the iterative inorder traversal and stop as soon as you pop the kth node; there is no need to visit the rest of the tree.\n\nIf the tree is modified often and you need this query frequently, store the size of each subtree in its node. Then you can decide at each node whether the answer is on the left, is the node itself, or is on the right, in O(h).",
    solution: `public static int kthSmallest(TreeNode root, int k) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode cur = root;
    int count = 0;
    while (cur != null || !stack.isEmpty()) {
        while (cur != null) {
            stack.push(cur);
            cur = cur.left;
        }
        cur = stack.pop();
        if (++count == k) {
            return cur.val;
        }
        cur = cur.right;
    }
    throw new IllegalArgumentException("k is larger than the number of nodes");
}`,
    complexity: 'Time: O(h + k), Space: O(h)',
    difficulty: 'Medium',
  },
]

export default questions
