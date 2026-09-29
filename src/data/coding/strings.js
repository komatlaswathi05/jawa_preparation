const questions = [
  {
    id: 'strings-01',
    category: 'Strings',
    topicId: 'java-strings',
    title: 'Reverse a String',
    problem: 'Reverse a given string. Show both the built-in way and a manual way using a loop.',
    input: 'str = "hello"',
    output: '"olleh"',
    explanation: 'The easiest way is `new StringBuilder(str).reverse()`. Interviewers often ask for the manual way too: convert the string to a `char[]`, then swap characters from both ends moving toward the middle. Strings are immutable in Java, which is why we work on a copy (a builder or a char array) and create a new String at the end.',
    solution: `// Built-in approach
public static String reverseWithBuilder(String str) {
    return new StringBuilder(str).reverse().toString();
}

// Manual approach with two pointers
public static String reverseManually(String str) {
    char[] chars = str.toCharArray();
    int left = 0;
    int right = chars.length - 1;
    while (left < right) {
        char temp = chars[left];
        chars[left] = chars[right];
        chars[right] = temp;
        left++;
        right--;
    }
    return new String(chars);
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'strings-02',
    category: 'Strings',
    topicId: 'java-strings',
    title: 'Check if a String is a Palindrome',
    problem: 'Check whether a string reads the same forwards and backwards, ignoring case and any characters that are not letters or digits.',
    input: 'str = "A man, a plan, a canal: Panama"',
    output: 'true',
    explanation: 'Use two pointers, one at the start and one at the end. Skip any character that is not a letter or digit using `Character.isLetterOrDigit`. Compare the remaining characters in lowercase; if any pair differs, it is not a palindrome. If the pointers meet without a mismatch, it is.',
    solution: `public static boolean isPalindrome(String str) {
    int left = 0;
    int right = str.length() - 1;
    while (left < right) {
        char leftChar = str.charAt(left);
        char rightChar = str.charAt(right);
        if (!Character.isLetterOrDigit(leftChar)) {
            left++;                 // skip spaces and punctuation
        } else if (!Character.isLetterOrDigit(rightChar)) {
            right--;
        } else {
            if (Character.toLowerCase(leftChar) != Character.toLowerCase(rightChar)) {
                return false;
            }
            left++;
            right--;
        }
    }
    return true;
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'strings-03',
    category: 'Strings',
    topicId: 'java-strings',
    title: 'Count Vowels and Consonants',
    problem: 'Count how many vowels and how many consonants a string contains. Ignore digits, spaces and punctuation.',
    input: 'str = "Hello World"',
    output: 'Vowels: 3, Consonants: 7',
    explanation: 'Lowercase the string once so we only compare against lowercase vowels. Loop through each character: if it is not a letter, skip it; if it appears in the string "aeiou" it is a vowel; otherwise it is a consonant.',
    solution: `public static void countVowelsAndConsonants(String str) {
    int vowels = 0;
    int consonants = 0;
    for (char ch : str.toLowerCase().toCharArray()) {
        if (!Character.isLetter(ch)) {
            continue;               // ignore spaces, digits, punctuation
        }
        if ("aeiou".indexOf(ch) != -1) {
            vowels++;
        } else {
            consonants++;
        }
    }
    System.out.println("Vowels: " + vowels + ", Consonants: " + consonants);
}`,
    complexity: 'Time: O(n), Space: O(n) for the lowercase copy',
    difficulty: 'Easy',
  },
  {
    id: 'strings-04',
    category: 'Strings',
    topicId: 'java-strings',
    title: 'Check if Two Strings are Anagrams',
    problem: 'Two strings are anagrams if they contain exactly the same characters with the same counts, in any order. Check whether two lowercase strings are anagrams.',
    input: 's1 = "listen", s2 = "silent"',
    output: 'true',
    explanation: 'If the lengths differ they cannot be anagrams. Otherwise use an array of 26 counters, one per letter: add 1 for each character of the first string and subtract 1 for each character of the second. If every counter ends at 0, both strings used the same letters the same number of times. Sorting both strings and comparing also works but costs O(n log n).',
    solution: `public static boolean areAnagrams(String s1, String s2) {
    if (s1.length() != s2.length()) {
        return false;
    }
    int[] counts = new int[26];     // one slot per letter a-z
    for (int i = 0; i < s1.length(); i++) {
        counts[s1.charAt(i) - 'a']++;
        counts[s2.charAt(i) - 'a']--;
    }
    for (int count : counts) {
        if (count != 0) {
            return false;
        }
    }
    return true;
}`,
    complexity: 'Time: O(n), Space: O(1) (fixed array of 26)',
    difficulty: 'Medium',
  },
  {
    id: 'strings-05',
    category: 'Strings',
    topicId: 'java-strings',
    title: 'First Non-Repeating Character',
    problem: 'Find the first character in a string that appears only once. Return \'_\' if every character repeats.',
    input: 'str = "swiss"',
    output: '\'w\'',
    explanation: 'Do two passes. In the first pass, count how many times each character appears using a `LinkedHashMap`, which remembers insertion order. In the second pass, walk the map in that order and return the first character whose count is 1.',
    solution: `import java.util.LinkedHashMap;
import java.util.Map;

public static char firstNonRepeating(String str) {
    Map<Character, Integer> counts = new LinkedHashMap<>();
    for (char ch : str.toCharArray()) {
        counts.put(ch, counts.getOrDefault(ch, 0) + 1);
    }
    for (Map.Entry<Character, Integer> entry : counts.entrySet()) {
        if (entry.getValue() == 1) {
            return entry.getKey();
        }
    }
    return '_';                     // no unique character found
}`,
    complexity: 'Time: O(n), Space: O(k) where k is the number of distinct characters',
    difficulty: 'Medium',
  },
  {
    id: 'strings-06',
    category: 'Strings',
    topicId: 'java-strings',
    title: 'Character Frequency',
    problem: 'Count how many times each character appears in a string (ignore spaces) and print the result.',
    input: 'str = "programming"',
    output: '{a=1, g=2, i=1, m=2, n=1, o=1, p=1, r=2}',
    explanation: 'Loop over the characters and keep counts in a map. `map.merge(ch, 1, Integer::sum)` means "put 1 if the key is new, otherwise add 1 to the existing value". A `TreeMap` keeps the keys sorted so the output is easy to read; use `HashMap` if order does not matter.',
    solution: `import java.util.Map;
import java.util.TreeMap;

public static Map<Character, Integer> charFrequency(String str) {
    Map<Character, Integer> frequency = new TreeMap<>();
    for (char ch : str.toCharArray()) {
        if (ch == ' ') {
            continue;
        }
        frequency.merge(ch, 1, Integer::sum);
    }
    return frequency;
}`,
    complexity: 'Time: O(n log k) with TreeMap (O(n) with HashMap), Space: O(k)',
    difficulty: 'Easy',
  },
  {
    id: 'strings-07',
    category: 'Strings',
    topicId: 'java-strings',
    title: 'Reverse Words in a Sentence',
    problem: 'Reverse the order of the words in a sentence. Remove extra spaces so words are separated by exactly one space.',
    input: 'str = "  Java   is fun "',
    output: '"fun is Java"',
    explanation: 'First `trim` removes spaces at both ends. Then `split("\\\\s+")` splits on one or more whitespace characters, so repeated spaces do not create empty words. Finally, loop over the words from last to first and join them with single spaces using a `StringBuilder`.',
    solution: `public static String reverseWords(String sentence) {
    String[] words = sentence.trim().split("\\\\s+");
    StringBuilder result = new StringBuilder();
    for (int i = words.length - 1; i >= 0; i--) {
        result.append(words[i]);
        if (i > 0) {
            result.append(' ');
        }
    }
    return result.toString();
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'strings-08',
    category: 'Strings',
    topicId: 'java-strings',
    title: 'Remove Duplicate Characters',
    problem: 'Remove duplicate characters from a string, keeping only the first occurrence of each character and preserving the original order.',
    input: 'str = "programming"',
    output: '"progamin"',
    explanation: 'Keep a `Set` of characters we have already seen. For each character, `seen.add(ch)` returns true only the first time that character is added, so we append it to the result only then. Using a `HashSet` makes each lookup O(1) on average.',
    solution: `import java.util.HashSet;
import java.util.Set;

public static String removeDuplicates(String str) {
    Set<Character> seen = new HashSet<>();
    StringBuilder result = new StringBuilder();
    for (char ch : str.toCharArray()) {
        if (seen.add(ch)) {         // add() returns false if already present
            result.append(ch);
        }
    }
    return result.toString();
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'strings-09',
    category: 'Strings',
    topicId: 'java-strings',
    title: 'Longest Substring Without Repeating Characters',
    problem: 'Find the length of the longest substring (a continuous block of characters) that has no repeated characters.',
    input: 'str = "abcabcbb"',
    output: '3 (the substring "abc")',
    explanation: 'Use a sliding window with two indexes, `start` and `end`. A map stores the last index where each character was seen. When the character at `end` was already seen inside the current window, move `start` just past its previous position so the window has no repeats again. After each step, update the best length with `end - start + 1`.',
    solution: `import java.util.HashMap;
import java.util.Map;

public static int lengthOfLongestSubstring(String str) {
    Map<Character, Integer> lastSeenIndex = new HashMap<>();
    int start = 0;
    int maxLength = 0;
    for (int end = 0; end < str.length(); end++) {
        char ch = str.charAt(end);
        Integer previousIndex = lastSeenIndex.get(ch);
        if (previousIndex != null && previousIndex >= start) {
            start = previousIndex + 1;   // shrink window past the repeat
        }
        lastSeenIndex.put(ch, end);
        maxLength = Math.max(maxLength, end - start + 1);
    }
    return maxLength;
}`,
    complexity: 'Time: O(n), Space: O(k) where k is the number of distinct characters',
    difficulty: 'Hard',
  },
  {
    id: 'strings-10',
    category: 'Strings',
    topicId: 'java-strings',
    title: 'String Compression',
    problem: 'Compress a string by replacing each run of repeated characters with the character followed by the run length. If the compressed string is not shorter than the original, return the original.',
    input: 'str = "aabcccccaaa"',
    output: '"a2b1c5a3"',
    explanation: 'Walk through the string and count how many times the current character repeats in a row. When the next character is different (or we reach the end), append the character and its count to a `StringBuilder`, then reset the count. Using `StringBuilder` instead of `+` in a loop avoids creating a new String on every step. At the end, compare lengths and return whichever is shorter.',
    solution: `public static String compress(String str) {
    StringBuilder compressed = new StringBuilder();
    int runLength = 0;
    for (int i = 0; i < str.length(); i++) {
        runLength++;
        boolean isLastChar = (i + 1 == str.length());
        if (isLastChar || str.charAt(i) != str.charAt(i + 1)) {
            compressed.append(str.charAt(i)).append(runLength);
            runLength = 0;          // start counting the next run
        }
    }
    return compressed.length() < str.length() ? compressed.toString() : str;
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'strings-11',
    category: 'Strings',
    topicId: 'java-strings',
    title: 'Check if One String is a Rotation of Another',
    problem: 'Check whether s2 is a rotation of s1. A rotation moves some characters from the front to the back, for example "waterbottle" rotated gives "erbottlewat".',
    input: 's1 = "waterbottle", s2 = "erbottlewat"',
    output: 'true',
    explanation: 'The trick: if you glue s1 to itself ("waterbottlewaterbottle"), every possible rotation of s1 appears inside it. So s2 is a rotation exactly when both strings have the same length and `(s1 + s1).contains(s2)`. The length check matters, otherwise a short substring like "bot" would wrongly pass.',
    solution: `public static boolean isRotation(String s1, String s2) {
    if (s1.length() != s2.length()) {
        return false;
    }
    String doubled = s1 + s1;
    return doubled.contains(s2);
}`,
    complexity: 'Time: O(n) on average (contains may be O(n²) in the worst case), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'strings-12',
    category: 'Strings',
    topicId: 'java-strings',
    title: 'Longest Common Prefix',
    problem: 'Find the longest prefix (starting part) shared by all strings in an array. Return an empty string if there is none.',
    input: 'words = ["flower", "flow", "flight"]',
    output: '"fl"',
    explanation: 'Compare the words column by column (vertical scanning). Take each character position `i` of the first word and check that every other word has the same character at position `i`. As soon as one word is too short or has a different character, the prefix ends just before `i`. If we get through the whole first word, the first word itself is the common prefix.',
    solution: `public static String longestCommonPrefix(String[] words) {
    if (words == null || words.length == 0) {
        return "";
    }
    String first = words[0];
    for (int i = 0; i < first.length(); i++) {
        char expected = first.charAt(i);
        for (int w = 1; w < words.length; w++) {
            String word = words[w];
            if (i >= word.length() || word.charAt(i) != expected) {
                return first.substring(0, i);   // mismatch: prefix ends here
            }
        }
    }
    return first;                   // the whole first word is shared
}`,
    complexity: 'Time: O(S) where S is the total number of characters, Space: O(1) extra',
    difficulty: 'Hard',
  },
]

export default questions
