"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { createProfileActivityNotification } from "./activity-notifications"
import { getBlockedUsers } from "@/lib/actions/connections"

// Function to get the current user ID
async function getCurrentUserId() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Try to get user from Supabase session
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session?.user) {
      return sessionData.session.user.id
    }

    // If session method fails, try JWT
    try {
      const { getJWTFromCookies, verifyJWT } = await import("@/lib/jwt")
      const jwt = getJWTFromCookies()
      if (jwt) {
        const { payload, error } = await verifyJWT(jwt)
        if (!error && payload && (payload.userId || payload.sub)) {
          return payload.userId || payload.sub
        }
      }
    } catch (jwtError) {
    }

    return null
  } catch (error) {
    return null
  }
}

// Create a new post
export async function createPost(formData: FormData) {
  try {
    const content = formData.get("content") as string
    const imageUrl = formData.get("imageUrl") as string | null
    const imageSizesJson = formData.get("imageSizes") as string | null

    let imageSizes = null
    if (imageSizesJson) {
      try {
        imageSizes = JSON.parse(imageSizesJson)
      } catch (e) {
      }
    }

    // Validate content or image
    if (!content?.trim() && !imageUrl) {
      return { error: "Post must have content or an image" }
    }

    // Get current user ID
    const userId = await getCurrentUserId()
    if (!userId) {
      return { error: "Authentication required" }
    }

    const adminClient = createAdminClient()

    // Ensure the posts table exists
    try {
      // Check if the table exists first
      const { count, error: countError } = await adminClient
        .from("information_schema.tables")
        .select("table_name", { count: "exact", head: true })
        .eq("table_schema", "public")
        .eq("table_name", "posts")

      if (countError) {
      }

      // If the table doesn't exist, create it
      if (!count || count === 0) {

        // Create the table using raw SQL
        const { error: createError } = await adminClient.from("_temp_create_posts").select("*").limit(1)

        if (createError && createError.message.includes("relation") && createError.message.includes("does not exist")) {
          // Table doesn't exist, create it
          const createTableQuery = `
            CREATE TABLE IF NOT EXISTS posts (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id UUID NOT NULL,
              content TEXT NOT NULL,
              image_url TEXT,
              image_sizes JSONB,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              likes_count INTEGER DEFAULT 0,
              comments_count INTEGER DEFAULT 0,
              shares_count INTEGER DEFAULT 0
            );
            
            -- Add a foreign key constraint to profiles if it doesn't exist
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'fk_posts_user_id'
              ) THEN
                ALTER TABLE posts 
                ADD CONSTRAINT fk_posts_user_id 
                FOREIGN KEY (user_id) 
                REFERENCES profiles(id) 
                ON DELETE CASCADE;
              END IF;
            END
            $$;
          `

          // Execute the create table query using pgSQL
          const { error: pgError } = await adminClient.rpc("pgSQL", { query: createTableQuery })

          if (pgError) {
            // Try alternative method if this fails
            // This is a fallback and might not work in all environments
          }
        }
      }
    } catch (tableError) {
      // Continue anyway, the table might already exist
    }

    // Insert the post
    const postId = uuidv4()
    const { error: insertError } = await adminClient.from("posts").insert({
      id: postId,
      user_id: userId,
      content: content?.trim() || "",
      image_url: imageUrl,
      image_sizes: imageSizes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
    })

    if (insertError) {
      return { error: insertError.message }
    }

    // Create activity notification for post creation
    try {
      await createProfileActivityNotification({
        userId,
        type: "post_created",
        details: "You created a new post",
        resourceId: postId,
        resourceType: "post",
      })
    } catch (notificationError) {
      // Non-blocking - continue even if notification fails
    }

    // Revalidate profile page to show the new post
    revalidatePath("/profile")
    revalidatePath(`/profile/${userId}`)

    return {
      success: true,
      postId,
      message: "Post created successfully",
    }
  } catch (error) {
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Get posts for a user
export async function getUserPosts(userId: string, limit = 10, offset = 0) {
  try {
    if (!userId) {
      return { error: "User ID is required", posts: [] }
    }

    const adminClient = createAdminClient()

    // Get blocked users for the current user
    const { blocked } = await getBlockedUsers();
    // If the user is blocked by the current user, return no posts
    if (blocked && blocked.includes(userId)) {
      return { posts: [] };
    }

    // Try to directly query the posts table
    try {
      const { data: posts, error } = await adminClient
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        // If the error is because the table doesn't exist, return an empty array
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          return { posts: [] }
        }

        return { error: error.message, posts: [] }
      }

      return { posts: posts || [] }
    } catch (error) {
      // Continue to fallback method
    }

    // Fallback: Try to get posts using a more basic approach
    try {
      // First check if the table exists
      const { count, error: countError } = await adminClient
        .from("information_schema.tables")
        .select("table_name", { count: "exact", head: true })
        .eq("table_schema", "public")
        .eq("table_name", "posts")

      if (countError) {
        return { error: "Error checking if posts table exists", posts: [] }
      }

      // If the table doesn't exist, return an empty array
      if (!count || count === 0) {
        return { posts: [] }
      }

      // If the table exists, try to query it again
      const { data: posts, error } = await adminClient
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        return { error: error.message, posts: [] }
      }

      return { posts: posts || [] }
    } catch (fallbackError) {
      return { error: "Error fetching posts", posts: [] }
    }
  } catch (error) {
    return { error: "An unexpected error occurred. Please try again.", posts: [] }
  }
}

// Delete a post
export async function deletePost(postId: string) {
  try {
    if (!postId) {
      return { error: "Post ID is required" }
    }

    // Get current user ID
    const userId = await getCurrentUserId()
    if (!userId) {
      return { error: "Authentication required" }
    }

    const adminClient = createAdminClient()

    // First, check if the post belongs to the user
    const { data: post, error: fetchError } = await adminClient
      .from("posts")
      .select("user_id, image_url, image_sizes")
      .eq("id", postId)
      .single()

    if (fetchError) {
      return { error: fetchError.message }
    }

    if (!post) {
      return { error: "Post not found" }
    }

    if (post.user_id !== userId) {
      return { error: "You don't have permission to delete this post" }
    }

    // Delete the post
    const { error: deleteError } = await adminClient.from("posts").delete().eq("id", postId)

    if (deleteError) {
      return { error: deleteError.message }
    }

    // If the post had an image, delete it from storage
    if (post.image_url) {
      try {
        const cookieStore = cookies()
        const supabase = createServerClient(cookieStore)

        // Extract the path from the URL
        const url = new URL(post.image_url)
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/images\/(.+)/)

        if (pathMatch && pathMatch[1]) {
          const path = pathMatch[1]
          const { error: storageError } = await supabase.storage.from("images").remove([path])

          if (storageError) {
            // Non-blocking - continue even if image deletion fails
          }
        }

        // Delete all size variants if they exist
        if (post.image_sizes) {
          const sizes = post.image_sizes as Record<string, string>
          const pathsToDelete: string[] = []

          for (const sizeUrl of Object.values(sizes)) {
            if (sizeUrl) {
              try {
                const sizeUrlObj = new URL(sizeUrl)
                const sizePathMatch = sizeUrlObj.pathname.match(/\/storage\/v1\/object\/public\/images\/(.+)/)

                if (sizePathMatch && sizePathMatch[1]) {
                  pathsToDelete.push(sizePathMatch[1])
                }
              } catch (e) {
              }
            }
          }

          if (pathsToDelete.length > 0) {
            const { error: bulkDeleteError } = await supabase.storage.from("images").remove(pathsToDelete)

            if (bulkDeleteError) {
            }
          }
        }
      } catch (storageError) {
        // Non-blocking - continue even if image deletion fails
      }
    }

    // Revalidate profile page
    revalidatePath("/profile")
    revalidatePath(`/profile/${userId}`)

    return {
      success: true,
      message: "Post deleted successfully",
    }
  } catch (error) {
    return { error: "An unexpected error occurred. Please try again." }
  }
}
