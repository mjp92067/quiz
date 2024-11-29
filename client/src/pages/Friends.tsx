import { FriendSystem } from "@/components/FriendSystem";
import { Header } from "@/components/Header";

export function Friends() {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Friends</h2>
        <FriendSystem />
      </div>
    </>
  );
}
