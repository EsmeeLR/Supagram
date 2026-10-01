"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getTimeAgo } from "./utils/time";
import { supabase } from "./lib/supabase";
import HeartIcon from "./components/HeartIcon";
import { Post } from "./tipe";



function PostCard({ post, onLike }: { post: Post; onLike: (id: number | string) => void }) {
  return (
    <article className="bg-card-bg border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Header con usuario y avatar */}
      <div className="flex items-center gap-3 p-4">
        <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary">
          <Image
            src={post.user?.avatar || 'https://i.pravatar.cc/150?img=9'}
            alt={post.user?.username || 'default user'}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{post.user?.username || 'default user'}</span>
          <span className="text-xs text-foreground/50">{getTimeAgo(new Date(post.created_at))}</span>
        </div>
      </div>

      {/* Imagen del post */}
      <div className="relative w-full aspect-square">
        <Image
          src={post.image_url}
          alt={`Post de ${post.user?.username || 'default user'}`}
          fill
          className="object-cover"
        />
      </div>

      {/* Acciones y caption */}
      <div className="p-4">
        {/* Botón de like con contador */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onLike(post.id)}
            className="hover:scale-110 transition-transform active:scale-95"
            aria-label={post.isLiked ? "Quitar like" : "Dar like"}
          >
            <HeartIcon filled={post.isLiked} />
          </button>
          <span className="font-semibold text-foreground">
            {post.likes.toLocaleString()} likes
          </span>
        </div>

        {/* Caption */}
        <p className="mt-2 text-foreground">
          <span className="font-semibold">{post.user?.username || 'default user'}</span>{" "}
          <span className="text-foreground/80">{post.caption}</span>
        </p>
      </div>
    </article>
  );
}

export default function Home() {

  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    async function getPosts() {
      const { data: posts } = await 
      supabase.from('posts')
      .select('*')
      .order('created_at', {
        ascending: false
      })
      //.gte('likes', 80)
      //.range(5, 9)

      if (posts) {
        setPosts(posts)
        console.log(posts)
      }
    }

    getPosts()
  }, [])

  //const [posts, setPosts] = useState<Post[]>(initialPosts);

  const handleLike = (postId: number | string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card-bg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Supagram
          </h1>
        </div>
      </header>

      {/* Feed de posts */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLike={handleLike} />
          ))}
        </div>
      </main>
    </div>
  );
}