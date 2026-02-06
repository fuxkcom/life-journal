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
    if (!post.images || post.images.length === 0) return [];
    
    return post.images.map((img: any, index: number) => ({
      id: `${post.id}-${index}`,
      url: img.url,
      thumbnailUrl: img.thumbnail_url || img.url,
      alt: post.content || `来自 ${post.user?.name} 的图片`,
      caption: post.content,
      width: img.width,
      height: img.height,
      uploader: {
        id: post.user_id,
        name: post.user?.name || '好友',
        avatar: post.user?.avatar_url
      },
      createdAt: post.created_at,
      likes: post.likes_count,
      isLiked: post.is_liked
    }));
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
