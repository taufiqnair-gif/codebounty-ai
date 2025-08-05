import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4">
      <div className="w-full max-w-4xl space-y-6">
        <Skeleton className="h-10 w-3/4 mx-auto" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Skeleton className="h-64 w-full lg:col-span-1" />
          <Skeleton className="h-64 w-full lg:col-span-2" />
        </div>
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-12 w-1/3 mx-auto" />
      </div>
    </div>
  )
}
