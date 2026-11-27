import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 9);
      setImages(prev => [...prev, ...newImages].slice(0, 9));
    }
  };

  // 上传图片到 Supabase Storage
  const uploadImagesToStorage = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      try {
        // 1. 生成唯一文件名
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `user-uploads/${fileName}`;
        
        console.log('准备上传:', fileName);
        
        // 2. 上传到 Storage
        const { data, error: uploadError } = await supabase.storage
          .from('posts') // 确保这个名称与存储桶一致
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('上传失败:', uploadError);
          throw uploadError;
        }
        
        console.log('上传成功:', data);
        
        // 3. 获取公开URL
        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);
        
        console.log('公开URL:', publicUrl);
        uploadedUrls.push(publicUrl);
        
      } catch (error) {
        console.error('单张图片上传失败:', error);
      }
    }
    
    return uploadedUrls;
  };

  // 提交帖子
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      // 1. 获取当前用户
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('请先登录');
        return;
      }
      
      console.log('开始发布流程，用户:', user.id);
      
      // 2. 上传图片到 Storage
      let imageUrls: string[] = [];
      if (images.length > 0) {
        console.log('开始上传图片，数量:', images.length);
        imageUrls = await uploadImagesToStorage(images);
        console.log('上传完成，得到URL:', imageUrls);
      }
      
      // 3. 构建帖子数据
      const newPost = {
        content: content.trim(),
        image_urls: imageUrls, // 字符串数组，即使为空也要传
        user_id: user.id,
        created_at: new Date().toISOString()
      };
      
      console.log('准备保存到数据库:', newPost);
      
      // 4. 保存到 posts 表
      const { data, error } = await supabase
        .from('posts')
        .insert([newPost])
        .select()
        .single();
      
      if (error) {
        console.error('数据库保存失败:', error);
        throw error;
      }
      
      console.log('发布成功:', data);
      
      // 5. 清空表单
      setContent('');
      setImages([]);
      alert('发布成功！');
      
    } catch (error: any) {
      console.error('发布失败:', error);
      alert(`发布失败: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // 删除已选图片
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-md mb-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="分享你的生活点滴..."
        className="w-full p-4 border border-stone-300 rounded-lg mb-4 resize-none"
        rows={4}
        required
      />
      
      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {images.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`预览 ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex flex-wrap gap-3 items-center">
        {/* 图片上传按钮 */}
        <label className="flex items-center gap-2 px-4 py-2 bg-terracotta-50 text-terracotta-700 rounded-lg cursor-pointer hover:bg-terracotta-100">
          <Upload className="w-5 h-5" />
          添加图片
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </label>
        
        <span className="text-stone-500 text-sm">
          已选择 {images.length}/9 张图片
        </span>
        
        <div className="flex-1" />
        
        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={uploading || !content.trim()}
          className="px-6 py-2 bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? '发布中...' : '发布'}
        </button>
      </div>
      
      <div className="mt-3 text-sm text-stone-500">
        <p>💡 提示：图片将上传到 Supabase Storage，URL 会保存在数据库的 image_urls 字段</p>
      </div>
    </form>
  );
};

export default CreatePost;
