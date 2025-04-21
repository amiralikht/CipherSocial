"use client"

import { ChangeEvent, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarImage } from './ui/avatar';
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, Loader2Icon, SendIcon } from 'lucide-react';
import { Button } from './ui/button';
import { createPost } from '@/actions/post.action';
import toast from 'react-hot-toast';
import ImageUpload from './ImageUpload';


function CreatePost() {

    const {user} = useUser();
    const [content, setContent] = useState<string>("");
    const [image, setImage] = useState<string>("");
    const [isPosting, setIsPosting] = useState<boolean>(false);
    const [showImageUpload, setShowImageUpload] = useState<boolean>(false);

    const handleSubmit = async () => {
        if(!content.trim()) return;
        try {
            const result = await createPost(content, image);
            if(result?.success){
                console.log("Post created successfully");
                setContent("");
                setImage("");
                setShowImageUpload(false);
                toast.success("Post created successfully");
            }else{
                toast.error("Failed to create post");
            }
        } catch (error) {
            console.log("Error creating post", error);
        }finally {
            setIsPosting(false);
        }
    }
    return (
        <Card className='mb-6'>
            <CardContent className='pt-6'>
                <div className="space-y-4">
                    <div className='flex space-x-4'>
                        <Avatar className='h-10 w-10'>
                            <AvatarImage src={user?.imageUrl || "/avatar.png"}/>
                        </Avatar>
                        <Textarea placeholder="What's on your mind...?" className='min-h-[100px] resize-none border-none focus-visible:ring-0 text-base shadow-none !bg-transparent p-2' value={content} onChange={(e)=>setContent(e.target.value)} disabled={isPosting}/>
                    </div>
                </div>
                {(showImageUpload && !image) && (
                    <div className="border rounded-lg p-4">
                        <ImageUpload
                        endpoint="postImage"
                        value={image}
                        onChange={(url) => {
                            setImage(url);
                            if (!url) setShowImageUpload(false);
                        }}
                        />
                    </div>
                )}
                <div className="flex border-t pt-4 w-full">
                    <div className='flex space-x-2 w-full items-center justify-between'>
                        <Button type='button' variant={"ghost"} size="sm" className='text-muted-foreground hover:text-gray-800 gap-2' onClick={() => setShowImageUpload(!showImageUpload)} disabled={isPosting}>
                            <ImageIcon className='size-4' />
                            Photo
                        </Button>
                        <Button className='flex items-center bg-blue-500 hover:bg-blue-400 gap-2' size="sm" onClick={handleSubmit} disabled={(!content.trim() && !image) || isPosting} >
                            {isPosting ? (
                                <>
                                    <Loader2Icon className='animate-spin size-4'/>
                                    Posting...
                                </>
                            ):(
                                <>
                                    <SendIcon className='size-4'/>
                                    Post
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default CreatePost