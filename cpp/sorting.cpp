// ============================================================
// SORTING ALGORITHMS — Bubble / Quick / Merge  (C++17)
// Compile: g++ -std=c++17 sorting.cpp -o sorting
// Run:     ./sorting                (run all three on same array)
//          ./sorting -n 50          (array size 50)
//          ./sorting -algo merge
// ============================================================

#include <bits/stdc++.h>
using namespace std;

// ----- Bubble Sort: O(n^2) time, O(1) space -----
void bubbleSort(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (a[j] > a[j + 1])
                swap(a[j], a[j + 1]);
}

// ----- Quick Sort: O(n log n) average, O(log n) stack space -----
int partition(vector<int>& a, int lo, int hi) {
    int pivot = a[hi];
    int i = lo - 1;
    for (int j = lo; j < hi; j++)
        if (a[j] < pivot)
            swap(a[++i], a[j]);
    swap(a[i + 1], a[hi]);
    return i + 1;
}

void quickSort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int p = partition(a, lo, hi);
    quickSort(a, lo, p - 1);
    quickSort(a, p + 1, hi);
}

// ----- Merge Sort: O(n log n) time, O(n) space -----
void merge(vector<int>& a, int l, int m, int r) {
    vector<int> tmp(r - l + 1);
    int i = l, k = 0, j = m + 1;
    while (i <= m && j <= r)
        tmp[k++] = (a[i] < a[j]) ? a[i++] : a[j++];
    while (i <= m) tmp[k++] = a[i++];
    while (j <= r) tmp[k++] = a[j++];
    for (int t = 0; t < (int)tmp.size(); t++) a[l + t] = tmp[t];
}

void mergeSort(vector<int>& a, int l, int r) {
    if (l >= r) return;
    int m = (l + r) / 2;
    mergeSort(a, l, m);
    mergeSort(a, m + 1, r);
    merge(a, l, m, r);
}

// Forward declarations so they can be used as function pointers in main()
void quickSortWrap(vector<int>& a);
void mergeSortWrap(vector<int>& a);

// ----- Utility -----
vector<int> randomArray(int n) {
    vector<int> v(n);
    random_device rd;
    mt19937 gen(rd());
    uniform_int_distribution<int> dist(1, 999);
    for (auto& x : v) x = dist(gen);
    return v;
}

bool isSorted(const vector<int>& a) {
    for (size_t i = 1; i < a.size(); i++)
        if (a[i] < a[i - 1]) return false;
    return true;
}

int main(int argc, char** argv) {
    int N = 30;
    string algo = "all";

    for (int i = 1; i < argc; i++) {
        string a = argv[i];
        if (a == "-n" && i + 1 < argc) N = atoi(argv[++i]);
        else if (a == "-algo" && i + 1 < argc) algo = argv[++i];
    }

    auto arr = randomArray(N);
    cout << "Input  (" << N << "): ";
    if (N <= 30) for (int x : arr) cout << x << " ";
    cout << "\n";

    auto run = [&](const string& lbl, void (*fn)(vector<int>&)) {
        auto a = arr;
        auto t0 = chrono::steady_clock::now();
        fn(a);
        auto t1 = chrono::steady_clock::now();
        cout << lbl << " -> " << (isSorted(a) ? "OK" : "FAIL")
             << "  (" << chrono::duration_cast<chrono::microseconds>(t1 - t0).count()
             << " us)\n";
    };

    if (algo == "bubble" || algo == "all") run("Bubble Sort", bubbleSort);
    if (algo == "quick"  || algo == "all") run("Quick Sort ", quickSortWrap);
    if (algo == "merge"  || algo == "all") run("Merge Sort ", mergeSortWrap);

    cout << "\nFinal   (" << N << "): ";
    if (N <= 30) for (int x : arr) cout << x << " ";
    cout << "\n";
    return 0;
}

// Wrapper shims so we can pass quicksort/mergesort as function pointers
void quickSortWrap(vector<int>& a) { quickSort(a, 0, (int)a.size() - 1); }
void mergeSortWrap(vector<int>& a) { mergeSort(a, 0, (int)a.size() - 1); }