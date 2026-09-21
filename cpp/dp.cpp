// ============================================================
// DYNAMIC PROGRAMMING — 0/1 Knapsack + LCS  (C++17)
// Compile: g++ -std=c++17 dp.cpp -o dp
// Run:     ./dp            (run both demos)
//          ./dp -algo lcs
// ============================================================

#include <bits/stdc++.h>
using namespace std;

// ---- 0/1 Knapsack ----
int knapsack(int W, const vector<int>& wt, const vector<int>& val) {
    int n = wt.size();
    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            if (wt[i - 1] <= w)
                dp[i][w] = max(dp[i - 1][w],
                               val[i - 1] + dp[i - 1][w - wt[i - 1]]);
            else
                dp[i][w] = dp[i - 1][w];
        }
    }
    // Print DP table for verification
    cout << "0/1 Knapsack DP table:\n";
    cout << "    ";
    for (int w = 0; w <= W; w++) cout << setw(3) << w;
    cout << "\n";
    for (int i = 0; i <= n; i++) {
        cout << "i=" << i << " ";
        for (int w = 0; w <= W; w++) cout << setw(3) << dp[i][w];
        cout << "\n";
    }
    return dp[n][W];
}

// ---- Longest Common Subsequence ----
int lcs(const string& a, const string& b) {
    int m = a.size(), n = b.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            if (a[i - 1] == b[j - 1])
                dp[i][j] = dp[i - 1][j - 1] + 1;
            else
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);

    // Reconstruct the LCS string
    string out;
    int i = m, j = n;
    while (i > 0 && j > 0) {
        if (a[i - 1] == b[j - 1]) { out.push_back(a[i - 1]); i--; j--; }
        else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
        else j--;
    }
    reverse(out.begin(), out.end());

    cout << "LCS DP table:\n";
    cout << "      ε ";
    for (char c : b) cout << setw(3) << c;
    cout << "\n";
    cout << "    ε ";
    for (int j = 0; j <= n; j++) cout << setw(3) << dp[0][j];
    cout << "\n";
    for (int i = 1; i <= m; i++) {
        cout << "    " << a[i - 1] << " ";
        for (int j = 0; j <= n; j++) cout << setw(3) << dp[i][j];
        cout << "\n";
    }
    cout << "LCS = \"" << out << "\" (length " << dp[m][n] << ")\n";
    return dp[m][n];
}

int main(int argc, char** argv) {
    string algo = "all";
    for (int i = 1; i < argc; i++) {
        string a = argv[i];
        if (a == "-algo" && i + 1 < argc) algo = argv[++i];
    }

    if (algo == "knapsack" || algo == "all") {
        vector<int> wt = {2, 3, 4, 5};
        vector<int> val = {3, 4, 5, 6};
        int W = 5;
        cout << "=== 0/1 Knapsack ===\n";
        cout << "Items (wt,val): ";
        for (size_t i = 0; i < wt.size(); i++)
            cout << "(" << wt[i] << "," << val[i] << ") ";
        cout << "\nCapacity = " << W << "\n";
        cout << "Max value = " << knapsack(W, wt, val) << "\n\n";
    }
    if (algo == "lcs" || algo == "all") {
        string a = "ABCBDAB", b = "BDCABA";
        cout << "=== Longest Common Subsequence ===\n";
        cout << "a = \"" << a << "\", b = \"" << b << "\"\n";
        cout << "Length = " << lcs(a, b) << "\n";
    }
    return 0;
}