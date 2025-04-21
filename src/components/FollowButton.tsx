"use client"

import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { toggleFollow } from "@/actions/user.action";


function FollowButton({userId}: {userId: string}) {
    const [isLoading, setIsLoading] = useState(false);

    const handleFollow = async () => {
        setIsLoading(true);
        try {
            const result = await toggleFollow(userId);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.log("Error following user: ", error);
        }finally{
            setIsLoading(false);
        }
    }
  return (
    <Button
        variant="outline"
        size={"sm"}
        className="px-2 text-xs border-primary text-primary hover:bg-primary hover:text-white shadow-sm hover:shadow-blue-600/50"
        onClick={handleFollow}
        disabled={isLoading}
    >
        {isLoading ? <Loader2Icon className="size-4 animate-spin"/> : "Follow"}

    </Button>
  )
}

export default FollowButton