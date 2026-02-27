import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export default function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  placeholder = "bg-slate-200",
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "50px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  return (
    <div
      ref={imgRef}
      className={cn(
        "overflow-hidden transition-all duration-300",
        !isLoaded && placeholder,
        className
      )}
      style={{ width, height }}
    >
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-500",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          {...props}
        />
      )}
    </div>
  );
}