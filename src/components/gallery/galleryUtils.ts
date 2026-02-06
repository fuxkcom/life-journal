import { GalleryImage } from './ImageGallery';

/**
 * 从Supabase存储URL生成图片URL
 */
export const generateImageUrls = (
  storagePath: string, 
  bucketName: string = 'posts'
): { url: string; thumbnailUrl: string } => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${storagePath}`;
  
  const thumbnailUrl = `${url}?width=300&height=300&resize=cover&quality=80`;
  
  return { url, thumbnailUrl };
};

/**
 * 处理好友动态数据，提取图片信息
 */
export const extractGalleryImagesFromPosts = (posts: any[]): GalleryImage[] => {
  return posts.flatMap(post => {
    const postImages = post.image_urls || [];
    
    if (!Array.isArray(postImages) || postImages.length === 0) return [];
    
    const galleryImages = postImages.map((img: any, index: number) => {
      let url: string, thumbnailUrl: string, width: number = 0, height: number = 0;
      
      if (typeof img === 'string') {
        url = img;
        thumbnailUrl = img;
      } else if (img && typeof img === 'object') {
        url = img.url || '';
        thumbnailUrl = img.thumbnail_url || img.thumbnailUrl || img.url || '';
        width = img.width || 0;
        height = img.height || 0;
      } else {
        return null;
      }
      
      if (!url) return null;
      
      const galleryImage: GalleryImage = {
        id: `${post.id}-${index}`,
        url: url,
        thumbnailUrl: thumbnailUrl,
      };
      
      if (post.content) {
        galleryImage.alt = post.content;
        galleryImage.caption = post.content;
      }
      
      if (width > 0 || height > 0) {
        galleryImage.width = width;
        galleryImage.height = height;
      }
      
      if (post.user_id) {
        galleryImage.uploader = {
          id: post.user_id,
          name: post.user?.name || '好友',
        };
        if (post.user?.avatar_url) {
          galleryImage.uploader.avatar = post.user.avatar_url;
        }
      }
      
      if (post.created_at) {
        galleryImage.createdAt = post.created_at;
      }
      
      galleryImage.likes = post.likes_count || 0;
      galleryImage.isLiked = post.is_liked || false;
      
      return galleryImage;
    });
    
    return galleryImages.filter(item => item !== null) as GalleryImage[];
  });
};

/**
 * 预加载图片
 */
export const preloadImages = (images: GalleryImage[]): Promise<void[]> => {
  const promises = images.map(img => {
    return new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`Failed to load image: ${img.url}`));
      image.src = img.url;
    });
  });
  
  return Promise.all(promises);
};

/**
 * 下载图片
 */
export const downloadImage = async (imageUrl: string, filename?: string): Promise<void> => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `image-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('下载图片失败:', error);
    throw error;
  }
};
