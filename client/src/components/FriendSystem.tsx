import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Friend {
  id: number;
  userId: number;
  friendId: number;
  status: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function FriendSystem() {
  const [friendEmail, setFriendEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch friends list
  const { data: friends } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const response = await fetch("/api/friends", {
        credentials: "include"
      });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/auth";
          throw new Error("Please login to view friends");
        }
        throw new Error("Failed to fetch friends");
      }
      return response.json();
    }
  });

  // Fetch friend requests
  const { data: friendRequests } = useQuery({
    queryKey: ["friend-requests"],
    queryFn: async () => {
      const response = await fetch("/api/friends/requests", {
        credentials: "include"
      });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/auth";
          throw new Error("Please login to view friend requests");
        }
        throw new Error("Failed to fetch friend requests");
      }
      return response.json();
    }
  });

  // Send friend request
  const sendRequest = useMutation({
    mutationFn: async (friendEmail: string) => {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendEmail }),
        credentials: "include"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send friend request");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request sent successfully!"
      });
      setFriendEmail("");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Respond to friend request
  const respondToRequest = useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: number; accept: boolean }) => {
      const response = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, accept }),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to respond to friend request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      toast({
        title: "Success",
        description: "Friend request response sent!"
      });
    }
  });

  return (
    <Card className="p-6">
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="requests">Friend Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter friend's email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
            />
            <Button 
              onClick={() => {
                if (friendEmail) sendRequest.mutate(friendEmail);
              }}
              disabled={sendRequest.isPending || !friendEmail}
            >
              Add Friend
            </Button>
          </div>

          <div className="space-y-2">
            {friends?.map((friend: Friend) => (
              <div key={friend.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  {friend.user.firstName} {friend.user.lastName}
                  <div className="text-sm text-muted-foreground">{friend.user.email}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-2">
          {friendRequests?.map((request: Friend) => (
            <div key={request.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                {request.user.firstName} {request.user.lastName}
                <div className="text-sm text-muted-foreground">{request.user.email}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => respondToRequest.mutate({ requestId: request.id, accept: true })}
                  disabled={respondToRequest.isPending}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => respondToRequest.mutate({ requestId: request.id, accept: false })}
                  disabled={respondToRequest.isPending}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
