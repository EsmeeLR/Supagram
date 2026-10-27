
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

import { supabase } from "../lib/supabase";
import { HeartIcon } from "../components/HeartIcon";
import Modal from "../components/Modals";
import { Post } from "../tipe";

export default function RankPage() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        // 1. Obtener publicaciones
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("id, image_url, caption, user_id, created_at");

        if (postsError) {
          console.error("ERROR POSTS:", postsError);
          throw postsError;
        }

        if (!postsData || postsData.length === 0) {
          setPosts([]);
          return;
        }

        console.log("Publicaciones encontradas:", postsData.length);

        // 2. Obtener IDs únicos de usuarios
        const userIds = [
          ...new Set(postsData.map((p) => p.user_id).filter(Boolean)),
        ];

        // 3. Obtener perfiles
        let profilesData: {
          id: string;
          username: string;
          avatar_url: string;
        }[] = [];

        if (userIds.length > 0) {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", userIds);

          if (error) {
            console.error("ERROR PROFILES:", error);
            throw error;
          }

          profilesData = data || [];
        }

        // 4. Crear mapa de perfiles
        const profilesMap = new Map(
          profilesData.map((p) => [
            p.id,
            {
              username: p.username,
              avatar_url: p.avatar_url,
            },
          ])
        );

        // 5. Obtener likes
        const postIds = postsData.map((p) => p.id);

        const { data: likesCountData, error: likesError } =
          await supabase
            .from("likes")
            .select("post_id")
            .in("post_id", postIds);

        if (likesError) {
          console.error("ERROR LIKES:", likesError);
          throw likesError;
        }

        // 6. Contar likes por publicación
        const likesCountMap = new Map<string | number, number>();

        likesCountData?.forEach((like) => {
          const count = likesCountMap.get(like.post_id) || 0;
          likesCountMap.set(like.post_id, count + 1);
        });

        // 7. Combinar información
        const postsWithData = postsData.map((post) => ({
          ...post,
          profile: profilesMap.get(post.user_id),
          likes_count: likesCountMap.get(post.id) || 0,
        }));

        // 8. Ordenar por cantidad de likes
        // Temporalmente mostramos TODAS las publicaciones
        const sortedPosts = postsWithData.sort(
          (a, b) => b.likes_count - a.likes_count
        );

        console.log("Ranking generado:", sortedPosts);

        setPosts(sortedPosts as Post[]);

      } catch (error) {
        console.error("ERROR GENERAL DEL RANKING:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el ranking."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-card-bg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Ranking
          </h1>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-2xl mx-auto p-2">

        {loading && (
          <p className="text-center py-10 text-muted-foreground">
            Cargando ranking...
          </p>
        )}

        {!loading && errorMessage && (
          <p className="text-center py-10 text-red-500">
            Error: {errorMessage}
          </p>
        )}

        {!loading && !errorMessage && posts.length === 0 && (
          <p className="text-center py-10 text-muted-foreground">
            Todavía no hay publicaciones para mostrar.
          </p>
        )}

        {!loading && !errorMessage && posts.length > 0 && (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="relative aspect-square overflow-hidden group"
              >
                <Image
                  src={post.image_url}
                  alt={`Post con ${post.likes_count} likes`}
                  fill
                  sizes="(max-width: 768px) 33vw, 220px"
                  className="object-cover transition-transform group-hover:scale-105"
                />

                {/* Overlay de likes */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <HeartIcon size="sm" />
                  <span className="text-white font-semibold">
                    {post.likes_count.toLocaleString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

      </main>

      {/* Modal */}
      {selectedPost && (
        <Modal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}

    </div>
  );
}
