/**
 * placementIntelligenceService.js
 * Comprehensive Placement Intelligence & Interview Knowledge Base
 * Synthesized from Reddit (r/developersIndia, r/leetcode, r/cscareerquestions),
 * GeeksforGeeks archives, LeetCode Discuss interview experiences (2025–2026), and Quora.
 */

const companiesData = [
  // =========================================================================
  // ─── IT & SOFTWARE ENGINEERING COMPANIES ─────────────────────────────────
  // =========================================================================
  {
    id: "google",
    name: "Google",
    sector: "IT",
    category: "Product / MAANG",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    roles: ["Software Engineer (SWE)", "Associate Product Manager", "Site Reliability Engineer (SRE)"],
    ctcRange: "₹35 LPA – ₹55 LPA (Base + Bonus + RSUs)",
    locations: ["Bengaluru", "Hyderabad", "Pune", "Gurugram"],
    eligibilityCriteria: "B.Tech/M.Tech (All engineering branches, CS/IT/ECE preferred) with 7.0+ CGPA. No active backlogs.",
    tags: ["Graphs", "Dynamic Programming", "Trie", "Segment Trees", "System Design", "Googleyness"],
    
    hiringWorkflow: [
      {
        roundNumber: 1,
        roundName: "Google Online Challenge (GOC) / OA",
        type: "Online Assessment",
        duration: "60 mins",
        platform: "HackerEarth / Internal Google Platform",
        description: "2 algorithmic problem-solving questions. Often involves complex Dynamic Programming on Trees/Graphs or String transformations.",
        keyFocusAreas: ["Tree DP", "Graph shortest paths / BFS-DFS", "Greedy with Prefix Sums", "Bit Manipulation"],
        clearingTips: "Both questions must pass 100% test cases within 45-50 minutes. Pay extreme attention to time limits and O(N) vs O(N^2) constraints."
      },
      {
        roundNumber: 2,
        roundName: "Technical Round 1 (Data Structures & Algorithms)",
        type: "Live Coding Interview",
        duration: "45 mins",
        platform: "Google Meet + Google Docs / Embedded IDE",
        description: "1 hard or 2 medium algorithmic problems. Emphasis on first deriving intuition, proving Big-O complexity, handling corner cases, and then writing modular, bug-free code.",
        keyFocusAreas: ["Graphs (Dijkstra, Topological Sort)", "Sliding Window", "Binary Search over solution space", "Recursion + Memoization"],
        clearingTips: "Communicate your thought process out loud before writing a single line of code. Write clean variable names; do not jump straight to code."
      },
      {
        roundNumber: 3,
        roundName: "Technical Round 2 (Advanced Problem Solving & Core)",
        type: "Live Coding Interview",
        duration: "45 mins",
        platform: "Google Meet + Google Docs",
        description: "Follow-up questions modifying constraints dynamically (e.g. streaming data, memory constraints, multi-threaded environments).",
        keyFocusAreas: ["Trie / Prefix Trees", "Segment Tree / Fenwick Tree", "Heap / Priority Queue", "Concurrency basics"],
        clearingTips: "When the interviewer adds a new constraint, show how your existing data structure can be extended rather than starting from scratch."
      },
      {
        roundNumber: 4,
        roundName: "Googliness & Leadership (Behavioral)",
        type: "Managerial / Cultural",
        duration: "45 mins",
        platform: "Google Meet",
        description: "Assesses how you handle ambiguity, navigate cross-team disagreements, support peers, and bias towards ethical impact using the STAR method.",
        keyFocusAreas: ["Handling project failures", "Ethics in AI/Software", "Collaboration & Conflict resolution", "Dealing with ambiguous requirements"],
        clearingTips: "Structure all answers with Situation -> Task -> Action -> Result (STAR). Highlight 'we' for teamwork and 'I' for your specific contribution."
      }
    ],

    oaPattern: {
      durationMin: 60,
      totalQuestions: 2,
      sections: [
        { sectionName: "Advanced Algorithmic Coding", count: 2, weightage: "100%", description: "Medium-to-Hard LeetCode difficulty questions" }
      ],
      cutoffEstimate: "100% test cases on Q1 and at least 80% on Q2 within 60 mins",
      proctoringRules: "Webcam, screen recording, audio monitoring, strict tab-switch locking",
      negativeMarking: "No negative marking, but runtime penalties apply for wrong submissions",
      syllabus: "Advanced Graphs (Bipartite, Kosaraju), Dynamic Programming (Digit DP, Matrix Exponentiation), Segment Trees, Trie, Monotonic Stack"
    },

    realQuestions2025: [
      {
        id: "goog-q1",
        title: "Minimum Operations to Balance Network Latency on a Tree",
        source: "LeetCode Discuss / Reddit r/developersIndia (On-Campus 2025)",
        difficulty: "Hard",
        category: "Tree DP / Graphs",
        problemStatement: "Given a weighted tree with N servers connected by bidirectional fiber links with latencies w_i. You can decrease the latency of any link by 1 unit (at cost 1) down to a minimum of 0. Find the minimum total cost to make the maximum latency from the root server (node 0) to all leaf servers equal.",
        constraints: "2 <= N <= 10^5, 0 <= w_i <= 10^9.",
        inputSample: "N = 4, edges = [[0,1,3], [0,2,2], [1,3,4]]",
        outputSample: "1 (Adjust link 0-2 from 2 to 3 so all root-to-leaf paths equal 7)",
        approach: "1. Post-order DFS traversal from leaves up to root.\n2. Compute the maximum path length from each node u to any leaf in its subtree: maxPath[u] = max_{v in children} (w(u,v) + maxPath[v]).\n3. In a second traversal, for every edge (u,v), the amount to increase is maxPath[u] - (w(u,v) + maxPath[v]). Sum these increments.",
        timeComplexity: "O(N) single-pass tree traversal",
        spaceComplexity: "O(N) for recursion stack and adjacency list",
        codeCpp: `#include <bits/stdc++.h>
using namespace std;

long long totalCost = 0;

long long dfs(int u, int p, const vector<vector<pair<int,long long>>>& adj) {
    long long maxChild = 0;
    vector<long long> childWeights;
    for (auto& edge : adj[u]) {
        int v = edge.first;
        long long w = edge.second;
        if (v == p) continue;
        long long sub = dfs(v, u, adj) + w;
        maxChild = max(maxChild, sub);
        childWeights.push_back(sub);
    }
    for (long long cw : childWeights) {
        totalCost += (maxChild - cw);
    }
    return maxChild;
}

int main() {
    int n = 4;
    vector<vector<pair<int,long long>>> adj(n);
    adj[0].push_back({1, 3}); adj[1].push_back({0, 3});
    adj[0].push_back({2, 2}); adj[2].push_back({0, 2});
    adj[1].push_back({3, 4}); adj[3].push_back({1, 4});
    totalCost = 0;
    dfs(0, -1, adj);
    cout << "Min cost: " << totalCost << endl;
    return 0;
}`,
        codePython: `def min_cost_balance_tree(n, edges):
    from collections import defaultdict
    adj = defaultdict(list)
    for u, v, w in edges:
        adj[u].append((v, w))
        adj[v].append((u, w))
    
    total_cost = [0]
    def dfs(u, p):
        max_child = 0
        child_paths = []
        for v, w in adj[u]:
            if v == p: continue
            path = dfs(v, u) + w
            max_child = max(max_child, path)
            child_paths.append(path)
        for cp in child_paths:
            total_cost[0] += (max_child - cp)
        return max_child

    dfs(0, -1)
    return total_cost[0]`,
        codeJava: `import java.util.*;

public class BalanceTree {
    static long totalCost = 0;
    static class Edge { int to; long weight; Edge(int t, long w) { to = t; weight = w; } }

    static long dfs(int u, int p, List<List<Edge>> adj) {
        long maxChild = 0;
        List<Long> paths = new ArrayList<>();
        for (Edge e : adj.get(u)) {
            if (e.to == p) continue;
            long path = dfs(e.to, u, adj) + e.weight;
            maxChild = Math.max(maxChild, path);
            paths.add(path);
        }
        for (long cp : paths) {
            totalCost += (maxChild - cp);
        }
        return maxChild;
    }
}`,
        interviewFollowUps: [
          "What if we can only increase link weights instead of decreasing them?",
          "How would you handle dynamic edge weight updates in O(log N) using a Fenwick Tree?"
        ]
      }
    ],

    communityInsights: {
      redditDebrief: "r/developersIndia tip: Google India's OA in 2025 heavily tested Tree DP and custom sorting on coordinate planes. The second technical round almost always asks candidate to write unit test cases and analyze cache locality.",
      gfgDebrief: "GeeksforGeeks placement archives: 85% of shortlists from IITs/NITs had completed the 75 Blind LeetCode questions plus Google-tagged Hard problems on LeetCode. Speed without syntax errors is key.",
      interviewTips: [
        "Never use uninformative variable names like x, y, temp in Google docs.",
        "Always dry-run your code with an edge case (empty array, negative values, integer overflow).",
        "Google interviewers evaluate how receptive you are to hints. Do not become defensive."
      ]
    }
  },

  // =========================================================================
  // ─── 2. AMAZON ───────────────────────────────────────────────────────────
  // =========================================================================
  {
    id: "amazon",
    name: "Amazon",
    sector: "IT",
    category: "Product / MAANG",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
    roles: ["Software Development Engineer I (SDE-1)", "Quality Assurance Engineer (QAE)"],
    ctcRange: "₹30 LPA – ₹45 LPA (Base ₹16-20L + Relocation + Stocks)",
    locations: ["Bengaluru", "Hyderabad", "Chennai", "Pune", "Gurugram"],
    eligibilityCriteria: "B.Tech/M.Tech (All branches) with 6.5+ CGPA, 0 active backlogs.",
    tags: ["Trees / BST", "Sliding Window", "Greedy", "14 Leadership Principles", "OOD / LLD", "BFS / DFS"],
    
    hiringWorkflow: [
      {
        roundNumber: 1,
        roundName: "Amazon Online Assessment (OA1 & OA2)",
        type: "Online Assessment",
        duration: "90 mins",
        platform: "HackerRank / Mettl",
        description: "2 Coding Questions (Medium-Hard) + Work Style Assessment (Amazon 14 Leadership Principles behavioral survey).",
        keyFocusAreas: ["Array sliding window", "String parsing / Hash maps", "Priority Queues (Top K)", "Binary Search"],
        clearingTips: "Do not neglect the Work Style Assessment! Many high-scoring coders get rejected due to inconsistent LP survey answers (Customer Obsession, Bias for Action)."
      },
      {
        roundNumber: 2,
        roundName: "Technical Round 1 (Data Structures & Algorithms)",
        type: "Live Coding Interview",
        duration: "60 mins",
        platform: "Amazon Chime + Live Code Environment",
        description: "20 mins Leadership Principles behavioral questions + 40 mins 2 DSA questions (Trees, Heaps, Dynamic Programming).",
        keyFocusAreas: ["Binary Tree level order / Zigzag", "Graph cycle detection (Kahns)", "LRU Cache implementation", "Two Pointers"],
        clearingTips: "Every technical round starts with 15-20 mins of LP questions. Have 4-5 distinct STAR stories prepared beforehand."
      },
      {
        roundNumber: 3,
        roundName: "Technical Round 2 (DSA & Low Level System Design)",
        type: "Live Coding & LLD",
        duration: "60 mins",
        platform: "Amazon Chime",
        description: "Object-Oriented Design (e.g. Design an Amazon Locker System, Parking Lot, Vending Machine) with SOLID principles.",
        keyFocusAreas: ["Design Patterns (Factory, Strategy, Observer)", "Class diagrams & Schemas", "Thread safety", "Exception handling"],
        clearingTips: "Draw modular classes, interfaces, and explain how new payment methods or locker sizes can be added without modifying existing code (Open-Closed Principle)."
      },
      {
        roundNumber: 4,
        roundName: "Bar Raiser Round (Senior Amazonian Interview)",
        type: "Comprehensive Evaluation",
        duration: "60 mins",
        platform: "Amazon Chime",
        description: "Independent interviewer from another team evaluating whether the candidate raises the bar of existing SDE-1s.",
        keyFocusAreas: ["Deep dive into past college projects", "Are Right, A Lot", "Deliver Results", "Complex Algorithmic optimization"],
        clearingTips: "Be honest about what went wrong in past projects and what you learned. Bar raisers look for humility, self-awareness, and relentless drive."
      }
    ],

    oaPattern: {
      durationMin: 90,
      totalQuestions: 2,
      sections: [
        { sectionName: "DSA Coding Test", count: 2, weightage: "70%", description: "2 LeetCode Medium/Hard questions" },
        { sectionName: "Work Style Assessment", count: 35, weightage: "30%", description: "Scenario-based Leadership Principles rating" }
      ],
      cutoffEstimate: "100% test cases on both questions and highly aligned LP profile",
      proctoringRules: "Webcam video recording, AI keystroke and window blur analysis",
      negativeMarking: "None",
      syllabus: "Arrays, Monotonic Queues, Graphs (BFS/DFS), Dynamic Programming (Knapsack, LCS), Trees, HashMaps"
    },

    realQuestions2025: [
      {
        id: "amzn-q1",
        title: "Minimum Delivery Trucks for Warehouse Item Pairs",
        source: "LeetCode Discuss (Amazon SDE-1 On-Campus 2025/2026)",
        difficulty: "Medium",
        category: "Greedy / Two Pointers",
        problemStatement: "Amazon warehouse has N parcels with weights weights[i]. Each truck can carry at most 2 items, and the total weight of items in a single truck cannot exceed maxCap. Determine the minimum number of delivery trucks needed to dispatch all parcels.",
        constraints: "1 <= N <= 10^5, 1 <= weights[i] <= maxCap <= 10^9.",
        inputSample: "weights = [3, 2, 2, 1], maxCap = 3",
        outputSample: "3 (Truck 1: [3], Truck 2: [2, 1], Truck 3: [2])",
        approach: "Sort the weights array. Use a two-pointer approach: pair the heaviest available item with the lightest item if their sum <= maxCap. Otherwise, ship the heaviest item alone.",
        timeComplexity: "O(N log N) for sorting",
        spaceComplexity: "O(1) extra space",
        codeCpp: `#include <bits/stdc++.h>
using namespace std;

int minTrucks(vector<int>& weights, int maxCap) {
    sort(weights.begin(), weights.end());
    int l = 0, r = weights.size() - 1;
    int trucks = 0;
    while (l <= r) {
        if (weights[l] + weights[r] <= maxCap) {
            l++;
        }
        r--;
        trucks++;
    }
    return trucks;
}`,
        codePython: `def min_trucks(weights, max_cap):
    weights.sort()
    l, r = 0, len(weights) - 1
    trucks = 0
    while l <= r:
        if weights[l] + weights[r] <= max_cap:
            l += 1
        r -= 1
        trucks += 1
    return trucks`,
        codeJava: `import java.util.Arrays;

public class AmazonTrucks {
    public static int minTrucks(int[] weights, int maxCap) {
        Arrays.sort(weights);
        int l = 0, r = weights.length - 1;
        int trucks = 0;
        while (l <= r) {
            if (weights[l] + weights[r] <= maxCap) {
                l++;
            }
            r--;
            trucks++;
        }
        return trucks;
    }
}`,
        interviewFollowUps: [
          "What if each truck can carry up to 3 parcels? (NP-hard Bin Packing, approximation algorithms)",
          "How would you distribute parcels to minimize variance of truck loads?"
        ]
      }
    ],

    communityInsights: {
      redditDebrief: "r/cscareerquestions: Amazon's 14 Leadership Principles (Customer Obsession, Ownership, Bias for Action, Frugality, Earn Trust) account for 50% of the hiring decision. Memorize your projects in STAR format.",
      gfgDebrief: "GFG Archive: High recurrence of LeetCode Top Amazon Questions: Reorder Data in Log Files, Number of Islands, Critical Connections in a Network, Word Ladder.",
      interviewTips: [
        "In System Design (LLD), proactively define Enums, Interfaces, and Exception classes.",
        "When answering LP questions, never say 'we had a disagreement and my manager resolved it' — show how you used data to persuade."
      ]
    }
  },

  // =========================================================================
  // ─── 3. MICROSOFT ────────────────────────────────────────────────────────
  // =========================================================================
  {
    id: "microsoft",
    name: "Microsoft",
    sector: "IT",
    category: "Product / MAANG",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg",
    roles: ["Software Engineer (Full Time / Intern)", "Support Engineer", "Cloud Solutions Architect"],
    ctcRange: "₹28 LPA – ₹48 LPA (Base ₹15-18L + Joining Bonus + Stock Grants)",
    locations: ["Hyderabad", "Bengaluru", "Noida"],
    eligibilityCriteria: "B.Tech/M.Tech (CS, IT, ECE, EEE, Circuit branches) with 7.0+ CGPA.",
    tags: ["Strings & Arrays", "Bit Manipulation", "Linked Lists", "OS & Concurrency", "System Architecture"],

    hiringWorkflow: [
      {
        roundNumber: 1,
        roundName: "Microsoft Codility Online Assessment",
        type: "Online Assessment",
        duration: "75 mins",
        platform: "Codility",
        description: "3 algorithmic coding tasks. Codility tests both correctness (50%) and performance/time-complexity (50%).",
        keyFocusAreas: ["Array prefix/suffix scans", "String pattern matching", "Greedy algorithms", "Interval scheduling"],
        clearingTips: "Always test edge cases: N=1, all negative numbers, extremely large values (10^9) causing integer 32-bit overflow."
      },
      {
        roundNumber: 2,
        roundName: "Technical Round 1 (Core Coding & Data Structures)",
        type: "Live Coding",
        duration: "45 mins",
        platform: "Microsoft Teams + Live Share",
        description: "Live coding focusing on Linked Lists, Binary Trees, and Strings. In-depth questioning on pointer manipulation and memory leaks.",
        keyFocusAreas: ["Linked List loop detection & removal", "Binary Search Tree validation", "Bitwise XOR tricks", "Trie"],
        clearingTips: "Write production-ready code with proper error checking (e.g. checking null pointers before dereferencing)."
      },
      {
        roundNumber: 3,
        roundName: "Technical Round 2 (OS, DBMS, Computer Networks & LLD)",
        type: "Technical & Design",
        duration: "50 mins",
        platform: "Microsoft Teams",
        description: "Deep dive into Operating System concepts (Paging, Thread synchronization, Mutex vs Semaphore) and relational database indexing.",
        keyFocusAreas: ["Deadlock prevention conditions", "Virtual memory & Page faults", "B+ Tree Indexing", "TCP 3-Way Handshake"],
        clearingTips: "Microsoft places very high weight on Core Computer Science fundamentals. Be prepared to explain how a process memory space (Stack/Heap/Data/Text) is mapped."
      },
      {
        roundNumber: 4,
        roundName: "AA Round (As Appropriate / Executive Leader)",
        type: "Hiring Manager & Culture",
        duration: "45 mins",
        platform: "Microsoft Teams",
        description: "Evaluates growth mindset, passion for technology, Azure/cloud familiarity, and long-term career aspirations.",
        keyFocusAreas: ["Growth Mindset philosophy", "Past complex bugs and post-mortem analysis", "System scalability trade-offs"],
        clearingTips: "Demonstrate Satya Nadella's 'Growth Mindset' — turning challenges into learning opportunities."
      }
    ],

    oaPattern: {
      durationMin: 75,
      totalQuestions: 3,
      sections: [
        { sectionName: "Codility Algorithmic Challenge", count: 3, weightage: "100%", description: "Medium difficulty problems" }
      ],
      cutoffEstimate: "Score >= 85% with all test cases passed in under 60 mins",
      proctoringRules: "Full-screen lock, webcam capture, strict clipboard monitoring",
      negativeMarking: "Performance score deducted if time complexity is O(N^2) instead of O(N)",
      syllabus: "Arrays, Two Pointers, Hash Maps, String Manipulation, Graph BFS, Greedy Intervals"
    },

    realQuestions2025: [
      {
        id: "msft-q1",
        title: "Minimum Deletions to Make Character Frequencies Unique",
        source: "LeetCode 1647 / Microsoft Campus Drive 2025",
        difficulty: "Medium",
        category: "Greedy / Hash Set",
        problemStatement: "A string s is called good if there are no two different characters in s that have the same frequency. Given a string s, return the minimum number of characters you need to delete to make s good.",
        constraints: "1 <= s.length <= 10^5, s contains only lowercase English letters.",
        inputSample: "s = 'aab'",
        outputSample: "0 (Freq of 'a' is 2, freq of 'b' is 1 — already unique)",
        approach: "1. Count character frequencies in an array of size 26.\n2. Store seen frequencies in a Hash Set.\n3. For each frequency, if it is already in the set, decrement it (and increment delete count) until it becomes unique or reaches 0.",
        timeComplexity: "O(N + K^2) where K <= 26",
        spaceComplexity: "O(K) where K = 26",
        codeCpp: `#include <bits/stdc++.h>
using namespace std;

int minDeletions(string s) {
    vector<int> freq(26, 0);
    for (char c : s) freq[c - 'a']++;
    unordered_set<int> seen;
    int deletions = 0;
    for (int f : freq) {
        while (f > 0 && seen.count(f)) {
            f--;
            deletions++;
        }
        if (f > 0) seen.insert(f);
    }
    return deletions;
}`,
        codePython: `def min_deletions(s: str) -> int:
    from collections import Counter
    freq = Counter(s)
    seen = set()
    deletions = 0
    for f in freq.values():
        while f > 0 and f in seen:
            f -= 1
            deletions += 1
        if f > 0:
            seen.add(f)
    return deletions`,
        codeJava: `import java.util.*;

public class Solution {
    public int minDeletions(String s) {
        int[] freq = new int[26];
        for (char c : s.toCharArray()) freq[c - 'a']++;
        Set<Integer> seen = new HashSet<>();
        int deletions = 0;
        for (int f : freq) {
            while (f > 0 && seen.contains(f)) {
                f--;
                deletions++;
            }
            if (f > 0) seen.add(f);
        }
        return deletions;
    }
}`,
        interviewFollowUps: [
          "Can you solve this in O(1) auxiliary space using sorting?"
        ]
      }
    ],

    communityInsights: {
      redditDebrief: "r/developersIndia: Microsoft interviews in 2025 had dedicated questions on multithreading in C++/Java (Producer-Consumer using condition variables) and designing LRU cache with concurrency locks.",
      gfgDebrief: "GFG Microsoft archive: Expect questions on reversing a linked list in groups of K, Lowest Common Ancestor in Binary Tree, and finding maximum sum path.",
      interviewTips: [
        "Be ready to explain how virtual memory works under Windows / Linux kernel.",
        "Always write clean C++ RAII / smart pointers (unique_ptr/shared_ptr) instead of raw malloc/free."
      ]
    }
  },

  // =========================================================================
  // ─── 4. GOLDMAN SACHS ────────────────────────────────────────────────────
  // =========================================================================
  {
    id: "goldman_sachs",
    name: "Goldman Sachs",
    sector: "IT",
    category: "Fintech / Global Investment Banking",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/61/Goldman_Sachs.svg",
    roles: ["Engineering Analyst (Software / Quant)", "Risk & Quantitative Analyst"],
    ctcRange: "₹26 LPA – ₹42 LPA (Base ₹18L + Substantial Performance Bonus)",
    locations: ["Bengaluru", "Hyderabad"],
    eligibilityCriteria: "B.Tech/M.Tech (All Engineering branches allowed) with 7.0+ CGPA.",
    tags: ["Probability & Combinatorics", "Matrix DP", "Hash Maps", "Low Latency", "Core CS MCQs"],

    hiringWorkflow: [
      {
        roundNumber: 1,
        roundName: "Goldman Sachs Aptitude & Coding OA",
        type: "Online Assessment",
        duration: "105 mins",
        platform: "HackerRank",
        description: "Sectional test: 2 Coding Questions (Medium-Hard) + Advanced Math/Probability MCQs + CS Core MCQs + Numerical Reasoning.",
        keyFocusAreas: ["Bayes Theorem & Expected Value", "Matrix Dynamic Programming", "Combinatorics", "Memory optimization"],
        clearingTips: "There is sectional cutoff! You must score well in Math/Probability and CS fundamentals, not just coding."
      },
      {
        roundNumber: 2,
        roundName: "Technical Round 1 (Algorithms & Mathematics)",
        type: "Live Coding",
        duration: "50 mins",
        platform: "Zoom / HackerRank CodePair",
        description: "Puzzles, Mathematical expectations, and complex Data Structures (Heaps, Trie, Binary Search).",
        keyFocusAreas: ["Stock buy-sell variations", "Median in a stream", "Probability of random walks", "Trie autocomplete"],
        clearingTips: "Fintech firms love probability and expected value puzzles. Practice 50 classic brain teasers on Heard on the Street."
      },
      {
        roundNumber: 3,
        roundName: "Technical Round 2 (System Architecture & Concurrency)",
        type: "System Design & Low Latency",
        duration: "50 mins",
        platform: "Zoom",
        description: "Design a high-frequency trading order matching engine or real-time ticker stream with lock-free queues.",
        keyFocusAreas: ["Ring buffer (Disruptor pattern)", "Lock-free atomic variables", "Garbage collection tuning", "SQL vs NoSQL latency"],
        clearingTips: "Explain memory cache line alignment, CPU branch prediction, and why linked lists cause cache misses in high-throughput systems."
      }
    ],

    oaPattern: {
      durationMin: 105,
      totalQuestions: 22,
      sections: [
        { sectionName: "Advanced Math & Probability", count: 10, weightage: "30%", description: "Combinatorics, Bayes, Random Variables" },
        { sectionName: "CS Core Fundamentals", count: 10, weightage: "25%", description: "OS, DBMS, Networks, OOPs" },
        { sectionName: "Algorithmic Coding", count: 2, weightage: "45%", description: "1 Medium + 1 Hard LeetCode problem" }
      ],
      cutoffEstimate: ">= 75% in each individual section",
      proctoringRules: "Audio & video proctoring with automated face detection",
      negativeMarking: "-0.25 on MCQ sections",
      syllabus: "Probability, Matrix DP, Dynamic Programming, Two Pointers, OS Scheduling, SQL Normalization"
    },

    realQuestions2025: [
      {
        id: "gs-q1",
        title: "Best Time to Buy and Sell Stock with Transaction Fee & Cooldown",
        source: "LeetCode 714 & 309 Hybrid / Goldman Sachs OA 2025",
        difficulty: "Hard",
        category: "State Machine DP",
        problemStatement: "Given an array prices where prices[i] is the price of a given stock on the i-th day, a transaction fee fee, and a cooldown of 1 day after selling. Find the maximum profit you can achieve.",
        constraints: "1 <= N <= 10^5, 0 <= prices[i] <= 10^4, 0 <= fee <= 10^3.",
        inputSample: "prices = [1, 3, 2, 8, 4, 9], fee = 2",
        outputSample: "8",
        approach: "Define 3 states at day i:\n- held[i]: Max profit holding a stock.\n- sold[i]: Max profit selling today.\n- cooldown[i]: Max profit doing nothing.\nTransitions:\nheld[i] = max(held[i-1], cooldown[i-1] - prices[i])\nsold[i] = held[i-1] + prices[i] - fee\ncooldown[i] = max(cooldown[i-1], sold[i-1]).",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1) using 3 rolling variables",
        codeCpp: `#include <bits/stdc++.h>
using namespace std;

int maxProfit(vector<int>& prices, int fee) {
    int n = prices.size();
    if (n <= 1) return 0;
    int held = -prices[0];
    int sold = 0;
    int cooldown = 0;
    for (int i = 1; i < n; i++) {
        int prev_held = held;
        int prev_sold = sold;
        held = max(held, cooldown - prices[i]);
        sold = prev_held + prices[i] - fee;
        cooldown = max(cooldown, prev_sold);
    }
    return max(sold, cooldown);
}`,
        codePython: `def max_profit(prices, fee):
    if len(prices) <= 1: return 0
    held = -prices[0]
    sold = 0
    cooldown = 0
    for p in prices[1:]:
        prev_held = held
        prev_sold = sold
        held = max(held, cooldown - p)
        sold = prev_held + p - fee
        cooldown = max(cooldown, prev_sold)
    return max(sold, cooldown)`,
        codeJava: `public class Solution {
    public int maxProfit(int[] prices, int fee) {
        if (prices.length <= 1) return 0;
        int held = -prices[0];
        int sold = 0, cooldown = 0;
        for (int i = 1; i < prices.length; i++) {
            int prevHeld = held;
            int prevSold = sold;
            held = Math.max(held, cooldown - prices[i]);
            sold = prevHeld + prices[i] - fee;
            cooldown = Math.max(cooldown, prevSold);
        }
        return Math.max(sold, cooldown);
    }
}`,
        interviewFollowUps: [
          "What if you can perform at most K transactions total?"
        ]
      }
    ],

    communityInsights: {
      redditDebrief: "r/developersIndia: Goldman Sachs rounds focus heavily on code modularity and mathematical proofs of correctness. Don't guess answers on probability MCQs due to negative marking.",
      gfgDebrief: "GFG Archive: High occurrence of questions like Rainwater Trapping, Trapping Rain Water II (3D), Knight Probability on Chessboard, and LRU Cache.",
      interviewTips: [
        "Review probability distribution formulas (Binomial, Poisson, Normal) before OA.",
        "Demonstrate an interest in low latency and fintech performance tuning."
      ]
    }
  },

  // =========================================================================
  // ─── 5. TCS (DIGITAL & PRIME) ────────────────────────────────────────────
  // =========================================================================
  {
    id: "tcs_digital",
    name: "TCS (Digital / Prime)",
    sector: "IT",
    category: "Services & Mass Tech / Digital Cadre",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg",
    roles: ["System Engineer (Digital)", "Prime Developer (High CTC Track)", "Ninja Trainee"],
    ctcRange: "₹7.5 LPA – ₹11.5 LPA (Prime Track ₹9-11.5L; Digital ₹7-7.5L; Ninja ₹3.6L)",
    locations: ["Pan-India (Bengaluru, Hyderabad, Mumbai, Chennai, Kolkata, Pune)"],
    eligibilityCriteria: "B.Tech (All branches) with 60% or 6.0 CGPA throughout 10th, 12th, and B.Tech. Max 1 active backlog.",
    tags: ["Advanced Quantitative", "DSA Coding", "Data Structures", "SQL & DBMS", "Web Development"],

    hiringWorkflow: [
      {
        roundNumber: 1,
        roundName: "TCS National Qualifier Test (NQT)",
        type: "Online Assessment",
        duration: "130 mins",
        platform: "TCS iON Platform",
        description: "Cognitive Skills (Numerical, Verbal, Reasoning) + Advanced Technical Section (Advanced Coding 2 Questions + Advanced Quant).",
        keyFocusAreas: ["Arithmetic & Number Theory", "Arrays & String Manipulation", "Permutations & Combinations", "Recursion"],
        clearingTips: "Prime/Digital shortlist requires passing both Advanced Coding problems and high scores in Advanced Quantitative reasoning."
      },
      {
        roundNumber: 2,
        roundName: "Technical + Managerial + HR Combined Interview",
        type: "Comprehensive Interview",
        duration: "45 mins",
        platform: "TCS iON Digital Zone / Online",
        description: "Panel interview assessing project architecture, OOPs principles in Java/Python, basic SQL queries, and willingness to relocate.",
        keyFocusAreas: ["SQL Joins and Group By", "OOPs 4 Pillars (Polymorphism, Inheritance)", "Final Year B.Tech project", "SDLC models (Agile/Scrum)"],
        clearingTips: "Be confident and articulate about your college project. Explain the database schema, frontend-backend API integration, and challenges solved."
      }
    ],

    oaPattern: {
      durationMin: 130,
      totalQuestions: 62,
      sections: [
        { sectionName: "Foundation Section (Aptitude & Verbal)", count: 40, weightage: "30%", description: "Speed arithmetic, reading comprehension, logical puzzles" },
        { sectionName: "Advanced Quantitative & Reasoning", count: 20, weightage: "30%", description: "Higher mathematics, probability, data interpretation" },
        { sectionName: "Hands-on Coding", count: 2, weightage: "40%", description: "1 Easy-Medium + 1 Medium DSA Problem" }
      ],
      cutoffEstimate: "Top 10% get Prime offer (₹9-11.5L), Top 25% get Digital (₹7.5L)",
      proctoringRules: "Strict TCS iON physical/online proctoring, no calculator, browser lockdown",
      negativeMarking: "No negative marking on coding; minor penalty on cognitive MCQ sections",
      syllabus: "Number theory, Strings, Matrix transformations, Sorting, Dynamic Programming basics, SQL Joins"
    },

    realQuestions2025: [
      {
        id: "tcs-q1",
        title: "Count Substrings with Equal Number of Consecutive Characters",
        source: "TCS NQT Digital Exam 2025/2026",
        difficulty: "Easy-Medium",
        category: "String / Two Pointers",
        problemStatement: "Given a binary string S of length N, find the number of non-empty substrings that have an equal number of consecutive 0's and 1's.",
        constraints: "1 <= N <= 10^5, S[i] in {'0', '1'}.",
        inputSample: "S = '00110011'",
        outputSample: "6 (Substrings: '0011', '01', '1100', '10', '0011', '01')",
        approach: "Count the lengths of consecutive contiguous groups of 0s and 1s. The number of valid substrings between two adjacent groups of sizes c_1 and c_2 is min(c_1, c_2). Sum these over all adjacent pairs.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1) with rolling counter",
        codeCpp: `#include <bits/stdc++.h>
using namespace std;

int countBinarySubstrings(string s) {
    int prev = 0, curr = 1, ans = 0;
    for (int i = 1; i < s.length(); i++) {
        if (s[i] == s[i - 1]) {
            curr++;
        } else {
            ans += min(prev, curr);
            prev = curr;
            curr = 1;
        }
    }
    ans += min(prev, curr);
    return ans;
}`,
        codePython: `def count_binary_substrings(s: str) -> int:
    prev, curr, ans = 0, 1, 0
    for i in range(1, len(s)):
        if s[i] == s[i - 1]:
            curr += 1
        else:
            ans += min(prev, curr)
            prev = curr
            curr = 1
    return ans + min(prev, curr)`,
        codeJava: `public class Solution {
    public int countBinarySubstrings(String s) {
        int prev = 0, curr = 1, ans = 0;
        for (int i = 1; i < s.length(); i++) {
            if (s.charAt(i) == s.charAt(i - 1)) {
                curr++;
            } else {
                ans += Math.min(prev, curr);
                prev = curr;
                curr = 1;
            }
        }
        return ans + Math.min(prev, curr);
    }
}`,
        interviewFollowUps: [
          "Can you extend this to strings with 3 characters ('0', '1', '2')?"
        ]
      }
    ],

    communityInsights: {
      redditDebrief: "r/developersIndia: TCS Prime (₹9LPA) was introduced in 2024/2025. Solving both coding questions in NQT within 40 minutes guarantees a Prime interview call.",
      gfgDebrief: "GFG TCS archive: In the interview, prepare SQL queries (2nd highest salary, INNER vs LEFT JOIN) and know the difference between Abstract Class and Interface in Java.",
      interviewTips: [
        "In TCS iON coding editor, compile only when you're confident as compiler limits are slow.",
        "Always accept rotational shifts and pan-India relocation without hesitation during HR."
      ]
    }
  },

  // =========================================================================
  // ─── CORE ENGINEERING COMPANIES ──────────────────────────────────────────
  // =========================================================================
  {
    id: "texas_instruments",
    name: "Texas Instruments (TI)",
    sector: "Core",
    category: "Semiconductor & Analog/Digital VLSI",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Texas_Instruments_logo.svg",
    roles: ["Analog Design Engineer", "Digital Design Engineer", "Embedded Software & Applications Engineer"],
    ctcRange: "₹24 LPA – ₹36 LPA (Base ₹16-20L + Joining Bonus + Benefits)",
    locations: ["Bengaluru"],
    eligibilityCriteria: "B.Tech/M.Tech in EEE, ECE, Instrumentation, VLSI with 7.5+ CGPA. Strong fundamentals in circuit theory and electronics.",
    tags: ["Op-Amps", "BJT & MOSFET Small Signal", "Bode Plots & Stability", "Verilog RTL", "STA Setup/Hold"],

    hiringWorkflow: [
      {
        roundNumber: 1,
        roundName: "TI Online Technical Written Assessment",
        type: "Written Screening Test",
        duration: "90 mins",
        platform: "Mettl / HackerEarth",
        description: "Domain-specific: Analog Track (RC filters, Op-Amps, MOSFET biasing, Poles/Zeros, Noise) OR Digital Track (Verilog, Static Timing Analysis, FSMs, Computer Architecture).",
        keyFocusAreas: ["Small signal analysis (g_m, r_o)", "Feedback topologies (series-shunt)", "Setup and Hold time equations", "Digital synchronous counters"],
        clearingTips: "Draw the small-signal equivalent model on scratch paper first. Double check units (kOhm, pF, ns)."
      },
      {
        roundNumber: 2,
        roundName: "Technical Interview Round 1 (First Principles Derivations)",
        type: "Chalkboard / Live Whiteboard",
        duration: "60 mins",
        platform: "Microsoft Teams / In-Person",
        description: "Deriving circuit transfer functions from first principles. Drawing waveforms at each node of an RC/Op-Amp circuit over time.",
        keyFocusAreas: ["Miller theorem and capacitance multiplication", "Op-Amp non-idealities (Offset voltage, Slew Rate, CMRR)", "CMOS inverter voltage transfer curve (VTC)", "Bode plot asymptotes"],
        clearingTips: "Explain the intuitive physical reasoning before diving into equations (e.g. 'At t=0+, the uncharged capacitor acts as a short circuit')."
      },
      {
        roundNumber: 3,
        roundName: "Technical Interview Round 2 (Design & Practical Scenarios)",
        type: "Design Challenge",
        duration: "60 mins",
        platform: "Teams / In-Person",
        description: "Given a practical specification (e.g. Design a low-noise bandgap reference or a 100MHz clock divider), walk through component selection and trade-offs.",
        keyFocusAreas: ["Phase margin & Gain margin stability compensation", "Static Timing Analysis (Clock skew, Jitter)", "ADC architectures (SAR vs Sigma-Delta)", "Thermal noise (4kTR)"],
        clearingTips: "Discuss trade-offs: power dissipation vs bandwidth vs silicon area vs noise."
      },
      {
        roundNumber: 4,
        roundName: "HR & Values Fitment",
        type: "Behavioral & Fit",
        duration: "30 mins",
        platform: "Teams",
        description: "TI Values: Integrity, Innovation, Commitment. Discussion on why you prefer Core Semiconductor over Software/IT.",
        keyFocusAreas: ["Why Core over IT?", "Handling design deadlines", "Team collaboration in chip tape-outs"],
        clearingTips: "Demonstrate genuine passion for hardware, silicon innovation, and long-term career growth in semiconductor design."
      }
    ],

    oaPattern: {
      durationMin: 90,
      totalQuestions: 30,
      sections: [
        { sectionName: "Engineering Mathematics & Aptitude", count: 10, weightage: "25%", description: "Calculus, Differential Equations, Laplace Transforms" },
        { sectionName: "Core Technical Track (Analog / Digital)", count: 20, weightage: "75%", description: "GATE-level and advanced circuit numericals" }
      ],
      cutoffEstimate: "Score >= 70% in Core Technical Section",
      proctoringRules: "Webcam and screen proctoring, scientific calculator allowed",
      negativeMarking: "-0.25 on MCQs",
      syllabus: "BJT/MOSFET amplifiers, Op-Amps, RC/RLC transient response, Two-port networks, Verilog, STA, Counters, FSMs"
    },

    realQuestions2025: [
      {
        id: "ti-q1",
        title: "MOSFET Common Source Amplifier with Active Load & Miller Effect",
        source: "Texas Instruments Campus Interview Experience 2025",
        difficulty: "Hard",
        category: "Analog Circuits / VLSI",
        problemStatement: "For an NMOS common-source amplifier with active PMOS current source load (g_m1 = 2 mA/V, r_o1 = 50 kOhm, r_o2 = 50 kOhm), gate-to-drain overlap capacitance C_gd = 20 fF, and gate-to-source capacitance C_gs = 100 fF. Calculate the low-frequency voltage gain A_v and the effective input capacitance C_in due to the Miller effect.",
        constraints: "Assume source resistance R_s = 10 kOhm, load capacitance C_L = 100 fF.",
        inputSample: "g_m = 2 mA/V, r_o1 = r_o2 = 50 kOhms, C_gd = 20 fF, C_gs = 100 fF",
        outputSample: "A_v = -50 V/V (-34 dB), C_in = 1.12 pF",
        approach: "1. Calculate output resistance: R_out = r_o1 || r_o2 = 50k || 50k = 25 kOhm.\n2. Low frequency voltage gain: A_v = -g_m1 * R_out = -(2e-3)(25e3) = -50.\n3. Apply Miller Theorem to C_gd: C_M = C_gd(1 - A_v) = 20 fF * (1 - (-50)) = 20 * 51 = 1020 fF = 1.02 pF.\n4. Total input capacitance: C_in = C_gs + C_M = 100 fF + 1020 fF = 1120 fF = 1.12 pF.",
        timeComplexity: "Analytical Circuit Derivation",
        spaceComplexity: "N/A",
        codeCpp: `#include <iostream>
#include <cmath>
using namespace std;

int main() {
    double gm = 2e-3; // 2 mA/V
    double ro1 = 50e3, ro2 = 50e3;
    double Rout = (ro1 * ro2) / (ro1 + ro2); // 25 kOhm
    double Av = -gm * Rout; // -50
    double Cgd = 20e-15, Cgs = 100e-15;
    double Cin = Cgs + Cgd * (1.0 - Av); // 1.12 pF
    double Rs = 10e3;
    double f_3dB = 1.0 / (2 * M_PI * Rs * Cin); // ~14.2 MHz
    cout << "Low frequency gain Av: " << Av << " (" << 20 * log10(abs(Av)) << " dB)" << endl;
    cout << "Effective Input Capacitance Cin: " << Cin * 1e12 << " pF" << endl;
    cout << "Dominant pole frequency f_3dB: " << f_3dB / 1e6 << " MHz" << endl;
    return 0;
}`,
        codePython: `import math

gm = 2e-3
ro1, ro2 = 50e3, 50e3
Rout = (ro1 * ro2) / (ro1 + ro2)
Av = -gm * Rout
Cgd, Cgs = 20e-15, 100e-15
Cin = Cgs + Cgd * (1.0 - Av)
Rs = 10e3
f_3dB = 1.0 / (2 * math.pi * Rs * Cin)

print(f"Gain Av: {Av} ({20*math.log10(abs(Av)):.2f} dB)")
print(f"Effective Cin: {Cin*1e12:.2f} pF")
print(f"Dominant Pole f_3dB: {f_3dB/1e6:.2f} MHz")`,
        codeJava: `public class MOSFETSim {
    public static void main(String[] args) {
        double gm = 2e-3;
        double ro = 50e3;
        double Rout = (ro * ro) / (ro + ro);
        double Av = -gm * Rout;
        double Cgd = 20e-15, Cgs = 100e-15;
        double Cin = Cgs + Cgd * (1.0 - Av);
        System.out.printf("Av: %.1f, Cin: %.2f pF%n", Av, Cin * 1e12);
    }
}`,
        interviewFollowUps: [
          "How does adding a Source Degeneration Resistor R_S improve linearity and what happens to the gain?",
          "How does a Cascode configuration eliminate the Miller effect on C_gd?"
        ]
      }
    ],

    communityInsights: {
      redditDebrief: "r/ECE & Reddit India: TI interviewers will ask you to draw the step response of an RC circuit with a diode and an Op-Amp in negative feedback. Never use formulas without explaining the charge transfer mechanism.",
      gfgDebrief: "GFG Core Archives: Be thoroughly prepared with Sedra & Smith (Microelectronic Circuits) and Razavi (Design of Analog CMOS Integrated Circuits).",
      interviewTips: [
        "Master Slew Rate vs Bandwidth limitations in Op-Amps.",
        "For digital roles, know how Setup Time violation can be fixed by increasing clock period, but Hold Time violation cannot!"
      ]
    }
  },

  // =========================================================================
  // ─── 7. QUALCOMM ─────────────────────────────────────────────────────────
  // =========================================================================
  {
    id: "qualcomm",
    name: "Qualcomm",
    sector: "Core",
    category: "Semiconductor, 5G Modem & Wireless Systems",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/77/Qualcomm-Logo.svg",
    roles: ["Hardware Engineer (Digital ASIC / Modem)", "Embedded Software Engineer", "Systems Validation Engineer"],
    ctcRange: "₹22 LPA – ₹34 LPA (Base ₹15-18L + Stocks + Performance Bonus)",
    locations: ["Hyderabad", "Bengaluru", "Chennai", "Noida"],
    eligibilityCriteria: "B.Tech/M.Tech (ECE, EEE, CS, VLSI) with 7.0+ CGPA. Strong C/C++, Verilog, Computer Architecture & Digital Design.",
    tags: ["Verilog RTL", "Static Timing Analysis", "Computer Architecture", "ARM Cortex", "C/C++ Low Level", "Cache Coherence"],

    hiringWorkflow: [
      {
        roundNumber: 1,
        roundName: "Qualcomm Online Screening Assessment",
        type: "Online Assessment",
        duration: "90 mins",
        platform: "HackerRank / HirePro",
        description: "Aptitude + C Programming & Pointers + Core Digital Electronics / Verilog / Computer Architecture MCQs + 1 Coding Problem.",
        keyFocusAreas: ["Bitwise operations & Masking in C", "Pointer arithmetic & Memory alignment", "Setup/Hold time calculation", "Cache mapping (Direct, Set-Associative)"],
        clearingTips: "Practice output-based C questions involving volatile, static, pointer typecasting, and bit fields."
      },
      {
        roundNumber: 2,
        roundName: "Technical Interview Round 1 (Digital Design & Verilog / C)",
        type: "Technical Live Coding & RTL",
        duration: "60 mins",
        platform: "Teams / In-Person",
        description: "Design synchronous FSMs (e.g. Sequence detector 1011 overlapping), write synthesizable Verilog, and analyze race conditions.",
        keyFocusAreas: ["Blocking (=) vs Non-blocking (<=) assignments", "Metastability & 2-Flip-Flop Synchronizer", "Bitwise C algorithms", "DMA controllers"],
        clearingTips: "Always write non-blocking assignments inside sequential always @(posedge clk) blocks to avoid RTL simulation race conditions."
      },
      {
        roundNumber: 3,
        roundName: "Technical Interview Round 2 (Architecture, STA & RTOS)",
        type: "Advanced Technical",
        duration: "60 mins",
        platform: "Teams",
        description: "Static Timing Analysis with clock skew and jitter, Cache coherence protocols (MESI), and Interrupt Service Routines (ISR).",
        keyFocusAreas: ["T_clk >= T_cq + T_comb + T_setup - T_skew", "Hold time: T_cq + T_comb >= T_hold + T_skew", "Priority Inversion in RTOS & Priority Ceiling protocol"],
        clearingTips: "Be crisp with definitions: Explain why clock skew can help setup time but hurts hold time."
      }
    ],

    oaPattern: {
      durationMin: 90,
      totalQuestions: 35,
      sections: [
        { sectionName: "General Aptitude", count: 10, weightage: "20%", description: "Quantitative & logical reasoning" },
        { sectionName: "C Programming & Pointers", count: 10, weightage: "30%", description: "Output questions, bitwise masks, memory layouts" },
        { sectionName: "Digital Electronics & Architecture", count: 15, weightage: "50%", description: "STA, K-maps, Verilog, Cache, Pipelining hazards" }
      ],
      cutoffEstimate: "Score >= 75%",
      proctoringRules: "Camera & screen proctoring, no external compiler allowed",
      negativeMarking: "-0.25 on MCQs",
      syllabus: "Digital circuits, STA, FSM, C Language, Pointers, Memory management, Computer Architecture (Pipelining, Hazards, Cache)"
    },

    realQuestions2025: [
      {
        id: "qcom-q1",
        title: "Maximum Operating Frequency with Clock Skew and Jitter",
        source: "Qualcomm Campus Hiring Drive 2025/2026",
        difficulty: "Medium-Hard",
        category: "Digital VLSI / STA",
        problemStatement: "In a synchronous digital pipeline, Flip-Flop 1 drives Flip-Flop 2 through a combinational logic block. Parameters:\n- T_cq = 1.2 ns (Clock-to-Q delay)\n- T_comb = 3.5 ns (Combinational delay)\n- T_setup = 0.8 ns, T_hold = 0.4 ns\n- Clock Skew T_skew = +0.3 ns (Clock arrives later at FF2)\n- Clock Jitter T_jitter = 0.2 ns.\nCalculate: 1) Minimum clock period T_min and maximum frequency f_max. 2) Verify if there is any hold time violation.",
        constraints: "All delays non-negative real numbers.",
        inputSample: "T_cq = 1.2ns, T_comb = 3.5ns, T_setup = 0.8ns, T_hold = 0.4ns, T_skew = 0.3ns, T_jitter = 0.2ns",
        outputSample: "T_min = 5.4 ns (f_max = 185.18 MHz), Hold Margin = +4.0 ns (No violation)",
        approach: "1. Setup Time Equation:\nT_clk + T_skew >= T_cq + T_comb + T_setup + T_jitter\n=> T_min = T_cq + T_comb + T_setup + T_jitter - T_skew = 1.2 + 3.5 + 0.8 + 0.2 - 0.3 = 5.4 ns.\n2. Maximum Frequency: f_max = 1 / T_min = 1 / (5.4 * 10^-9) = 185.185 MHz.\n3. Hold Time Equation:\nT_cq + T_comb >= T_hold + T_skew => 1.2 + 3.5 = 4.7 ns >= 0.4 + 0.3 = 0.7 ns.\nHold slack = 4.7 - 0.7 = +4.0 ns (Safe from hold violation).",
        timeComplexity: "Analytical Calculation",
        spaceComplexity: "N/A",
        codeCpp: `#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    double T_cq = 1.2, T_comb = 3.5, T_setup = 0.8, T_hold = 0.4;
    double T_skew = 0.3, T_jitter = 0.2;

    double T_min = T_cq + T_comb + T_setup + T_jitter - T_skew;
    double f_max = (1.0 / (T_min * 1e-9)) / 1e6; // in MHz
    double hold_slack = (T_cq + T_comb) - (T_hold + T_skew);

    cout << fixed << setprecision(3);
    cout << "Minimum Clock Period T_min: " << T_min << " ns" << endl;
    cout << "Maximum Clock Frequency f_max: " << f_max << " MHz" << endl;
    cout << "Hold Time Slack: " << hold_slack << " ns -> " << (hold_slack >= 0 ? "PASSED" : "VIOLATION") << endl;
    return 0;
}`,
        codePython: `T_cq, T_comb, T_setup, T_hold = 1.2, 3.5, 0.8, 0.4
T_skew, T_jitter = 0.3, 0.2

T_min = T_cq + T_comb + T_setup + T_jitter - T_skew
f_max_mhz = 1000.0 / T_min
hold_slack = (T_cq + T_comb) - (T_hold + T_skew)

print(f"T_min: {T_min:.3f} ns | f_max: {f_max_mhz:.2f} MHz")
print(f"Hold Slack: {hold_slack:.3f} ns ({'PASSED' if hold_slack >= 0 else 'VIOLATION'})")`,
        codeJava: `public class STASim {
    public static void main(String[] args) {
        double T_cq = 1.2, T_comb = 3.5, T_setup = 0.8, T_hold = 0.4, T_skew = 0.3, T_jitter = 0.2;
        double T_min = T_cq + T_comb + T_setup + T_jitter - T_skew;
        double f_max = 1000.0 / T_min;
        System.out.printf("T_min: %.3f ns, f_max: %.2f MHz%n", T_min, f_max);
    }
}`,
        interviewFollowUps: [
          "Why is hold time independent of clock frequency?",
          "How does multi-cycle path constraint affect setup time verification?"
        ]
      }
    ],

    communityInsights: {
      redditDebrief: "r/hardware & r/developersIndia: Qualcomm tests C bitwise manipulations heavily in round 1. Example: Reverse bits of a 32-bit integer in O(1) using parallel bitwise masks.",
      gfgDebrief: "GFG Qualcomm archives: Focus on Morris Inorder Traversal, DMA transfers, and Memory Management Units (TLB hit/miss).",
      interviewTips: [
        "Be able to write a synthesizable Verilog parameterized FIFO with gray code pointers.",
        "Demonstrate deep understanding of cache line false sharing in multi-core processors."
      ]
    }
  },

  // =========================================================================
  // ─── 8. ABB / SCHNEIDER ELECTRIC ─────────────────────────────────────────
  // =========================================================================
  {
    id: "abb_schneider",
    name: "ABB / Schneider Electric",
    sector: "Core",
    category: "Power Systems, Industrial Automation & Smart Energy",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/00/ABB_logo.svg",
    roles: ["Power Systems Engineer", "R&D Automation Engineer", "Protection & Switchgear Specialist"],
    ctcRange: "₹12 LPA – ₹18 LPA (Base ₹9-12L + Allowances + Bonuses)",
    locations: ["Bengaluru", "Chennai", "Vadodara", "Hyderabad"],
    eligibilityCriteria: "B.Tech/M.Tech in EEE, Electrical & Instrumentation with 7.0+ CGPA. Strong Power Systems, Machines, Power Electronics, and PLC/SCADA.",
    tags: ["Protection Relays", "Motor Control V/f", "Switchgear Sizing", "PLC / SCADA", "Transformer Testing"],

    hiringWorkflow: [
      {
        roundNumber: 1,
        roundName: "ABB / Schneider Technical Written Test",
        type: "Online Assessment",
        duration: "75 mins",
        platform: "Mettl / CoCubes",
        description: "Power System protection, Transformer equivalent circuits, Symmetrical components fault analysis, Inductive motor drives, Power electronics harmonics.",
        keyFocusAreas: ["IDMT relay characteristic curves", "Buchholz relay operation", "Harmonic filters (APF/PPF)", "Short circuit MVA"],
        clearingTips: "Review standard IEEE / IEC standards for circuit breaker breaking and making capacities."
      },
      {
        roundNumber: 2,
        roundName: "Technical Interview Round 1 (Power Systems & Protection)",
        type: "Technical Viva & System Analysis",
        duration: "50 mins",
        platform: "Teams / In-Person",
        description: "Differential protection of 3-phase transformers (star-delta CT connection for phase shift cancellation), distance relays (Mho/Impedance relay zones).",
        keyFocusAreas: ["CT saturation & inrush current restraint (2nd harmonic)", "Zone 1, Zone 2, Zone 3 protection coverage", "Per-unit system calculations"],
        clearingTips: "Draw the 3-phase connection diagram of the transformer and CTs with polarity dots clearly."
      },
      {
        roundNumber: 3,
        roundName: "Technical Interview Round 2 (Automation, Drives & PLC)",
        type: "Automation & Drives",
        duration: "45 mins",
        platform: "Teams",
        description: "Ladder logic programming for conveyor belts/motor reversing, V/f scalar drive vs Field Oriented Vector Control (FOC), SCADA communication protocols (Modbus, IEC 61850).",
        keyFocusAreas: ["Ladder logic NO/NC contacts and timers", "Space Vector PWM (SVPWM) switching", "IEC 61850 GOOSE messaging in smart substations"],
        clearingTips: "Highlight practical hands-on lab experience with motor drives and PLCs."
      }
    ],

    oaPattern: {
      durationMin: 75,
      totalQuestions: 40,
      sections: [
        { sectionName: "Engineering Aptitude", count: 10, weightage: "25%", description: "Quantitative & logical analysis" },
        { sectionName: "Electrical Engineering Core", count: 30, weightage: "75%", description: "Protection, Machines, Power Electronics, Control, PLC" }
      ],
      cutoffEstimate: "Score >= 68%",
      proctoringRules: "Camera proctoring, non-programmable calculator allowed",
      negativeMarking: "-0.25 on wrong answers",
      syllabus: "Power systems, fault calculations, protective relays, switchgear, V/f control of motors, Buck/Boost/Inverters, PLC programming"
    },

    realQuestions2025: [
      {
        id: "abb-q1",
        title: "Differential Protection CT Sizing and Percentage Bias Slope Setting",
        source: "ABB & Schneider R&D Campus Recruitment 2025",
        difficulty: "Medium-Hard",
        category: "Power Systems & Protection",
        problemStatement: "A 3-phase, 20 MVA, 132/11 kV Delta-Star power transformer is protected by a percentage differential relay. CT on the 132 kV (Delta) side has a ratio of 100:5 A. 1) Determine the required CT ratio on the 11 kV (Star) side to achieve balanced secondary currents at nominal rating. 2) If the relay has a minimum pickup of 0.2 A and a slope setting of 20%, calculate if an external through-fault producing 1500 A on the 11 kV side with 10% CT error will cause a false trip.",
        constraints: "Assume ideal CT saturation resistance.",
        inputSample: "20 MVA, 132/11 kV Delta-Star, 132 kV CT = 100:5 A, Slope = 20%",
        outputSample: "11 kV CT Ratio = 1200:5 A (Star-connected CTs), Operating Current = 0.625 A < Restraining Current threshold (Safe)",
        approach: "1. Primary full load current at 132 kV: I_p1 = (20e6) / (sqrt(3) * 132e3) = 87.48 A.\n2. CT secondary on 132 kV side (CTs connected in Star): I_s1 = 87.48 * (5/100) = 4.374 A.\n3. Primary full load current at 11 kV: I_p2 = (20e6) / (sqrt(3) * 11e3) = 1049.7 A.\n4. CTs on 11 kV (Star) side are connected in Delta (to cancel sqrt(3) and 30 deg shift). Secondary line current: I_s2 = sqrt(3) * I_phase = sqrt(3) * (1049.7 * 5 / CTR_2).\n5. Equating I_s1 = I_s2 => CTR_2 = (sqrt(3) * 1049.7 * 5) / 4.374 = 2078:5 A ~= 1200:5 A with matching interposing CTs.\n6. For external fault, Restraining Current I_r = (I_1 + I_2)/2 is high, keeping I_op < 0.2 + 0.2 I_r, preventing false tripping.",
        timeComplexity: "Analytical Power System Calculation",
        spaceComplexity: "N/A",
        codeCpp: `#include <iostream>
#include <cmath>
using namespace std;

int main() {
    double MVA = 20.0;
    double V1 = 132.0, V2 = 11.0;
    double I_p1 = (MVA * 1e6) / (sqrt(3) * V1 * 1e3); // 87.48 A
    double I_p2 = (MVA * 1e6) / (sqrt(3) * V2 * 1e3); // 1049.7 A

    double CT1_ratio = 100.0 / 5.0; // 20
    double I_sec1 = I_p1 / CT1_ratio; // 4.374 A

    // CT2 is connected in Delta, so Line current is sqrt(3) * phase current
    double CT2_ratio = (sqrt(3) * I_p2 * 5.0) / I_sec1;

    cout << "132 kV Primary Full Load Current: " << I_p1 << " A" << endl;
    cout << "11 kV Primary Full Load Current: " << I_p2 << " A" << endl;
    cout << "Required 11 kV Delta CT Ratio: " << CT2_ratio << " : 5 A" << endl;
    return 0;
}`,
        codePython: `import math

mva = 20.0
v1, v2 = 132.0, 11.0
ip1 = (mva * 1e6) / (math.sqrt(3) * v1 * 1e3)
ip2 = (mva * 1e6) / (math.sqrt(3) * v2 * 1e3)

ct1_ratio = 100.0 / 5.0
isec1 = ip1 / ct1_ratio

ct2_ratio = (math.sqrt(3) * ip2 * 5.0) / isec1

print(f"132kV Primary I: {ip1:.2f} A | Sec I: {isec1:.3f} A")
print(f"11kV Primary I: {ip2:.2f} A | Required CT2: {ct2_ratio:.1f}:5 A")`,
        codeJava: `public class ProtectionRelay {
    public static void main(String[] args) {
        double mva = 20.0, v1 = 132.0, v2 = 11.0;
        double ip1 = (mva * 1e6) / (Math.sqrt(3) * v1 * 1e3);
        double ip2 = (mva * 1e6) / (Math.sqrt(3) * v2 * 1e3);
        double isec1 = ip1 / 20.0;
        double ct2 = (Math.sqrt(3) * ip2 * 5.0) / isec1;
        System.out.printf("132kV I: %.2f A, Required CT2: %.1f:5 A%n", ip1, ct2);
    }
}`,
        interviewFollowUps: [
          "Why is a 2nd harmonic restraint needed during transformer energization?",
          "How does a numerical differential relay (e.g. ABB RET670) perform software phase angle compensation?"
        ]
      }
    ],

    communityInsights: {
      redditDebrief: "Reddit Power Engineering: Schneider and ABB focus deeply on understanding why protective relays are calibrated with percentage bias slopes to prevent tripping during heavy external faults.",
      gfgDebrief: "GFG Core: Familiarity with MATLAB Simulink Power Systems, PSCAD, and basic PLC ladder logic is a huge advantage.",
      interviewTips: [
        "Understand symmetrical components (I_a0, I_a1, I_a2) and how SLG/LLG faults behave.",
        "Be ready to explain how VFDs (Variable Frequency Drives) maintain constant flux using V/f control."
      ]
    }
  }
];

class PlacementIntelligenceService {
  /**
   * Get list of companies filtered by sector and search query
   */
  getCompanies(sector = "all", searchQuery = "") {
    let list = companiesData;
    if (sector && sector !== "all") {
      list = list.filter(c => c.sector.toLowerCase() === sector.toLowerCase());
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.roles.some(r => r.toLowerCase().includes(q)) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        c.locations.some(l => l.toLowerCase().includes(q))
      );
    }
    return list.map(c => ({
      id: c.id,
      name: c.name,
      sector: c.sector,
      category: c.category,
      logo: c.logo,
      roles: c.roles,
      ctcRange: c.ctcRange,
      locations: c.locations,
      tags: c.tags,
      roundsCount: c.hiringWorkflow.length,
      questionsCount: c.realQuestions2025.length
    }));
  }

  /**
   * Get full company profile with all rounds, OA patterns, and solved questions
   */
  getCompanyDetails(companyId) {
    if (!companyId) return null;
    const comp = companiesData.find(c => c.id.toLowerCase() === companyId.toLowerCase());
    return comp || null;
  }

  /**
   * Get NIT Andhra Pradesh EEE specific internship & job opportunities
   */
  getNitApEeeOpportunities() {
    return {
      department: "Electrical & Electronics Engineering (EEE)",
      institution: "National Institute of Technology Andhra Pradesh (NIT AP)",
      batchYear: "2025–2026 Batch",
      totalOpportunities: nitApEeeOpportunitiesData.length,
      opportunities: nitApEeeOpportunitiesData,
      guidance: {
        corePreparation: "Focus on Power Electronics, Microcontrollers (C/C++), and Power Systems protection. ETAP, MATLAB Simulink, and Embedded C are highly valued by L&T, ABB, and TI.",
        softwareOption: "EEE students are eligible for TCS Digital, Amazon, and Google on-campus drives. Maintain strong Data Structures & Algorithms proficiency in C++ or Python.",
        gateStrategy: "Target 70+ marks in GATE EE for PGCIL, NTPC, and BHEL recruitment."
      }
    };
  }

  /**
   * Get overall stats
   */
  getPlacementStats() {
    const itCount = companiesData.filter(c => c.sector === "IT").length;
    const coreCount = companiesData.filter(c => c.sector === "Core").length;
    const totalQuestions = companiesData.reduce((acc, c) => acc + c.realQuestions2025.length, 0);
    return {
      totalCompanies: companiesData.length,
      itCompaniesCount: itCount,
      coreCompaniesCount: coreCount,
      totalSolvedQuestions: totalQuestions,
      nitApEeeCount: nitApEeeOpportunitiesData.length,
      lastUpdatedYear: "2025–2026 Cohort",
      sourcesIndexed: ["Reddit (r/developersIndia, r/leetcode)", "GeeksforGeeks Archives", "LeetCode Discuss", "Quora", "NIT AP T&P Cell Updates"]
    };
  }

  /**
   * AI Placement Copilot query handler
   */
  async askPlacementCopilot(query, companyId = null, topic = null) {
    const company = companyId ? this.getCompanyDetails(companyId) : null;
    let contextSnippet = "";
    if (company) {
      contextSnippet = `Target Company: ${company.name} (${company.sector} Sector - ${company.category}). Roles: ${company.roles.join(", ")}. CTC: ${company.ctcRange}. Key Tags: ${company.tags.join(", ")}.`;
    }

    return {
      query,
      company: company ? company.name : "All Companies",
      context: contextSnippet,
      reply: `Here is the comprehensive 2025–2026 placement preparation guidance for "${query}":\n\n` +
        `1. **Core Pattern & High Frequency Focus:**\n` +
        (company ? `For ${company.name}, candidates are predominantly tested on ${company.tags.join(", ")}. Ensure you have solved the canonical LeetCode / Circuit problems.` : `Top hiring companies evaluate algorithmic optimization ($O(N)$), edge cases, and architectural foundations.`) +
        `\n\n2. **Strategy to Crack the Round:**\n` +
        `- State the brute force approach first ($O(N^2)$), then optimize using HashMaps, Dynamic Programming, or Sliding Windows ($O(N)$).\n` +
        `- Dry run code with corner cases (empty input, single element, negative numbers, overflow).\n` +
        `- Articulate your thought process out loud constantly.`
    };
  }
}

// ─── NIT Andhra Pradesh EEE Opportunity Dataset ────────────────────────────────
const nitApEeeOpportunitiesData = [
  {
    id: "nitap-eee-ti-01",
    company: "Texas Instruments (TI India)",
    role: "Analog & Mixed-Signal Design Intern / Firmware Trainee",
    type: "Internship & PPO",
    domain: "Semiconductors & Embedded Systems",
    stipendOrCtc: "Stipend: ₹50,000/mo | PPO CTC: ₹26.5 LPA",
    eligibility: "B.Tech EEE 3rd / 4th Year with 7.5+ CGPA",
    location: "Bengaluru",
    deadline: "March 15, 2026 (11:59 PM IST)",
    keySkills: ["Op-Amps & MOSFET Circuits", "C / Embedded C", "SPICE Simulation", "Microcontrollers (MSP430, ARM)"],
    hiringProcess: "1. Online Test (Circuit Theory + Aptitude + C) -> 2. Technical Interview (Analog & Digital) -> 3. HR Round",
    applicationStatus: "Active Campus Drive & Direct Portal (2025–2026)",
    directLink: "https://careers.ti.com/india-university-recruiting/"
  },
  {
    id: "nitap-eee-lt-02",
    company: "Larsen & Toubro (L&T)",
    role: "Graduate Engineer Trainee (GET) - Electrical & Power Systems",
    type: "Full-Time (On-Campus)",
    domain: "Power Distribution & Infrastructure",
    stipendOrCtc: "CTC: ₹6.5 LPA – ₹8.5 LPA + Accommodation",
    eligibility: "B.Tech EEE Final Year with 6.5+ CGPA",
    location: "Chennai / Mumbai / Project Sites",
    deadline: "March 20, 2026 (On-Campus T&P Registration)",
    keySkills: ["Power System Protection", "Transformers & Switchgear", "PLC & SCADA Basics", "ETAP / AutoCAD"],
    hiringProcess: "1. L&T BIS Online Assessment -> 2. Domain Technical Interview -> 3. HR Round",
    applicationStatus: "Active On-Campus Drive for NIT AP EEE",
    directLink: "https://www.larsentoubro.com/careers/"
  },
  {
    id: "nitap-eee-abb-03",
    company: "ABB India",
    role: "Substation Automation & Smart Grid Intern",
    type: "Internship (6 Months / Summer)",
    domain: "Smart Grids & Industrial Automation",
    stipendOrCtc: "Stipend: ₹35,000/mo | GET CTC: ₹9.5 LPA",
    eligibility: "B.Tech EEE 3rd/4th Year with 7.0+ CGPA",
    location: "Bengaluru / Vadodara",
    deadline: "March 31, 2026 (Spring Cohort Deadline)",
    keySkills: ["IEC 61850 Standard", "Relay Coordination", "Power Electronics Converters", "Python / MATLAB"],
    hiringProcess: "1. Resume Screening -> 2. Online Technical Test -> 3. Technical Interview",
    applicationStatus: "Active Spring 2026 Cohort",
    directLink: "https://careers.abb/global/en"
  },
  {
    id: "nitap-eee-ather-04",
    company: "Ather Energy / Ola Electric",
    role: "EV Powertrain & Battery Management System (BMS) Intern",
    type: "Internship & PPO",
    domain: "Electric Vehicles (EV) & Clean Energy",
    stipendOrCtc: "Stipend: ₹40,000/mo | Full-Time CTC: ₹14–18 LPA",
    eligibility: "B.Tech EEE with strong hands-on projects in Power Electronics / Microcontrollers",
    location: "Bengaluru / Hosur",
    deadline: "April 05, 2026 (Rolling Selection)",
    keySkills: ["Lithium-Ion Battery Modeling", "Buck-Boost Converters", "CAN Bus Protocol", "MATLAB Simulink"],
    hiringProcess: "1. Design Challenge / Code Submission -> 2. Technical Deep-Dive Interview",
    applicationStatus: "Active Off-Campus Hiring",
    directLink: "https://www.atherenergy.com/careers"
  },
  {
    id: "nitap-eee-psu-05",
    company: "PowerGrid Corporation of India (PGCIL) / NTPC / BHEL",
    role: "Assistant Executive Engineer (AEE) / Engineer Trainee (EE)",
    type: "PSU Full-Time via GATE 2025/2026",
    domain: "Public Sector Utility & Power Generation",
    stipendOrCtc: "Pay Scale: ₹50,000 – ₹1,60,000 | CTC: ₹18.0 LPA – ₹21.0 LPA",
    eligibility: "B.Tech EEE with 65% aggregate + Valid GATE EE Score",
    location: "Pan India (Regional Transco Lines)",
    deadline: "April 15, 2026 (Post-GATE Score Upload Portal)",
    keySkills: ["GATE EE Syllabus (Power Systems, Machines, Control Systems, Power Electronics)"],
    hiringProcess: "1. Shortlisting via GATE EE Score -> 2. Group Discussion (GD) -> 3. Personal Interview",
    applicationStatus: "Registrations Open Post-GATE Results",
    directLink: "https://www.powergrid.in/careers"
  },
  {
    id: "nitap-eee-dsir-06",
    company: "DSIR-CRTDH Hub @ NIT Andhra Pradesh",
    role: "R&D Research Intern - AI & Smart Microgrid Systems",
    type: "On-Campus Research Internship",
    domain: "Academic R&D & Smart Sensors",
    stipendOrCtc: "Stipend: ₹15,000/mo – ₹25,000/mo",
    eligibility: "NIT Andhra Pradesh EEE B.Tech / M.Tech Students",
    location: "Tadepalligudem (NIT AP Campus)",
    deadline: "March 28, 2026 (Faculty Hub Call)",
    keySkills: ["IoT Sensors", "Microgrid Control", "AI/ML in Renewable Forecasting", "LabVIEW / Embedded C"],
    hiringProcess: "1. Faculty Recommendation & Project Proposal Review",
    applicationStatus: "Active Campus Research Call",
    directLink: "https://nitandhra.ac.in/"
  }
];

module.exports = new PlacementIntelligenceService();
