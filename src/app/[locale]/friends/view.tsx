"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/edubek/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, MessageSquare, Check, X } from "lucide-react";

export function FriendsView() {
  const t = useTranslations("nav");
  const [search, setSearch] = React.useState("");
  const [friends, setFriends] = React.useState([
    { id: "1", username: "ali_bek", name: "Ali Bek", status: "accepted" },
    { id: "2", username: "malika", name: "Malika", status: "pending" },
  ]);
  const [requests, setRequests] = React.useState([
    { id: "3", username: "javohir", name: "Javohir", status: "incoming" },
  ]);

  const handleSearch = () => {
    // TODO: call /api/users/search?username=
    console.log("Search", search);
  };

  const acceptRequest = (id: string) => {
    setRequests((r) => r.filter((x) => x.id !== id));
    setFriends((f) => [...f, { id, username: "accepted", name: "New Friend", status: "accepted" }]);
  };

  return (
    <AppShell>
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
          <CardContent className="flex gap-2">
            <Input
              placeholder="Enter username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <UserPlus className="size-4 mr-1" /> Search
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Incoming requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests.length === 0 && <p className="text-xs text-muted-foreground">No requests</p>}
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarFallback>{r.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">@{r.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => acceptRequest(r.id)}>
                      <Check className="size-4 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7">
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
              {friends.map((f) => (
                <div key={f.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarFallback>{f.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">@{f.username}</p>
                    </div>
                  </div>
                  {f.status === "accepted" && (
                    <Button size="sm" variant="outline" className="gap-1">
                      <MessageSquare className="size-3.5" /> Chat
                    </Button>
                  )}
                  {f.status === "pending" && (
                    <span className="text-xs text-muted-foreground">Pending</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
