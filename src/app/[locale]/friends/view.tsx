"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, MessageSquare, Check, X } from "lucide-react";
import { api } from "@/lib/api-client";

export function FriendsView() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: () => api.get("/api/friends"),
  });

  const sendRequest = useMutation({
    mutationFn: (username: string) => api.post("/api/friends/request", { username }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friends"] }),
  });

  const respond = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api.post(`/api/friends/${id}/respond`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friends"] }),
  });

  const handleSearch = async () => {
    if (!search.trim()) return;
    const res = await api.get(`/api/users/search?username=${encodeURIComponent(search.trim())}`);
    setSearchResults(res.users || []);
  };

  const friends = data?.friends || [];
  const incoming = data?.incoming || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Friends</h1>
        <p className="text-sm text-muted-foreground">Search by username, send requests, chat when accepted.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="size-4" /> Find friends
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <UserPlus className="size-4 mr-1" /> Search
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2 pt-2">
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarFallback>{(u.name || u.username || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{u.name || u.username}</p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => sendRequest.mutate(u.username)} disabled={sendRequest.isPending}>
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Incoming requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}
            {incoming.length === 0 && !isLoading && <p className="text-xs text-muted-foreground">No requests</p>}
            {incoming.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarFallback>{(r.requester?.name || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{r.requester?.name || r.requester?.username}</p>
                    <p className="text-xs text-muted-foreground">@{r.requester?.username}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => respond.mutate({ id: r.id, action: "accept" })}>
                    <Check className="size-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => respond.mutate({ id: r.id, action: "decline" })}>
                    <X className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Your friends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {friends.length === 0 && !isLoading && <p className="text-xs text-muted-foreground">No friends yet</p>}
            {friends.map((f: any) => (
              <div key={f.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarFallback>{(f.name || f.username || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{f.name || f.username}</p>
                    <p className="text-xs text-muted-foreground">@{f.username}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1">
                  <MessageSquare className="size-3.5" /> Chat
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
