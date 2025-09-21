import React, { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  src: string; // Ensure src is a string
  fallbackSrc?: string;
  width?: number | string; // Allow width to be number or string
  height?: number | string; // Allow height to be number or string
}

const DEFAULT_FALLBACK = '/ROY.PNG';

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  height,
  width,
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src); // Ensure imgSrc is a string

  // Convert width and height to numbers if they are strings
  const numericWidth = typeof width === 'string' ? parseInt(width, 10) : width;
  const numericHeight = typeof height === 'string' ? parseInt(height, 10) : height;

  return (
    <Image
      alt={imgSrc}
      width={numericWidth} // Specify the width
      height={numericHeight} // Specify the height
      src={imgSrc}
      onError={() => setImgSrc(fallbackSrc)}
      {...props} // Spread remaining props, ensuring they are valid for the Image component
    />
  );
};

export default ImageWithFallback;
