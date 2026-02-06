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
  
  // 生成缩略图URL（假设使用查询参数进行图片转换）
  const thumbnailUrl = `${url}?width=300&height=300&resize=cover&quality=80`;
  
  return { url, thumbnailUrl };
};

/**
 * 处理好友动态数据，提取图片信息
 */

 export const extractGalleryImagesFromPosts = (posts: any[]): GalleryImage[] => {
  return posts.flatMap(post => {
    // ⚠️ 关键修复：使用 image_urls 而不是 images
    const postImages = post.image_urls || [];
    
    if (!Array.isArray(postImages) || postImages.length === 0) return [];
    
    return postImages.map((img: any, index: number) => {
      // 处理不同的数据格式
      let url, thumbnailUrl, width, height;
      
      if (typeof img === 'string') {
        // 如果是字符串格式
        url = img;
        thumbnailUrl = img;
        width = 0;
        height = 0;
      } else if (img && typeof img === 'object') {
        // 如果是对象格式
        url = img.url || img;
        thumbnailUrl = img.thumbnail_url || img.thumbnailUrl || img.url || img;
        width = img.width || 0;
        height = img.height || 0;
      } else {
        // 其他格式，跳过
        return null;
      }
      
      // 确保URL有效
      if (!url) return null;
      
      return {
        id: `${post.id}-${index}`,
        url: url,
        thumbnailUrl: thumbnailUrl,
        alt: post.content || `来自 ${post.user?.name || '好友'} 的图片`,
        caption: post.content,
        width: width,
        height: height,
        uploader: {
          id: post.user_id,
          name: post.user?.name || '好友',
          avatar: post.user?.avatar_url
        },
        createdAt: post.created_at,
        likes: post.likes_count || 0,
        isLiked: post.is_liked || false
      };
    }).filter((item): item is GalleryImage => item !== null); // 过滤掉null值
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
