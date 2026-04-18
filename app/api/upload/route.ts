import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import sharp from "sharp"

// Define image sizes and quality
const IMAGE_SIZES = {
  thumbnail: { width: 300, height: 300 },
  medium: { width: 800, height: 800 },
  full: { width: 1920, height: 1080 },
}

// Quality setting (1-100)
const COMPRESSION_QUALITY = 80

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const supabase = await createServerClient(cookieStore)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get the form data
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (10MB max for raw upload)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Generate a unique ID for this upload
    const fileId = uuidv4()

    // Determine output format based on input
    let outputFormat = "jpeg"
    if (file.type === "image/png") outputFormat = "png"
    if (file.type === "image/webp") outputFormat = "webp"
    if (file.type === "image/gif") outputFormat = "gif" // Keep GIFs as is

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Initialize Sharp with the buffer
    const sharpInstance = sharp(buffer)

    // Get image metadata
    const metadata = await sharpInstance.metadata()

    // Process and upload each size
    const urls = {}

    // For GIFs, we'll just upload the original to preserve animation
    if (outputFormat === "gif") {
      const filePath = `posts/${userId}/${fileId}.gif`

      const { error } = await supabase.storage.from("images").upload(filePath, buffer, {
        contentType: "image/gif",
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath)

      urls.full = publicUrl
      urls.medium = publicUrl
      urls.thumbnail = publicUrl
    } else {
      // Process each size for non-GIF images
      for (const [size, dimensions] of Object.entries(IMAGE_SIZES)) {
        // Skip processing if the original is smaller than this size
        if (
          metadata.width &&
          metadata.height &&
          metadata.width <= dimensions.width &&
          metadata.height <= dimensions.height &&
          size !== "thumbnail"
        ) {
          continue
        }

        // Resize and compress the image
        const processedImage = sharpInstance.clone().resize({
          width: dimensions.width,
          height: dimensions.height,
          fit: "inside",
          withoutEnlargement: true,
        })

        // Apply format-specific processing
        let outputBuffer
        if (outputFormat === "jpeg") {
          outputBuffer = await processedImage.jpeg({ quality: COMPRESSION_QUALITY, mozjpeg: true }).toBuffer()
        } else if (outputFormat === "png") {
          outputBuffer = await processedImage.png({ compressionLevel: 9, palette: true }).toBuffer()
        } else if (outputFormat === "webp") {
          outputBuffer = await processedImage.webp({ quality: COMPRESSION_QUALITY }).toBuffer()
        }

        // Generate file path
        const filePath = `posts/${userId}/${fileId}_${size}.${outputFormat}`

        // Upload to Supabase Storage
        const { error } = await supabase.storage.from("images").upload(filePath, outputBuffer, {
          contentType: `image/${outputFormat}`,
          cacheControl: "3600",
          upsert: false,
        })

        if (error) {
          return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
        }

        // Get the public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(filePath)

        urls[size] = publicUrl
      }

      // If we didn't process a size because the original was smaller,
      // use the next size up or the original
      if (!urls.medium && urls.full) {
        urls.medium = urls.full
      }
      if (!urls.thumbnail && urls.medium) {
        urls.thumbnail = urls.medium
      } else if (!urls.thumbnail && urls.full) {
        urls.thumbnail = urls.full
      }
    }

    // Return all URLs
    return NextResponse.json({
      url: urls.full || urls.medium || urls.thumbnail, // Main URL for backward compatibility
      urls: urls, // All size variants
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
