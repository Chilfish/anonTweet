import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EnrichedTweet, EnrichedQuotedTweet } from '../react-tweet/utils';

// 翻译设置接口
interface TranslationSettings {
  enableTranslation: boolean;
  showSourceTranslation: boolean;
  showQuotedTranslation: boolean;
  showCommentTranslation: boolean;
  customSeparator: string;
}

// 单个翻译内容
interface TranslationContent {
  text: string;
  entities?: Array<{
    type: 'hashtag' | 'mention' | 'url' | 'symbol';
    originalText: string;
    translatedText: string;
  }>;
  createdAt: number;
  updatedAt: number;
}

// 翻译状态接口
interface TranslationState {
  // 翻译设置
  settings: TranslationSettings;
  
  // 翻译内容存储 (tweetId -> TranslationContent)
  translations: Record<string, TranslationContent>;
  
  // UI状态
  showTranslations: boolean;
  editingTweetId: string | null;
  
  // 设置相关方法
  updateSettings: (settings: Partial<TranslationSettings>) => void;
  resetSettings: () => void;
  
  // 翻译内容相关方法
  setTranslation: (tweetId: string, content: Partial<TranslationContent>) => void;
  getTranslation: (tweetId: string) => TranslationContent | undefined;
  deleteTranslation: (tweetId: string) => void;
  
  // UI状态相关方法
  toggleTranslations: () => void;
  setEditingTweetId: (tweetId: string | null) => void;
  
  // 工具方法
  createTranslatedTweet: (originalTweet: EnrichedTweet | EnrichedQuotedTweet, tweetId: string) => EnrichedTweet | EnrichedQuotedTweet | null;
  hasTextContent: (text?: string) => boolean;
}

// 默认设置
const defaultSettings: TranslationSettings = {
  enableTranslation: true,
  showSourceTranslation: true,
  showQuotedTranslation: true,
  showCommentTranslation: true,
  customSeparator: `<div style="margin-top: 4px; color: #1d9bf0;">
    <b style="font-weight: bold; font-size: small;">由 谷歌 翻译自 日语</b>
    <hr style="margin: 3px; border-top-width: 2px;">
  </div>`,
};

// 深拷贝推文对象的工具函数
const deepCloneTweet = <T extends EnrichedTweet | EnrichedQuotedTweet>(tweet: T): T => {
  return JSON.parse(JSON.stringify(tweet));
};

// 创建翻译后的entities
const createTranslatedEntities = (
  originalEntities: any[],
  translationContent: TranslationContent
) => {
  if (!translationContent.entities) return originalEntities;
  
  return originalEntities.map(entity => {
    const translatedEntity = translationContent.entities?.find(
      te => te.originalText === entity.text && te.type === entity.type
    );
    
    if (translatedEntity) {
      return {
        ...entity,
        text: translatedEntity.translatedText,
      };
    }
    
    return entity;
  });
};

export const useTranslationStore = create<TranslationState>()(
  persist(
    (set, get) => ({
      // 初始状态
      settings: defaultSettings,
      translations: {},
      showTranslations: false,
      editingTweetId: null,
      
      // 设置相关方法
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () =>
        set((state) => ({
          settings: { ...defaultSettings },
        })),
      
      // 翻译内容相关方法
      setTranslation: (tweetId, content) =>
        set((state) => ({
          translations: {
            ...state.translations,
            [tweetId]: {
              ...state.translations[tweetId],
              ...content,
              updatedAt: Date.now(),
              createdAt: state.translations[tweetId]?.createdAt || Date.now(),
            },
          },
        })),
      
      getTranslation: (tweetId) => get().translations[tweetId],
      
      deleteTranslation: (tweetId) =>
        set((state) => {
          const { [tweetId]: deleted, ...rest } = state.translations;
          return { translations: rest };
        }),
      
      // UI状态相关方法
      toggleTranslations: () =>
        set((state) => ({ showTranslations: !state.showTranslations })),
      
      setEditingTweetId: (tweetId) =>
        set({ editingTweetId: tweetId }),
      
      // 工具方法
      createTranslatedTweet: (originalTweet, tweetId) => {
        const translation = get().translations[tweetId];
        if (!translation || !translation.text) return null;
        
        const clonedTweet = deepCloneTweet(originalTweet);
        
        // 更新entities以支持翻译后的链接、标签等
        clonedTweet.entities = createTranslatedEntities(originalTweet.entities, translation);
        
        return clonedTweet;
      },
      
      hasTextContent: (text?: string) => {
        if (!text) return false;
        // 移除空白字符后检查是否有内容
        const cleanText = text.trim();
        if (cleanText.length === 0) return false;
        
        // 检查是否只包含链接、提及或标签（纯图片推文的常见情况）
        const urlRegex = /https?:\/\/[^\s]+/g;
        const mentionRegex = /@\w+/g;
        const hashtagRegex = /#\w+/g;
        
        // 移除所有链接、提及和标签
        const textWithoutLinks = cleanText
          .replace(urlRegex, '')
          .replace(mentionRegex, '')
          .replace(hashtagRegex, '')
          .trim();
        
        // 如果移除后没有实质内容，认为是纯图片推文
        return textWithoutLinks.length > 0;
      },
    }),
    {
      name: 'translation-store',
      partialize: (state) => ({
        settings: state.settings,
        translations: state.translations,
      }),
    }
  )
);

// 便捷的hooks
export const useTranslationSettings = () => {
  const settings = useTranslationStore((state) => state.settings);
  const updateSettings = useTranslationStore((state) => state.updateSettings);
  const resetSettings = useTranslationStore((state) => state.resetSettings);
  return { settings, updateSettings, resetSettings };
};

export const useTranslation = (tweetId: string) => {
  const translation = useTranslationStore((state) => state.getTranslation(tweetId));
  const setTranslation = useTranslationStore((state) => state.setTranslation);
  const deleteTranslation = useTranslationStore((state) => state.deleteTranslation);
  return { translation, setTranslation, deleteTranslation };
};

export const useTranslationUI = () => {
  const showTranslations = useTranslationStore((state) => state.showTranslations);
  const editingTweetId = useTranslationStore((state) => state.editingTweetId);
  const toggleTranslations = useTranslationStore((state) => state.toggleTranslations);
  const setEditingTweetId = useTranslationStore((state) => state.setEditingTweetId);
  return { showTranslations, editingTweetId, toggleTranslations, setEditingTweetId };
};