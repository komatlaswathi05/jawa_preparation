const questions = [
  {
    id: 'hashmap-01',
    category: 'HashMap',
    topicId: 'java-collections',
    title: 'Word Frequency Count',
    problem: 'Given a sentence, count how many times each word appears. Treat words case-insensitively and split on spaces.',
    input: 'text = "the cat and the hat"',
    output: '{the=2, cat=1, and=1, hat=1}',
    explanation: 'Split the text into words, then walk through them one by one. For each word, `merge(word, 1, Integer::sum)` puts 1 if the word is new, or adds 1 to the old count if it already exists.\n\nA `LinkedHashMap` is used so the output keeps the order in which words first appeared.',
    solution: `public static Map<String, Integer> wordFrequency(String text) {
    Map<String, Integer> counts = new LinkedHashMap<>();
    if (text == null || text.isBlank()) {
        return counts;
    }
    String[] words = text.toLowerCase().trim().split("\\\\s+");
    for (String word : words) {
        counts.merge(word, 1, Integer::sum);
    }
    return counts;
}`,
    complexity: 'Time: O(n), Space: O(k) where k is the number of distinct words',
    difficulty: 'Easy',
  },
  {
    id: 'hashmap-02',
    category: 'HashMap',
    topicId: 'java-collections',
    title: 'First Repeating Element',
    problem: 'Given an array of integers, return the first element (from the left) that appears more than once. Return -1 if no element repeats.',
    input: 'nums = [10, 5, 3, 4, 3, 5, 6]',
    output: '5',
    explanation: 'First count every number with a HashMap. Then scan the array again from the left and return the first number whose count is greater than 1.\n\nHere 5 is returned (not 3) because 5 appears earlier in the array than 3, even though 3 repeats first when reading left to right.',
    solution: `public static int firstRepeating(int[] nums) {
    Map<Integer, Integer> counts = new HashMap<>();
    for (int n : nums) {
        counts.merge(n, 1, Integer::sum);
    }
    for (int n : nums) {
        if (counts.get(n) > 1) {
            return n;
        }
    }
    return -1;
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'hashmap-03',
    category: 'HashMap',
    topicId: 'java-collections',
    title: 'Two Sum',
    problem: 'Given an array of integers and a target, return the indices of the two numbers that add up to the target. Assume exactly one answer exists and you may not use the same element twice.',
    input: 'nums = [2, 7, 11, 15], target = 9',
    output: '[0, 1]',
    explanation: 'For each number, the partner we need is `target - num`. We keep a HashMap from value to index for numbers we have already seen.\n\nIf the partner is already in the map, we found the pair. Otherwise we store the current number and move on. This turns an O(n^2) double loop into a single pass.',
    solution: `public static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>(); // value -> index
    for (int i = 0; i < nums.length; i++) {
        int need = target - nums[i];
        if (seen.containsKey(need)) {
            return new int[] { seen.get(need), i };
        }
        seen.put(nums[i], i);
    }
    return new int[0]; // no pair found
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'hashmap-04',
    category: 'HashMap',
    topicId: 'java-collections',
    title: 'Group Anagrams',
    problem: 'Given a list of words, group together the words that are anagrams of each other (same letters, different order).',
    input: 'words = ["eat", "tea", "tan", "ate", "nat", "bat"]',
    output: '[[eat, tea, ate], [tan, nat], [bat]]',
    explanation: 'Two words are anagrams if their letters, once sorted, are the same. So the sorted word works as a key: "eat", "tea" and "ate" all become "aet".\n\n`computeIfAbsent` creates an empty list the first time a key is seen, and we add the word to that list. The map values are the groups.',
    solution: `public static List<List<String>> groupAnagrams(String[] words) {
    Map<String, List<String>> groups = new LinkedHashMap<>();
    for (String word : words) {
        char[] letters = word.toCharArray();
        Arrays.sort(letters);
        String key = new String(letters);
        groups.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
    }
    return new ArrayList<>(groups.values());
}`,
    complexity: 'Time: O(n * k log k) where k is the max word length, Space: O(n * k)',
    difficulty: 'Medium',
  },
  {
    id: 'hashmap-05',
    category: 'HashMap',
    topicId: 'java-collections',
    title: 'Isomorphic Strings',
    problem: 'Two strings are isomorphic if the characters in the first can be replaced to get the second, where each character maps to exactly one character and no two characters map to the same one. Check whether two strings are isomorphic.',
    input: 's = "egg", t = "add"',
    output: 'true   (for s = "foo", t = "bar" the answer is false)',
    explanation: 'We need the mapping to work in both directions, so we keep two maps: s-char to t-char and t-char to s-char.\n\nFor each position, if a character already has a mapping, it must match the current character. If either direction conflicts, the strings are not isomorphic.',
    solution: `public static boolean isIsomorphic(String s, String t) {
    if (s.length() != t.length()) {
        return false;
    }
    Map<Character, Character> sToT = new HashMap<>();
    Map<Character, Character> tToS = new HashMap<>();
    for (int i = 0; i < s.length(); i++) {
        char a = s.charAt(i);
        char b = t.charAt(i);
        Character mappedB = sToT.putIfAbsent(a, b);
        Character mappedA = tToS.putIfAbsent(b, a);
        if ((mappedB != null && mappedB != b) || (mappedA != null && mappedA != a)) {
            return false;
        }
    }
    return true;
}`,
    complexity: 'Time: O(n), Space: O(k) where k is the alphabet size',
    difficulty: 'Easy',
  },
  {
    id: 'hashmap-06',
    category: 'HashMap',
    topicId: 'java-collections',
    title: 'Subarray Sum Equals K',
    problem: 'Given an integer array (which may contain negative numbers) and an integer k, count how many continuous subarrays have a sum equal to k.',
    input: 'nums = [1, 2, 3], k = 3',
    output: '2   (the subarrays [1, 2] and [3])',
    explanation: 'A prefix sum is the total of all elements from the start up to the current index. The sum of a subarray from index i+1 to j equals prefix[j] - prefix[i]. So at each index we ask: how many earlier prefix sums equal `currentSum - k`?\n\nA HashMap stores how often each prefix sum has appeared. We start with `{0: 1}` so that subarrays starting at index 0 are counted. A sliding window does not work here because negative numbers are allowed.',
    solution: `public static int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1); // empty prefix
    int sum = 0;
    int count = 0;
    for (int n : nums) {
        sum += n;
        count += prefixCount.getOrDefault(sum - k, 0);
        prefixCount.merge(sum, 1, Integer::sum);
    }
    return count;
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Hard',
  },
  {
    id: 'hashmap-07',
    category: 'HashMap',
    topicId: 'java-collections',
    title: 'Longest Consecutive Sequence',
    problem: 'Given an unsorted array of integers, find the length of the longest sequence of consecutive numbers (like 1, 2, 3, 4). Your solution should run in O(n) time.',
    input: 'nums = [100, 4, 200, 1, 3, 2]',
    output: '4   (the sequence 1, 2, 3, 4)',
    explanation: 'Put all numbers in a HashSet for O(1) lookups. A number is the start of a sequence only if `num - 1` is not in the set.\n\nFrom each start, count upward while `num + 1` exists. Because we only count from starts, each number is visited at most twice overall, so the total work is O(n).',
    solution: `public static int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int n : nums) {
        set.add(n);
    }
    int best = 0;
    for (int n : set) {
        if (!set.contains(n - 1)) {      // n starts a sequence
            int current = n;
            int length = 1;
            while (set.contains(current + 1)) {
                current++;
                length++;
            }
            best = Math.max(best, length);
        }
    }
    return best;
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'hashmap-08',
    category: 'HashMap',
    topicId: 'java-collections',
    title: 'Majority Element',
    problem: 'Given an array of size n, return the element that appears more than n / 2 times. You may assume such an element always exists.',
    input: 'nums = [2, 2, 1, 1, 1, 2, 2]',
    output: '2',
    explanation: 'The HashMap approach counts each number and returns as soon as a count goes above n / 2.\n\nA follow-up interviewers love is the Boyer-Moore voting algorithm, which uses O(1) space: keep a candidate and a counter, add 1 when you see the candidate and subtract 1 otherwise; when the counter hits 0, pick a new candidate. Both are shown below.',
    solution: `// Approach 1: HashMap counting
public static int majorityElement(int[] nums) {
    Map<Integer, Integer> counts = new HashMap<>();
    for (int n : nums) {
        int c = counts.merge(n, 1, Integer::sum);
        if (c > nums.length / 2) {
            return n;
        }
    }
    throw new IllegalArgumentException("No majority element");
}

// Approach 2: Boyer-Moore voting, O(1) extra space
public static int majorityElementVoting(int[] nums) {
    int candidate = nums[0];
    int count = 0;
    for (int n : nums) {
        if (count == 0) {
            candidate = n;
        }
        count += (n == candidate) ? 1 : -1;
    }
    return candidate;
}`,
    complexity: 'Time: O(n), Space: O(n) for HashMap, O(1) for Boyer-Moore',
    difficulty: 'Easy',
  },
  {
    id: 'hashmap-09',
    category: 'HashMap',
    topicId: 'java-collections',
    title: 'Custom Key Class with equals and hashCode',
    problem: 'Create a `Point` class with x and y coordinates that can be used as a HashMap key, so that two points with the same coordinates are treated as the same key. Show what goes wrong without equals and hashCode.',
    input: 'map.put(new Point(1, 2), "A"); map.get(new Point(1, 2))',
    output: '"A"   (without equals/hashCode the result would be null)',
    explanation: 'HashMap first uses `hashCode()` to pick a bucket, then `equals()` to find the exact key inside that bucket. The default versions from `Object` compare memory addresses, so two different `Point` objects with the same x and y would never match.\n\nThe rule: equal objects must have equal hash codes. Make the key fields `final` so the hash code never changes after the key is put in the map. In Java 16+, a `record Point(int x, int y)` generates both methods for you.',
    solution: `public final class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point)) return false;
        Point other = (Point) o;
        return x == other.x && y == other.y;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }

    @Override
    public String toString() {
        return "(" + x + ", " + y + ")";
    }

    public static void main(String[] args) {
        Map<Point, String> map = new HashMap<>();
        map.put(new Point(1, 2), "A");
        System.out.println(map.get(new Point(1, 2))); // A
    }
}

// Shorter alternative (Java 16+): equals, hashCode and toString are generated
// public record Point(int x, int y) {}`,
    complexity: 'Time: O(1) average for get/put, Space: O(1) per key',
    difficulty: 'Medium',
  },
  {
    id: 'hashmap-10',
    category: 'HashMap',
    topicId: 'java-collections',
    title: 'Implement a Simple HashMap',
    problem: 'Implement your own hash map for String keys and Integer values with `put`, `get` and `remove`, using an array of buckets and separate chaining (a linked list in each bucket). Resize when the map gets too full.',
    input: 'put("a", 1); put("b", 2); put("a", 3); get("a"); remove("b"); get("b")',
    output: 'get("a") = 3, get("b") = null',
    explanation: 'The key hash code, reduced with modulo, picks a bucket index. Each bucket holds a linked list of nodes, so keys that land in the same bucket (a collision) are simply chained together.\n\n`put` walks the chain and updates an existing key or adds a new node at the head. When size / capacity exceeds the load factor 0.75, we double the array and re-insert every node, which keeps chains short and operations O(1) on average.',
    solution: `public class MyHashMap {
    private static class Node {
        final String key;
        Integer value;
        Node next;

        Node(String key, Integer value, Node next) {
            this.key = key;
            this.value = value;
            this.next = next;
        }
    }

    private Node[] buckets = new Node[16];
    private int size = 0;

    private int indexFor(String key, int capacity) {
        return Math.abs(key.hashCode() % capacity);
    }

    public void put(String key, Integer value) {
        int index = indexFor(key, buckets.length);
        for (Node n = buckets[index]; n != null; n = n.next) {
            if (n.key.equals(key)) {
                n.value = value;          // update existing key
                return;
            }
        }
        buckets[index] = new Node(key, value, buckets[index]); // add at head
        size++;
        if (size > buckets.length * 0.75) {
            resize();
        }
    }

    public Integer get(String key) {
        int index = indexFor(key, buckets.length);
        for (Node n = buckets[index]; n != null; n = n.next) {
            if (n.key.equals(key)) {
                return n.value;
            }
        }
        return null;
    }

    public Integer remove(String key) {
        int index = indexFor(key, buckets.length);
        Node prev = null;
        for (Node n = buckets[index]; n != null; prev = n, n = n.next) {
            if (n.key.equals(key)) {
                if (prev == null) {
                    buckets[index] = n.next;
                } else {
                    prev.next = n.next;
                }
                size--;
                return n.value;
            }
        }
        return null;
    }

    public int size() {
        return size;
    }

    private void resize() {
        Node[] old = buckets;
        buckets = new Node[old.length * 2];
        for (Node head : old) {
            for (Node n = head; n != null; n = n.next) {
                int index = indexFor(n.key, buckets.length);
                buckets[index] = new Node(n.key, n.value, buckets[index]);
            }
        }
    }
}`,
    complexity: 'Time: O(1) average for put/get/remove (O(n) worst case), Space: O(n)',
    difficulty: 'Hard',
  },
  {
    id: 'hashmap-11',
    category: 'HashMap',
    topicId: 'java-collections',
    title: 'Ransom Note',
    problem: 'Given two strings `ransomNote` and `magazine`, return true if the ransom note can be built using letters from the magazine. Each letter in the magazine can be used only once.',
    input: 'ransomNote = "aab", magazine = "baa"',
    output: 'true   (for ransomNote = "aa", magazine = "ab" the answer is false)',
    explanation: 'Count how many of each letter the magazine has. Then go through the ransom note and use up one letter at a time.\n\nIf a letter is missing or its count has dropped to 0, we cannot build the note. For only lowercase letters, an `int[26]` array works like a tiny, faster HashMap.',
    solution: `public static boolean canConstruct(String ransomNote, String magazine) {
    Map<Character, Integer> available = new HashMap<>();
    for (char c : magazine.toCharArray()) {
        available.merge(c, 1, Integer::sum);
    }
    for (char c : ransomNote.toCharArray()) {
        int left = available.getOrDefault(c, 0);
        if (left == 0) {
            return false;
        }
        available.put(c, left - 1);
    }
    return true;
}`,
    complexity: 'Time: O(m + n), Space: O(k) where k is the number of distinct letters',
    difficulty: 'Easy',
  },
  {
    id: 'hashmap-12',
    category: 'HashMap',
    topicId: 'java-collections',
    title: 'Count Pairs with Given Difference',
    problem: 'Given an array of integers and a non-negative number k, count the unique pairs (a, b) where b - a = k. Each pair of values is counted once, even if the values appear several times.',
    input: 'nums = [3, 1, 4, 1, 5], k = 2',
    output: '2   (pairs (1, 3) and (3, 5))',
    explanation: 'Build a frequency map of the numbers. For each distinct value a, check whether a + k exists in the map.\n\nWhen k is 0, a pair means the same value appears at least twice, so we check the count instead. Looping over distinct keys (not the raw array) makes sure each pair is counted only once.',
    solution: `public static int countPairsWithDiff(int[] nums, int k) {
    if (k < 0) {
        return 0;
    }
    Map<Integer, Integer> counts = new HashMap<>();
    for (int n : nums) {
        counts.merge(n, 1, Integer::sum);
    }
    int pairs = 0;
    for (Map.Entry<Integer, Integer> e : counts.entrySet()) {
        int a = e.getKey();
        if (k == 0) {
            if (e.getValue() > 1) {
                pairs++;
            }
        } else if (counts.containsKey(a + k)) {
            pairs++;
        }
    }
    return pairs;
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Medium',
  },
]

export default questions
