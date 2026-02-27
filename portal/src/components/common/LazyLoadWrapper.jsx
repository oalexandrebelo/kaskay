import React, { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LazyLoadWrapper({ children, fallback }) {
  return (
    <Suspense fallback={fallback || <Skeleton className="h-96 w-full rounded-2xl" />}>
      {children}
    </Suspense>
  );
}