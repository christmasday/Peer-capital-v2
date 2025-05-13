"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users } from "lucide-react"
import Link from "next/link"

interface MutualConnection {
  userId: string
  firstName: string | null
  lastName: string | null
  email: string | null
  profilePictureUrl: string | null
}

interface MutualConnectionsProps {
  connections: MutualConnection[]
  count: number
  userId: string
}

export function MutualConnections({ connections, count, userId }: MutualConnectionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (count === 0) {
    return null
  }

  const getFullName = (connection: MutualConnection) => {
    return [connection.firstName, connection.lastName].filter(Boolean).join(" ") || "User"
  }

  const getInitials = (connection: MutualConnection) => {
    if (!connection.firstName && !connection.lastName) {
      return connection.email ? connection.email.substring(0, 2).toUpperCase() : "U"
    }

    return [connection.firstName, connection.lastName]
      .filter(Boolean)
      .map((name) => name?.[0])
      .join("")
      .toUpperCase()
  }

  const displayedConnections = isExpanded ? connections : connections.slice(0, 3)

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          {count} Mutual Connection{count !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedConnections.map((connection) => (
            <Link
              key={connection.userId}
              href={`/profile/${connection.userId}`}
              className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-md transition-colors"
            >
              <Avatar className="h-10 w-10">
                {connection.profilePictureUrl ? (
                  <AvatarImage src={connection.profilePictureUrl || "/placeholder.svg"} alt={getFullName(connection)} />
                ) : (
                  <AvatarFallback className="bg-blue-100 text-blue-500">{getInitials(connection)}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-medium">{getFullName(connection)}</p>
                <p className="text-sm text-muted-foreground">{connection.email}</p>
              </div>
            </Link>
          ))}

          {connections.length > 3 && (
            <Button
              variant="ghost"
              className="w-full text-blue-500 hover:text-blue-600 hover:bg-blue-50 mt-2"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show Less" : `View All ${count} Mutual Connections`}
            </Button>
          )}

          {connections.length === 0 && (
            <div className="text-center py-2 text-muted-foreground">No mutual connections found</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function MutualConnectionsSkeleton() {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
