// ============================================================
// TOWER OF HANOI  (C++17)
// Compile: g++ -std=c++17 hanoi.cpp -o hanoi
// Run:     ./hanoi -n 5
//          ./hanoi -n 10 -count   (only count, don't print moves)
// ============================================================

#include <bits/stdc++.h>
using namespace std;

long long moveCount = 0;
bool printMoves = true;

void moveDisk(char src, char tgt, int disk) {
    if (printMoves) cout << "Move disk " << disk << ": " << src << " -> " << tgt << "\n";
    moveCount++;
}

// Recursive solution: move n disks from src to tgt using aux as helper
void hanoi(int n, char src, char aux, char tgt) {
    if (n == 1) {
        moveDisk(src, tgt, 1);
        return;
    }
    hanoi(n - 1, src, tgt, aux);   // move n-1 to aux
    moveDisk(src, tgt, n);          // move largest to tgt
    hanoi(n - 1, aux, src, tgt);   // move n-1 from aux to tgt
}

int main(int argc, char** argv) {
    int n = 5;
    bool countOnly = false;
    for (int i = 1; i < argc; i++) {
        string a = argv[i];
        if (a == "-n" && i + 1 < argc) n = atoi(argv[++i]);
        else if (a == "-count") countOnly = true;
    }

    printMoves = !countOnly;
    moveCount = 0;

    auto t0 = chrono::steady_clock::now();
    hanoi(n, 'A', 'B', 'C');
    auto t1 = chrono::steady_clock::now();

    cout << "\nTotal moves for " << n << " disks: " << moveCount
         << "  (formula 2^n - 1 = " << (1LL << n) - 1 << ")\n";
    cout << "Time: "
         << chrono::duration_cast<chrono::microseconds>(t1 - t0).count()
         << " us\n";
    return 0;
}