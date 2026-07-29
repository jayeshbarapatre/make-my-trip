import { PHOTOS, photoJpg, photoSrcSet, photoAlt } from '../../utils/images'

/**
 * Responsive photograph with a WebP source and a JPG fallback.
 * `priority` marks above-the-fold images so they load eagerly instead of lazily.
 */
export default function Photo({
  name,
  sizes = '100vw',
  className = '',
  style,
  priority = false,
  alt,
  ...rest
}) {
  if (!PHOTOS[name]) return null

  return (
    <picture>
      <source type="image/webp" srcSet={photoSrcSet(name, 'webp')} sizes={sizes} />
      <source type="image/jpeg" srcSet={photoSrcSet(name, 'jpg')} sizes={sizes} />
      <img
        src={photoJpg(name)}
        alt={alt ?? photoAlt(name)}
        className={className}
        style={style}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        {...rest}
      />
    </picture>
  )
}
