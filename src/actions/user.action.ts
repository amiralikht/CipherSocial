"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";


export const syncUser = async () => {
    try {
        const {userId} = await auth();
        const user = await currentUser();
        if (!user || !userId) return;
        // Check if user already exists in the database
        const existingUser = await prisma.user.findUnique({
            where: {
                clerkId: userId,
            },
        })

        if (existingUser) {
            // User already exists, no need to create a new one
            return existingUser;
        }
        // Create a new user in the database
        const dbUser = await prisma.user.create({
            data:{
                clerkId: userId,
                name: `${user.firstName || ""} ${user.lastName || ""}`,
                username: user.username ?? user.emailAddresses[0]?.emailAddress.split("@")[0],
                email: user.emailAddresses[0]?.emailAddress,
                image: user.imageUrl,
            }
        })
        return dbUser;
    } catch (error) {
        console.log("Error syncing user: ", error);
    }
}

export const getUserByClerkId = async (clerkId: string) => {
    return prisma.user.findUnique({
        where: {
            clerkId,
        },
        include: {
            _count:{
                select: {
                    followers: true,
                    following: true,
                    posts: true,
                }
            }
        }
    })

}

export const getDBUserId = async () => {
    const {userId:clerkId} = await auth();
    if (!clerkId) return null;
    const user = await getUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");
    return user.id;
}

export const getRandomUsers = async () => {
    try {
        const userId = await getDBUserId();
    
        if (!userId) return [];
    
        // get 3 random users exclude ourselves & users that we already follow
        const randomUsers = await prisma.user.findMany({
          where: {
            AND: [
              { NOT: { id: userId } },
              {
                NOT: {
                  followers: {
                    some: {
                      followerId: userId,
                    },
                  },
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            _count: {
              select: {
                followers: true,
              },
            },
          },
          take: 3,
        });
        return randomUsers;
    } catch (error) {
        console.log("Error getting random user: ", error);
        return [];
    }
}

export const toggleFollow = async (targetUserId:string) => {
    try {
        const userId = await getDBUserId();

        if (!userId) return ;
        if (userId === targetUserId) {
            return {
                success: false,
                message: "You cannot follow yourself",
            }
        }
        const existingFollow = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: targetUserId,
                }
            }
        })
        if (existingFollow) {
            await prisma.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: targetUserId,
                    }
                }
            })
        }else{
            await prisma.$transaction([
                prisma.follows.create({
                    data: {
                        followerId: userId,
                        followingId: targetUserId,
                    }
                }),
                prisma.notification.create({
                    data: {
                        userId: targetUserId, //User being followed
                        creatorId: userId, // User following
                        type: "FOLLOW",
                    }
                })
            ])
        }
        revalidatePath(`/`);
        return {
            success: true,
            message: existingFollow ? "User unfollowed successfully" : "User followed successfully",
        }
    } catch (error) {
        console.log("Error toggling follow: ", error);
        return {
            success: false,
            message: "Something went wrong",
        }
        
    }
}