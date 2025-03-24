import { Loading } from "@/components/auth/loading";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const GroupList = () => {
    const groups = useQuery(api.groups.listAll, {});
    const router = useRouter();

    const handleCreate = () => {
        router.push("/create");
    }

    if (groups === undefined) {
        return <Loading />;
    }

    if (groups.length === 0) {
        return <div className="h-full flex items-center justify-center">
            <Button onClick={handleCreate}>Create a group</Button>
        </div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
                <div key={group._id} className="rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="relative h-48">
                        <img
                            src={group.imageUrl || 'https://plus.unsplash.com/premium_photo-1729068649620-5c17361782d6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDN8RnpvM3p1T0hONnd8fGVufDB8fHx8fA%3D%3D'}
                            alt={group.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            Free
                        </div>
                    </div>
                    <div className="p-4">
                        <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
                        <p className="text-gray-600 mb-4">{group.description}</p>
                        <Button className="w-full" onClick={() => router.push(`/${group._id}`)}>
                            Join Group
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};