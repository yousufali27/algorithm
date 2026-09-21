// ============================================================================
//  M-Coloring Graph Problem  --  Backtracking with Console Visualization
// ============================================================================
//
//  Problem: Given an undirected graph with N vertices and M colors, assign one
//  of the M colors to each vertex such that no two adjacent vertices share
//  the same color. Find ALL valid colorings using backtracking, and visualize
//  the algorithm step-by-step in the terminal using ASCII art and ANSI colors.
//
//  Build:   g++ -std=c++17 -O2 m_coloring.cpp -o m_coloring
//           (Windows MSVC: cl /EHsc /std:c++17 m_coloring.cpp)
//
//  Run:     ./m_coloring        (or m_coloring.exe)
//
//  No external dependencies; pure C++ standard library.
// ============================================================================

#include <iostream>
#include <vector>
#include <string>
#include <set>
#include <utility>
#include <algorithm>
#include <thread>
#include <chrono>

#ifdef _WIN32
  #include <windows.h>
#endif

using namespace std;

// ----------------------------------------------------------------------------
//  Global state for the currently loaded graph
// ----------------------------------------------------------------------------
static int           N            = 0;     // number of vertices (1..N)
static int           M            = 0;     // number of available colors
static vector<vector<int>> adj;           // adjacency list (1-indexed)
static vector<int>   color;               // current color per vertex (0 = none)
static vector<pair<int,int>> edgeList;    // all edges for visualization
static set<int>      colorsUsed;          // distinct colors currently assigned

static int           solutionsFound = 0;  // count of valid colorings found
static bool          animateMode    = true; // pause/redraw between steps?
static int           stepDelayMs    = 200; // delay between animations (ms)

// ----------------------------------------------------------------------------
//  ANSI helpers
// ----------------------------------------------------------------------------
static const string RESET = "\x1b[0m";

// Map a color index 0..M-1 to a foreground ANSI code. Color 0 = "no color"
// (displayed in dim gray). We cycle through 7 bright colors + bright black.
static string ansiColor(int c) {
    if (c == 0) return "\x1b[90m";                       // uncolored -> bright black
    const char* codes[] = {
        "\x1b[31m", // 1 RED
        "\x1b[32m", // 2 GREEN
        "\x1b[33m", // 3 YELLOW
        "\x1b[34m", // 4 BLUE
        "\x1b[35m", // 5 MAGENTA
        "\x1b[36m", // 6 CYAN
        "\x1b[97m"  // 7 WHITE
    };
    return codes[(c - 1) % 7];
}

static string colorName(int c) {
    if (c == 0) return "NONE";
    const char* names[] = {"", "RED", "GREEN", "YELLOW",
                           "BLUE", "MAGENTA", "CYAN", "WHITE"};
    return names[(c - 1) % 7 + 1];
}

// Enable ANSI / VT processing on Windows 10+ so colors actually render.
static void enableAnsiIfNeeded() {
#ifdef _WIN32
    HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
    if (hOut == INVALID_HANDLE_VALUE) return;
    DWORD dwMode = 0;
    if (!GetConsoleMode(hOut, &dwMode)) return;
    dwMode |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
    SetConsoleMode(hOut, dwMode);
#endif
}

static void clearScreen() {
#ifdef _WIN32
    system("cls");
#else
    system("clear");
#endif
}

// ----------------------------------------------------------------------------
//  Graph helpers
// ----------------------------------------------------------------------------
static void resetGraph(int n) {
    N = n; M = 0;
    adj.assign(N + 1, {});
    color.assign(N + 1, 0);
    edgeList.clear();
    colorsUsed.clear();
    solutionsFound = 0;
}

static void addEdge(int u, int v) {
    if (u < 1 || v < 1 || u > N || v > N || u == v) {
        cout << "  [warning] ignored invalid edge (" << u << "," << v << ")\n";
        return;
    }
    adj[u].push_back(v);
    adj[v].push_back(u);
    edgeList.emplace_back(min(u,v), max(u,v));
}

// True if assigning color c to vertex v violates no constraints.
static bool isSafe(int v, int c) {
    for (int nb : adj[v]) {
        if (color[nb] == c) return false;
    }
    return true;
}

// ----------------------------------------------------------------------------
//  Visualization
// ----------------------------------------------------------------------------
static void visualize(const string& stage) {
    if (!animateMode) return;
    clearScreen();

    cout << "=========================================================\n";
    cout << "               M-Coloring Graph (Backtracking)           \n";
    cout << "=========================================================\n";
    cout << "Stage: " << stage << "\n";
    cout << "Vertices N = " << N << " | Available colors M = " << M << "\n";

    // Colors used so far
    cout << "Colors used so far: {";
    bool first = true;
    for (int c : colorsUsed) {
        if (!first) cout << ", ";
        cout << ansiColor(c) << c << " (" << colorName(c) << ")" << RESET;
        first = false;
    }
    if (colorsUsed.empty()) cout << "none";
    cout << "}\n\n";

    // Vertex row
    cout << "Vertices (with current color):\n  ";
    for (int i = 1; i <= N; ++i) {
        cout << "V" << i << "[";
        cout << ansiColor(color[i]) << color[i] << RESET << "]  ";
        if (i % 8 == 0) cout << "\n  ";
    }
    cout << "\n  (0 = uncolored)\n\n";

    // Adjacency matrix
    cout << "Adjacency matrix:\n    ";
    for (int j = 1; j <= N; ++j) cout << j << " ";
    cout << "\n  ";
    for (int i = 1; i <= N; ++i) {
        cout << i << " ";
        for (int j = 1; j <= N; ++j) {
            int v = (i == j) ? 0 : (find(adj[i].begin(), adj[i].end(), j) != adj[i].end());
            cout << v << " ";
        }
        cout << "\n  ";
    }
    cout << "\n";

    // Edges with status
    cout << "Edges (color1 vs color2 : status):\n";
    for (auto& e : edgeList) {
        int u = e.first, v = e.second;
        int cu = color[u], cv = color[v];
        string tag;
        if (cu == 0 || cv == 0)      tag = "pending";
        else if (cu == cv)           tag = "CONFLICT";
        else                          tag = "OK";

        cout << "  " << u << " - " << v << " : V" << u << "="
             << ansiColor(cu) << cu << " (" << colorName(cu) << ")" << RESET
             << "  vs  V" << v << "="
             << ansiColor(cv) << cv << " (" << colorName(cv) << ")" << RESET
             << "   -> " << tag << "\n";
    }

    cout << "\n---------------------------------------------------------\n";
    cout.flush();
    this_thread::sleep_for(chrono::milliseconds(stepDelayMs));
}

// ----------------------------------------------------------------------------
//  Core backtracking  --  finds ALL valid M-colorings
// ----------------------------------------------------------------------------
static void mColoring(int v) {
    // All vertices assigned -> found a valid coloring
    if (v > N) {
        ++solutionsFound;
        cout << ansiColor(7)   // WHITE for emphasis
             << "\n*** Valid coloring #" << solutionsFound << " found: ";
        for (int i = 1; i <= N; ++i) {
            cout << "V" << i << "=" << ansiColor(color[i]) << color[i] << RESET << " ";
        }
        cout << "***\n" << RESET;
        cout.flush();
        this_thread::sleep_for(chrono::milliseconds(stepDelayMs * 4));
        return;
    }

    // Try each color for vertex v
    for (int c = 1; c <= M; ++c) {
        if (isSafe(v, c)) {
            color[v] = c;
            colorsUsed.insert(c);

            string stage = "Assigned color " + to_string(c) + " to vertex " + to_string(v);
            visualize(stage);

            mColoring(v + 1);

            // backtrack
            color[v] = 0;
            colorsUsed.erase(c);
            // (re-add others that might still be assigned elsewhere)
            for (int i = 1; i <= N; ++i) {
                if (color[i] != 0) colorsUsed.insert(color[i]);
            }

            string stage2 = "Backtracking from vertex " + to_string(v);
            visualize(stage2);
        }
    }
}

// ----------------------------------------------------------------------------
//  Example loaders
// ----------------------------------------------------------------------------
static void runDefaultExample() {
    // Classic 5-vertex demo graph. 4-colorable.
    resetGraph(5);
    M = 4;
    addEdge(1, 2);
    addEdge(1, 3);
    addEdge(2, 4);
    addEdge(3, 4);
    addEdge(3, 5);
    addEdge(4, 5);

    animateMode = true;
    stepDelayMs = 250;

    cout << "Loaded default example: N=5, M=4\n";
    cout << "Edges: ";
    for (auto& e : edgeList) cout << "(" << e.first << "," << e.second << ") ";
    cout << "\n\nPress Enter to start the animated backtracking...";
    cin.get();
}

static void runCustomInput() {
    int n;
    cout << "Enter number of vertices N: ";
    cin >> n;
    if (n <= 0) { cout << "Invalid N.\n"; return; }
    resetGraph(n);

    cout << "Enter number of colors M: ";
    cin >> M;
    if (M <= 0) { cout << "Invalid M.\n"; return; }

    cout << "Enter edges as pairs (u v), 1-indexed. Terminate with '0 0'.\n";
    while (true) {
        int u, v;
        cout << "  edge: ";
        cin >> u >> v;
        if (u == 0 && v == 0) break;
        addEdge(u, v);
    }

    animateMode = true;
    stepDelayMs = 250;
}

// ----------------------------------------------------------------------------
//  Main
// ----------------------------------------------------------------------------
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    enableAnsiIfNeeded();

    cout << "=========================================================\n";
    cout << "           M-Coloring Graph  --  Backtracking            \n";
    cout << "=========================================================\n\n";

    int choice = 0;
    cout << "Choose an option:\n";
    cout << "  1) Run default example (N=5, M=4)\n";
    cout << "  2) Enter your own graph\n";
    cout << "Enter choice: ";
    cin >> choice;

    if (choice == 1) {
        runDefaultExample();
    } else if (choice == 2) {
        runCustomInput();
    } else {
        cout << "Invalid choice.\n";
        return 1;
    }

    if (N <= 0 || M <= 0) {
        cout << "Graph not loaded properly. Exiting.\n";
        return 1;
    }

    visualize("Initial state  --  starting backtracking at vertex 1");
    mColoring(1);

    // Final summary
    clearScreen();
    cout << "=========================================================\n";
    cout << "                      FINAL SUMMARY                      \n";
    cout << "=========================================================\n";
    cout << "Vertices: " << N << "   Colors available: " << M << "\n";
    cout << "Valid M-colorings found: " << solutionsFound << "\n\n";

    if (solutionsFound == 0) {
        cout << "No valid coloring exists for this graph with M = " << M << " colors.\n";
        cout << "(The graph is NOT M-colorable.)\n";
    } else if (solutionsFound == 1) {
        cout << "Exactly 1 valid coloring exists.\n";
    } else {
        cout << "Multiple valid colorings exist. Animation above showed the search.\n";
    }

    cout << "\nPress Enter to exit...";
    cin.ignore();
    cin.get();
    return 0;
}
