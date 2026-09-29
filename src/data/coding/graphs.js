// Unless stated otherwise, graphs have nodes numbered 0..n-1 and are given as an
// adjacency list: List<List<Integer>> graph, where graph.get(u) holds the neighbours of u.

const questions = [
  {
    id: 'graphs-01',
    category: 'Graphs',
    topicId: 'java-collections',
    title: 'Build an Adjacency List and Traverse with BFS',
    problem: 'Given n nodes and a list of undirected edges, build an adjacency list and return the nodes in breadth-first order starting from node 0.',
    input: 'n = 5, edges = [[0,1], [0,2], [1,3], [2,4]]',
    output: '[0, 1, 2, 3, 4]',
    explanation: "An adjacency list stores, for every node, the list of its neighbours. It uses O(V + E) memory, much less than an adjacency matrix for sparse graphs, and is the standard representation in interviews. For an undirected edge (u, v), add v to u's list and u to v's list.\n\nBreadth-first search explores the graph in rings: first the start node, then all nodes one edge away, then two edges away, and so on. Use a queue, and mark nodes as visited when you add them to the queue (not when you remove them), so that no node is queued twice.",
    solution: `public static List<List<Integer>> buildGraph(int n, int[][] edges) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < n; i++) {
        graph.add(new ArrayList<>());
    }
    for (int[] e : edges) {
        graph.get(e[0]).add(e[1]);
        graph.get(e[1]).add(e[0]);      // undirected: both directions
    }
    return graph;
}

public static List<Integer> bfs(List<List<Integer>> graph, int start) {
    List<Integer> order = new ArrayList<>();
    boolean[] visited = new boolean[graph.size()];
    Queue<Integer> queue = new ArrayDeque<>();
    queue.offer(start);
    visited[start] = true;
    while (!queue.isEmpty()) {
        int node = queue.poll();
        order.add(node);
        for (int next : graph.get(node)) {
            if (!visited[next]) {
                visited[next] = true;   // mark when queued
                queue.offer(next);
            }
        }
    }
    return order;
}`,
    complexity: 'Time: O(V + E), Space: O(V + E)',
    difficulty: 'Easy',
  },
  {
    id: 'graphs-02',
    category: 'Graphs',
    topicId: 'java-collections',
    title: 'Depth-First Search (Recursive and Iterative)',
    problem: 'Return the nodes of a graph in depth-first order starting from a given node, first recursively and then with an explicit stack.',
    input: 'n = 5, edges = [[0,1], [0,2], [1,3], [2,4]], start = 0',
    output: '[0, 1, 3, 2, 4]',
    explanation: "Depth-first search follows one path as far as it can before backtracking. The recursive version is short: mark the node, visit it, and recurse into every unvisited neighbour.\n\nFor very deep graphs recursion can overflow the call stack, so the iterative version uses a `Deque` as a stack. Pushing neighbours in reverse order makes it visit them in the same order as the recursive version. Here a node is marked visited when it is popped, because the same node may be pushed more than once before it is processed.",
    solution: `public static List<Integer> dfsRecursive(List<List<Integer>> graph, int start) {
    List<Integer> order = new ArrayList<>();
    visit(graph, start, new boolean[graph.size()], order);
    return order;
}

private static void visit(List<List<Integer>> graph, int node, boolean[] visited, List<Integer> order) {
    visited[node] = true;
    order.add(node);
    for (int next : graph.get(node)) {
        if (!visited[next]) {
            visit(graph, next, visited, order);
        }
    }
}

public static List<Integer> dfsIterative(List<List<Integer>> graph, int start) {
    List<Integer> order = new ArrayList<>();
    boolean[] visited = new boolean[graph.size()];
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(start);
    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (visited[node]) continue;
        visited[node] = true;
        order.add(node);
        List<Integer> neighbours = graph.get(node);
        for (int i = neighbours.size() - 1; i >= 0; i--) {   // reverse keeps the same order
            if (!visited[neighbours.get(i)]) {
                stack.push(neighbours.get(i));
            }
        }
    }
    return order;
}`,
    complexity: 'Time: O(V + E), Space: O(V)',
    difficulty: 'Easy',
  },
  {
    id: 'graphs-03',
    category: 'Graphs',
    topicId: 'java-collections',
    title: 'Number of Islands',
    problem: "Given a 2D grid of '1' (land) and '0' (water), count the islands. An island is a group of land cells connected horizontally or vertically.",
    input: 'grid =\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1',
    output: '3',
    explanation: "Treat the grid as a graph where each land cell is a node connected to its land neighbours up, down, left and right. Scan every cell; when you find unvisited land, you have found a new island, so increase the count and flood it with DFS, marking every connected land cell as visited.\n\nMarking cells by changing '1' to '0' in the grid avoids a separate visited array. If you must not modify the input, use a boolean[][] instead. For huge grids, BFS avoids deep recursion.",
    solution: `public static int numIslands(char[][] grid) {
    int count = 0;
    for (int r = 0; r < grid.length; r++) {
        for (int c = 0; c < grid[0].length; c++) {
            if (grid[r][c] == '1') {
                count++;
                sink(grid, r, c);
            }
        }
    }
    return count;
}

private static void sink(char[][] grid, int r, int c) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] != '1') {
        return;
    }
    grid[r][c] = '0';               // mark as visited
    sink(grid, r + 1, c);
    sink(grid, r - 1, c);
    sink(grid, r, c + 1);
    sink(grid, r, c - 1);
}`,
    complexity: 'Time: O(rows * cols), Space: O(rows * cols) in the worst case for recursion',
    difficulty: 'Medium',
  },
  {
    id: 'graphs-04',
    category: 'Graphs',
    topicId: 'java-collections',
    title: 'Flood Fill',
    problem: 'Given an image as a 2D array of colours, a starting pixel and a new colour, recolour the starting pixel and every pixel connected to it (up, down, left, right) that has the same original colour.',
    input: 'image =\n1 1 1\n1 1 0\n1 0 1\nstart = (1, 1), newColor = 2',
    output: '2 2 2\n2 2 0\n2 0 1',
    explanation: "This is the paint-bucket tool. Remember the original colour of the start pixel and run DFS: recolour the pixel, then visit its four neighbours that still have the original colour.\n\nOne edge case: if the new colour equals the original colour, return immediately. Otherwise recoloured pixels still match the original colour and the recursion never stops.",
    solution: `public static int[][] floodFill(int[][] image, int sr, int sc, int newColor) {
    int original = image[sr][sc];
    if (original != newColor) {
        fill(image, sr, sc, original, newColor);
    }
    return image;
}

private static void fill(int[][] image, int r, int c, int original, int newColor) {
    if (r < 0 || c < 0 || r >= image.length || c >= image[0].length || image[r][c] != original) {
        return;
    }
    image[r][c] = newColor;
    fill(image, r + 1, c, original, newColor);
    fill(image, r - 1, c, original, newColor);
    fill(image, r, c + 1, original, newColor);
    fill(image, r, c - 1, original, newColor);
}`,
    complexity: 'Time: O(rows * cols), Space: O(rows * cols) in the worst case',
    difficulty: 'Easy',
  },
  {
    id: 'graphs-05',
    category: 'Graphs',
    topicId: 'java-collections',
    title: 'Shortest Path in an Unweighted Graph',
    problem: 'Return the minimum number of edges from a source node to a target node in an unweighted graph, and the path itself. Return -1 and an empty path if the target cannot be reached.',
    input: 'n = 6, edges = [[0,1], [0,2], [1,3], [2,3], [3,4], [4,5]], source = 0, target = 5',
    output: 'distance 4, path [0, 1, 3, 4, 5]',
    explanation: "BFS visits nodes in increasing order of distance, so the first time it reaches a node is along a shortest path. Keep a `dist` array (initialised to -1 for unvisited) and set `dist[next] = dist[node] + 1` when you queue a neighbour.\n\nTo rebuild the path, also store each node's `parent`, the node it was discovered from. Walk back from the target to the source using the parents and reverse the result. For weighted graphs BFS is not enough; use Dijkstra's algorithm instead.",
    solution: `public static List<Integer> shortestPath(List<List<Integer>> graph, int source, int target) {
    int n = graph.size();
    int[] dist = new int[n];
    int[] parent = new int[n];
    Arrays.fill(dist, -1);
    Arrays.fill(parent, -1);

    Queue<Integer> queue = new ArrayDeque<>();
    queue.offer(source);
    dist[source] = 0;
    while (!queue.isEmpty()) {
        int node = queue.poll();
        if (node == target) break;
        for (int next : graph.get(node)) {
            if (dist[next] == -1) {
                dist[next] = dist[node] + 1;
                parent[next] = node;
                queue.offer(next);
            }
        }
    }

    if (dist[target] == -1) {
        return List.of();                    // unreachable
    }
    LinkedList<Integer> path = new LinkedList<>();
    for (int v = target; v != -1; v = parent[v]) {
        path.addFirst(v);
    }
    return path;                             // distance = path.size() - 1
}`,
    complexity: 'Time: O(V + E), Space: O(V)',
    difficulty: 'Medium',
  },
  {
    id: 'graphs-06',
    category: 'Graphs',
    topicId: 'java-collections',
    title: 'Rotting Oranges (Multi-Source BFS)',
    problem: 'In a grid, 0 is empty, 1 is a fresh orange and 2 is a rotten orange. Every minute, fresh oranges next to a rotten one (up, down, left, right) become rotten. Return the minutes until no fresh orange remains, or -1 if that is impossible.',
    input: 'grid =\n2 1 1\n1 1 0\n0 1 1',
    output: '4',
    explanation: "All rotten oranges spread at the same time, so start BFS from all of them together: put every rotten orange in the queue at minute 0. Process the queue level by level; each level is one minute, and every fresh neighbour becomes rotten and joins the next level.\n\nCount fresh oranges at the start and decrease the count as they rot. If any remain at the end, some were unreachable, so return -1. This multi-source BFS pattern also solves \"distance to the nearest exit\" and \"walls and gates\".",
    solution: `public static int orangesRotting(int[][] grid) {
    int rows = grid.length, cols = grid[0].length;
    Queue<int[]> queue = new ArrayDeque<>();
    int fresh = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == 2) queue.offer(new int[]{r, c});
            else if (grid[r][c] == 1) fresh++;
        }
    }

    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    int minutes = 0;
    while (!queue.isEmpty() && fresh > 0) {
        int size = queue.size();                 // one minute
        for (int i = 0; i < size; i++) {
            int[] cell = queue.poll();
            for (int[] d : dirs) {
                int r = cell[0] + d[0], c = cell[1] + d[1];
                if (r >= 0 && c >= 0 && r < rows && c < cols && grid[r][c] == 1) {
                    grid[r][c] = 2;
                    fresh--;
                    queue.offer(new int[]{r, c});
                }
            }
        }
        minutes++;
    }
    return fresh == 0 ? minutes : -1;
}`,
    complexity: 'Time: O(rows * cols), Space: O(rows * cols)',
    difficulty: 'Medium',
  },
  {
    id: 'graphs-07',
    category: 'Graphs',
    topicId: 'java-collections',
    title: 'Count Connected Components (Union-Find)',
    problem: 'Given n nodes and a list of undirected edges, return the number of connected components.',
    input: 'n = 5, edges = [[0,1], [1,2], [3,4]]',
    output: '2',
    explanation: "You could run DFS from every unvisited node and count the runs. Union-Find (disjoint set union) is another tool worth knowing: every node starts in its own set, and each edge merges the sets of its two ends. Every successful merge reduces the number of components by one.\n\n`find` returns the representative (root) of a node's set; path compression makes each node point closer to the root as it is looked up. `union` links one root under the other, and union by rank keeps the trees shallow. With both optimisations each operation is effectively constant time.",
    solution: `public static int countComponents(int n, int[][] edges) {
    int[] parent = new int[n];
    int[] rank = new int[n];
    for (int i = 0; i < n; i++) {
        parent[i] = i;                       // everyone is their own root
    }
    int components = n;
    for (int[] e : edges) {
        int a = find(parent, e[0]);
        int b = find(parent, e[1]);
        if (a != b) {
            if (rank[a] < rank[b]) { int t = a; a = b; b = t; }
            parent[b] = a;                   // attach smaller tree under larger
            if (rank[a] == rank[b]) rank[a]++;
            components--;
        }
    }
    return components;
}

private static int find(int[] parent, int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];       // path compression (halving)
        x = parent[x];
    }
    return x;
}`,
    complexity: 'Time: O((V + E) * α(V)), nearly linear; Space: O(V)',
    difficulty: 'Medium',
  },
  {
    id: 'graphs-08',
    category: 'Graphs',
    topicId: 'java-collections',
    title: 'Detect a Cycle in an Undirected Graph',
    problem: 'Return true if an undirected graph contains a cycle.',
    input: 'n = 4, edges = [[0,1], [1,2], [2,0], [2,3]]',
    output: 'true   (0 - 1 - 2 - 0)',
    explanation: "Run DFS and remember the node you came from. In an undirected graph every edge appears in both directions, so seeing your parent again is normal and not a cycle. Seeing any other already-visited neighbour means there are two different paths to it, which is a cycle.\n\nStart a DFS from every unvisited node so disconnected parts of the graph are checked too. Union-Find also works: if both ends of an edge are already in the same set, adding the edge closes a cycle.",
    solution: `public static boolean hasCycleUndirected(List<List<Integer>> graph) {
    boolean[] visited = new boolean[graph.size()];
    for (int i = 0; i < graph.size(); i++) {
        if (!visited[i] && dfs(graph, i, -1, visited)) {
            return true;
        }
    }
    return false;
}

private static boolean dfs(List<List<Integer>> graph, int node, int parent, boolean[] visited) {
    visited[node] = true;
    for (int next : graph.get(node)) {
        if (!visited[next]) {
            if (dfs(graph, next, node, visited)) return true;
        } else if (next != parent) {
            return true;                     // visited and not where we came from
        }
    }
    return false;
}`,
    complexity: 'Time: O(V + E), Space: O(V)',
    difficulty: 'Medium',
  },
  {
    id: 'graphs-09',
    category: 'Graphs',
    topicId: 'java-collections',
    title: 'Detect a Cycle in a Directed Graph',
    problem: 'Return true if a directed graph contains a cycle.',
    input: 'n = 4, directed edges = [[0,1], [1,2], [2,3], [3,1]]',
    output: 'true   (1 -> 2 -> 3 -> 1)',
    explanation: "In a directed graph, reaching a visited node is not enough to prove a cycle: two separate paths can lead to the same node without forming a loop. What matters is whether that node is still on the current DFS path.\n\nUse three states: 0 = not visited, 1 = on the current path (visiting), 2 = fully processed. If DFS reaches a node in state 1, it has found a back edge to an ancestor, which is a cycle. When a node's DFS finishes, mark it 2. This is also how dependency tools detect circular dependencies, such as Spring detecting circular bean references.",
    solution: `public static boolean hasCycleDirected(List<List<Integer>> graph) {
    int[] state = new int[graph.size()];     // 0 new, 1 visiting, 2 done
    for (int i = 0; i < graph.size(); i++) {
        if (state[i] == 0 && dfs(graph, i, state)) {
            return true;
        }
    }
    return false;
}

private static boolean dfs(List<List<Integer>> graph, int node, int[] state) {
    state[node] = 1;
    for (int next : graph.get(node)) {
        if (state[next] == 1) return true;                     // back edge
        if (state[next] == 0 && dfs(graph, next, state)) return true;
    }
    state[node] = 2;
    return false;
}`,
    complexity: 'Time: O(V + E), Space: O(V)',
    difficulty: 'Medium',
  },
  {
    id: 'graphs-10',
    category: 'Graphs',
    topicId: 'java-collections',
    title: 'Course Schedule (Topological Sort)',
    problem: 'There are n courses numbered 0..n-1. prerequisites[i] = [a, b] means you must take course b before course a. Return an order in which you can take all courses, or an empty array if it is impossible.',
    input: 'n = 4, prerequisites = [[1,0], [2,0], [3,1], [3,2]]',
    output: '[0, 1, 2, 3]   ([0, 2, 1, 3] is also valid)',
    explanation: "Model each prerequisite as a directed edge b -> a. A valid order is a topological sort, which exists only if the graph has no cycle. Kahn's algorithm builds it with BFS: count each node's incoming edges (in-degree), start with every node whose in-degree is 0, and repeatedly take one, add it to the order, and decrease the in-degree of its neighbours, queueing any that reach 0.\n\nIf the order ends up shorter than n, some courses were never freed because they are part of a cycle, so no valid schedule exists. Build tools like Maven and Gradle order tasks and modules the same way.",
    solution: `public static int[] findOrder(int n, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
    int[] inDegree = new int[n];
    for (int[] p : prerequisites) {
        graph.get(p[1]).add(p[0]);           // p[1] must come before p[0]
        inDegree[p[0]]++;
    }

    Queue<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        if (inDegree[i] == 0) queue.offer(i);
    }

    int[] order = new int[n];
    int index = 0;
    while (!queue.isEmpty()) {
        int course = queue.poll();
        order[index++] = course;
        for (int next : graph.get(course)) {
            if (--inDegree[next] == 0) queue.offer(next);
        }
    }
    return index == n ? order : new int[0];  // shorter means a cycle
}`,
    complexity: 'Time: O(V + E), Space: O(V + E)',
    difficulty: 'Medium',
  },
  {
    id: 'graphs-11',
    category: 'Graphs',
    topicId: 'java-collections',
    title: "Dijkstra's Shortest Path",
    problem: 'Given a directed graph with non-negative edge weights, return the shortest distance from a source node to every node. Use Integer.MAX_VALUE for unreachable nodes.',
    input: 'n = 5, edges (from, to, weight) = [[0,1,4], [0,2,1], [2,1,2], [1,3,1], [2,3,5], [3,4,3]], source = 0',
    output: '[0, 3, 1, 4, 7]',
    explanation: "Dijkstra's algorithm always expands the closest node that has not been finalised yet. A PriorityQueue ordered by distance gives that node in O(log n). When you take a node out, try to relax each outgoing edge: if going through this node gives a shorter distance to a neighbour, update it and push the neighbour with its new distance.\n\nJava's PriorityQueue has no decrease-key operation, so a node can be in the queue several times. When you poll an entry whose distance is larger than the best known distance, it is stale; skip it. Dijkstra does not work with negative edge weights; use Bellman-Ford for those.",
    solution: `public static int[] dijkstra(int n, int[][] edges, int source) {
    List<List<int[]>> graph = new ArrayList<>();
    for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
    for (int[] e : edges) {
        graph.get(e[0]).add(new int[]{e[1], e[2]});      // {to, weight}
    }

    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
    pq.offer(new int[]{source, 0});                      // {node, distance}
    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int node = cur[0];
        if (cur[1] > dist[node]) continue;               // stale entry
        for (int[] edge : graph.get(node)) {
            int next = edge[0];
            int candidate = dist[node] + edge[1];
            if (candidate < dist[next]) {
                dist[next] = candidate;
                pq.offer(new int[]{next, candidate});
            }
        }
    }
    return dist;
}`,
    complexity: 'Time: O((V + E) log V), Space: O(V + E)',
    difficulty: 'Hard',
  },
  {
    id: 'graphs-12',
    category: 'Graphs',
    topicId: 'java-collections',
    title: 'Check if a Graph Is Bipartite',
    problem: 'Return true if the nodes of an undirected graph can be split into two groups such that every edge connects a node from one group to a node from the other.',
    input: 'graph = [[1,3], [0,2], [1,3], [0,2]]   (a square 0-1-2-3-0)',
    output: 'true   (groups {0, 2} and {1, 3})',
    explanation: "Try to colour the graph with two colours so that neighbours always get different colours. Start BFS from any uncoloured node with colour 0; give each neighbour the opposite colour. If you ever find a neighbour that already has the same colour as the current node, the graph is not bipartite.\n\nA graph is bipartite exactly when it has no cycle of odd length; a triangle, for example, cannot be two-coloured. Start from every uncoloured node so disconnected components are checked. Real uses include matching problems, such as assigning jobs to workers.",
    solution: `public static boolean isBipartite(int[][] graph) {
    int[] color = new int[graph.length];
    Arrays.fill(color, -1);                              // -1 = not coloured
    for (int start = 0; start < graph.length; start++) {
        if (color[start] != -1) continue;
        Queue<Integer> queue = new ArrayDeque<>();
        queue.offer(start);
        color[start] = 0;
        while (!queue.isEmpty()) {
            int node = queue.poll();
            for (int next : graph[node]) {
                if (color[next] == -1) {
                    color[next] = 1 - color[node];       // opposite colour
                    queue.offer(next);
                } else if (color[next] == color[node]) {
                    return false;                        // same colour on both ends
                }
            }
        }
    }
    return true;
}`,
    complexity: 'Time: O(V + E), Space: O(V)',
    difficulty: 'Medium',
  },
]

export default questions
