// ============================================================
// N-QUEENS PROBLEM — C++17 Reference Implementation
// Compile: g++ -std=c++17 nqueens.cpp -o nqueens
// Run:     ./nqueens -n 8          (count solutions)
//          ./nqueens -n 4 -show    (print all boards)
//          ./nqueens -n 8 -first   (stop after first solution)
// ============================================================

#include <bits/stdc++.h>
using namespace std;

int N;
vector<int> col, diag1, diag2;
long long solutions = 0;
bool stopEarly = false;
bool printBoards = false;

// Check whether placing a queen at (r, c) is safe.
// col[c]  : column c already has a queen
// diag1[] : "\" diagonals, indexed by (r - c + N)
// diag2[] : "/" diagonals, indexed by (r + c)
bool isSafe(int r, int c) {
    return !col[c] && !diag1[r - c + N] && !diag2[r + c];
}

// Print a single solution as a board with ♛ unicode characters.
void printBoard(vector<int>& board) {
    for (int r = 0; r < N; r++) {
        for (int c = 0; c < N; c++) {
            if (board[r] == c) cout << " \u265B ";       // ♛
            else               cout << " . ";
        }
        cout << "\n";
    }
    cout << string(N * 3 + 4, '-') << "\n\n";
}

// Recursive backtracking solver. Tries every column in row r.
void solve(int r, vector<int>& board) {
    if (r == N) {
        solutions++;
        if (printBoards) printBoard(board);
        // After printing the first solution with -first, raise the flag
        // so the recursion unwinds without exploring more branches.
        // (The flag is checked at the END of the for loop below.)
        return;
    }
    for (int c = 0; c < N; c++) {
        if (isSafe(r, c)) {
            col[c] = diag1[r - c + N] = diag2[r + c] = 1;
            board[r] = c;
            solve(r + 1, board);
            col[c] = diag1[r - c + N] = diag2[r + c] = 0;
            // Only stop after we KNOW a solution was found.
            // (solutions > 0 means at least one full assignment was made.)
            if (stopEarly && solutions > 0) return;
        }
    }
}

int main(int argc, char** argv) {
    N = 8;
    printBoards = false;
    stopEarly = false;

    for (int i = 1; i < argc; i++) {
        string a = argv[i];
        if (a == "-n" && i + 1 < argc) N = atoi(argv[++i]);
        else if (a == "-show")   printBoards = true;
        else if (a == "-first")  stopEarly = true;
        else if (a == "-h" || a == "--help") {
            cout << "Usage: nqueens [-n SIZE] [-show] [-first]\n";
            return 0;
        }
    }

    col.assign(N, 0);
    diag1.assign(2 * N, 0);
    diag2.assign(2 * N, 0);
    vector<int> board(N, -1);

    auto t0 = chrono::steady_clock::now();
    solve(0, board);
    auto t2 = chrono::steady_clock::now();

    cout << "Solutions for N=" << N << ": " << solutions << "\n";
    cout << "Time: "
         << chrono::duration_cast<chrono::milliseconds>(t2 - t0).count()
         << " ms\n";
    return 0;
}