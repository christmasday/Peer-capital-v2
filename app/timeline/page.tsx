"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, MessageSquare, Repeat2, Trash2 } from "lucide-react"

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<any[]>([])
  const [timelineLoading, setTimelineLoading] = useState(true)
  const [postContent, setPostContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pendingLike, setPendingLike] = useState<string | null>(null)
  const [pendingRepost, setPendingRepost] = useState<string | null>(null)
  const [commentFor, setCommentFor] = useState<string | null>(null)
  const [commentText, setCommentText] = useState("")
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [deletingPost, setDeletingPost] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/timeline", { credentials: "include" })
        if (!res.ok) {
          setError(res.status === 401 ? "Please sign in to view your timeline." : "Failed to load timeline.")
          setTimeline([])
        } else {
          const data = await res.json()
          console.log("Timeline API response (first post):", data.posts?.[0])
          console.log("Current user ID from API:", data.currentUserId)
          setTimeline(data.posts || [])
          setCurrentUserId(data.currentUserId || null)
        }
      } catch (_) {
        setError("Failed to load timeline.")
      } finally {
        setTimelineLoading(false)
      }
    })()
  }, [])

  const submitPost = async () => {
    const content = postContent.trim()
    if (!content) return
    const formData = new FormData()
    formData.append("content", content)

    const res = await fetch("/api/posts", {
      method: "POST",
      body: formData,
      credentials: "include",
    })
    if (res.ok) {
      setPostContent("")
      const tl = await fetch("/api/timeline", { credentials: "include" })
      if (tl.ok) {
        const data = await tl.json()
        setTimeline(data.posts || [])
      }
    }
  }

  const toggleLike = async (postId: string) => {
    try {
      setPendingLike(postId)
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST", credentials: "include" })
      if (res.ok) {
        const tl = await fetch("/api/timeline", { credentials: "include" })
        if (tl.ok) {
          const data = await tl.json()
          console.log("After like - first post:", data.posts?.[0])
          setTimeline(data.posts || [])
        }
      }
    } finally {
      setPendingLike(null)
    }
  }

  const toggleRepost = async (postId: string) => {
    try {
      setPendingRepost(postId)
      const res = await fetch(`/api/posts/${postId}/repost`, { method: "POST", credentials: "include" })
      if (res.ok) {
        const tl = await fetch("/api/timeline", { credentials: "include" })
        if (tl.ok) {
          const data = await tl.json()
          setTimeline(data.posts || [])
        }
      }
    } finally {
      setPendingRepost(null)
    }
  }

  const loadComments = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}/comments/list`, { credentials: "include" })
    if (res.ok) {
      const data = await res.json()
      setCommentsMap(prev => ({ ...prev, [postId]: data.comments || [] }))
    }
  }

  const toggleComments = async (postId: string) => {
    if (commentFor === postId) {
      setCommentFor(null)
    } else {
      setCommentFor(postId)
      if (!commentsMap[postId]) {
        await loadComments(postId)
      }
    }
  }

  const submitComment = async (postId: string) => {
    const text = commentText.trim()
    if (!text) return
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
      credentials: "include",
    })
    if (res.ok) {
      setCommentText("")
      // Reload comments for this post
      await loadComments(postId)
      // Refresh timeline to update comment count
      const tl = await fetch("/api/timeline", { credentials: "include" })
      if (tl.ok) {
        const data = await tl.json()
        setTimeline(data.posts || [])
      }
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return
    
    try {
      setDeletingPost(postId)
      const res = await fetch(`/api/posts/${postId}/delete`, {
        method: "DELETE",
        credentials: "include",
      })
      
      if (res.ok) {
        // Remove post from timeline
        setTimeline(prev => prev.filter(p => p.id !== postId))
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete post")
      }
    } finally {
      setDeletingPost(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">what's up?</h1>

      {/* Create Post */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <textarea
          placeholder="What's on your mind?"
          className="w-full resize-none outline-none text-sm"
          rows={3}
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              await submitPost()
            }
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-500">Press Cmd/Ctrl + Enter to post</div>
          <Button size="sm" onClick={submitPost} disabled={!postContent.trim()}>
            Post
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        {timelineLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">Loading timeline...</div>
        ) : error ? (
          <div className="text-sm text-red-600 py-4">{error}</div>
        ) : timeline.length === 0 ? (
          <div className="text-sm text-gray-500">No posts from people you follow yet.</div>
        ) : (
          <div className="space-y-4">
            {timeline.map((p) => (
              <div key={p.id} className="border border-gray-100 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">{new Date(p.created_at).toLocaleString()}</div>
                {p.content && <div className="text-gray-900 whitespace-pre-wrap">{p.content}</div>}
                {p.image_url && (
                  <div className="mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image_url} alt="post" className="rounded-md max-h-96 w-full object-cover" />
                  </div>
                )}
                {/* Action icons with delete button at opposite end */}
                <div className="mt-3 text-xs flex justify-between items-center">
                  <div className="flex gap-6 items-center">
                    {/* Like: interactive, color by flag */}
                    <button
                      className={`flex items-center gap-1 ${p.hasLiked ? "text-[#DC2626]" : "text-gray-600"}`}
                      onClick={() => toggleLike(p.id)}
                      disabled={pendingLike === p.id}
                      aria-label="Like or Unlike"
                      style={{ cursor: 'pointer' }}
                    >
                      <Heart className="h-5 w-5" fill={p.hasLiked ? "#dc2626" : "none"} stroke={p.hasLiked ? "#b91c1c" : "#444"} />
                      <span style={{ color: p.hasLiked ? '#dc2626' : '#444', fontWeight: p.hasLiked ? 600 : 400 }}>{p.likes_count || 0}</span>
                    </button>
                    {/* Comment: interactive always, blue if commented */}
                    <button
                      className={`flex items-center gap-1 ${p.hasCommented ? "text-[#2563EB]" : "text-gray-600"}`}
                      onClick={() => toggleComments(p.id)}
                      aria-label="Comment"
                      style={{ cursor: 'pointer' }}
                    >
                      <MessageSquare className="h-5 w-5" fill={p.hasCommented ? "#2563eb" : "none"} stroke={p.hasCommented ? "#1d4ed8" : "#444"} />
                      <span style={{ color: p.hasCommented ? '#2563eb' : '#444', fontWeight: p.hasCommented ? 600 : 400 }}>{p.comments_count || 0}</span>
                    </button>
                    {/* Repost: interactive always, green if reposted */}
                    <button
                      className={`flex items-center gap-1 ${p.hasReposted ? "text-[#16A34A]" : "text-gray-600"}`}
                      onClick={() => toggleRepost(p.id)}
                      disabled={pendingRepost === p.id}
                      aria-label={p.hasReposted ? "Unrepost" : "Repost"}
                      style={{ cursor: 'pointer' }}
                    >
                      <Repeat2 className="h-5 w-5" fill={p.hasReposted ? "#16a34a" : "none"} stroke={p.hasReposted ? "#166534" : "#444"} />
                      <span style={{ color: p.hasReposted ? '#16a34a' : '#444', fontWeight: p.hasReposted ? 600 : 400 }}>{p.shares_count || 0}</span>
                    </button>
                  </div>
                  
                  {/* Delete button - only show for post owner */}
                  {(() => {
                    const shouldShow = currentUserId && p.user_id === currentUserId
                    console.log(`Delete button check for post ${p.id}:`, {
                      currentUserId,
                      postUserId: p.user_id,
                      shouldShow,
                      match: currentUserId === p.user_id
                    })
                    return shouldShow && (
                      <button
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                        onClick={() => deletePost(p.id)}
                        disabled={deletingPost === p.id}
                        aria-label="Delete post"
                        style={{ cursor: 'pointer' }}
                      >
                        <Trash2 className="h-5 w-5" />
                        {deletingPost === p.id && <span className="text-xs">Deleting...</span>}
                      </button>
                    )
                  })()}
                </div>
                {commentFor === p.id && (
                  <div className="mt-3 border-t pt-3">
                    {/* Existing Comments */}
                    {commentsMap[p.id] && commentsMap[p.id].length > 0 && (
                      <div className="mb-4 space-y-3">
                        {commentsMap[p.id].map((comment) => (
                          <div key={comment.id} className="flex gap-2 bg-gray-50 p-3 rounded-lg">
                            <div className="flex-shrink-0">
                              {comment.user_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={comment.user_image} alt={comment.user_name} className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-300" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-900">{comment.user_name}</div>
                              <div className="text-sm text-gray-700 mt-1">{comment.content}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(comment.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* New Comment Input */}
                    <div>
                      <textarea
                        className="w-full border rounded p-2 text-sm"
                        rows={2}
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault()
                            await submitComment(p.id)
                          }
                        }}
                      />
                      <div className="flex justify-end mt-2">
                        <Button size="sm" onClick={() => submitComment(p.id)} disabled={!commentText.trim()}>Comment</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


