export interface Post {
  id: string
  user_id: string
  content: string
  created_at: string
  image_url?: string
  likes_count?: number
  comments_count?: number
  shares_count?: number
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  user_name: string
  user_image?: string
  content: string
  created_at: string
  likes_count?: number
}
