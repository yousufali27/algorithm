// ============================================================
// GRAPH ALGORITHMS — BFS, DFS, Dijkstra (C++17)
// Compile: g++ -std=c++17 graph.cpp -o graph
// Run:     ./graph -algo bfs -start 0
//          ./graph -algo dijkstra
// ============================================================

#include <bits/stdc++.h>
using namespace std;

// Sample weighted undirected graph (mirrors the JS visualizer)
const vector<vector<pair<int,int>>> adj = {
    {{2,1},{1,4},{3,2}},        // 0
    {{3,5},{2,3},{0,4}},        // 1
    {{0,1},{4,6},{1,3}},        // 2
    {{1,5},{4,1},{6,7},{0,2}},  // 3
    {{3,1},{5,2},{7,8},{2,6}},  // 4
    {{4,2},{7,4},{2,6}},        // 5
    {{3,7},{7,1}},              // 6
    {{4,8},{5,4},{6,1}}         // 7
};
const int N = 8;

void bfs(int start) {
    vector<bool> visited(N, false);
    queue<int> q;
    q.push(start); visited[start] = true;

    cout << "BFS from " << start << ": ";
    while (!q.empty()) {
        int u = q.front(); q.pop();
        cout << u << " ";
        for (auto [v, w] : adj[u])
            if (!visited[v]) { visited[v] = true; q.push(v); }
    }
    cout << "\n";
}

void dfs(int u, vector<bool>& visited) {
    visited[u] = true;
    cout << u << " ";
    for (auto [v, w] : adj[u])
        if (!visited[v]) dfs(v, visited);
}

void runDFS(int start) {
    vector<bool> visited(N, false);
    cout << "DFS from " << start << ": ";
    dfs(start, visited);
    cout << "\n";
}

void dijkstra(int src) {
    const int INF = INT_MAX;
    vector<int> dist(N, INF);
    dist[src] = 0;
    using P = pair<int,int>;       // (distance, node)
    priority_queue<P, vector<P>, greater<P>> pq;
    pq.push({0, src});

    cout << "Dijkstra from " << src << ":\n";
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    for (int i = 0; i < N; i++)
        cout << "  dist[" << i << "] = " << dist[i] << "\n";
}

int main(int argc, char** argv) {
    string algo = "bfs";
    int start = 0;
    for (int i = 1; i < argc; i++) {
        string a = argv[i];
        if (a == "-algo"   && i + 1 < argc) algo   = argv[++i];
        if (a == "-start"  && i + 1 < argc) start  = atoi(argv[++i]);
    }

    if      (algo == "bfs")      bfs(start);
    else if (algo == "dfs")      runDFS(start);
    else if (algo == "dijkstra") dijkstra(start);
    else cout << "Use -algo bfs|dfs|dijkstra\n";
    return 0;
}