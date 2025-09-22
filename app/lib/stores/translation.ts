import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EnrichedTweet, EnrichedQuotedTweet, Entity } from '../react-tweet/utils';
import type { RefObject } from 'react';
import type { Tweet } from '../react-tweet/api';

// 翻译设置接口
interface TranslationSettings {
  customSeparator: string;
}

// 翻译状态接口
interface TranslationState {
  // 翻译设置
  settings: TranslationSettings;

  // 翻译内容存储 (tweetId -> Entity[])
  translations: Record<string, Entity[]>;

  // UI状态
  showTranslations: boolean;
  showTranslationButton: boolean;
  editingTweetId: string | null;
  tweetElRef: HTMLDivElement | null;

  tweet: Tweet | null,

  // 设置相关方法
  updateSettings: (settings: Partial<TranslationSettings>) => void;
  resetSettings: () => void;

  // 翻译内容相关方法
  setTranslation: (tweetId: string, content: Entity[]) => void;
  getTranslation: (tweetId: string) => Entity[] | undefined;
  deleteTranslation: (tweetId: string) => void;

  // UI状态相关方法
  setShowTranslations: (show: boolean) => void;
  setEditingTweetId: (tweetId: string | null) => void;
  setShowTranslationButton: (show: boolean) => void;
  setTweetElRef: (ref: HTMLDivElement) => void;

  setTweet: (tweet: Tweet) => void,

  // 工具方法
  hasTextContent: (text?: string) => boolean;
}

// 默认设置
const defaultSettings: TranslationSettings = {
  customSeparator: `<div style="margin-top: 4px; color: #1d9bf0;">
    <b style="font-weight: bold; font-size: small;">由 谷歌 翻译自 日语</b>
    <hr style="margin: 3px; border-top-width: 2px;">
  </div>`,
};

export const useTranslationStore = create<TranslationState>()(
  persist(
    (set, get) => ({
      // 初始状态
      settings: defaultSettings,
      translations: {},
      showTranslations: false,
      showTranslationButton: false,
      editingTweetId: null,
      tweetElRef: null,
      tweet: null,

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
            [tweetId]: content,
          },
        })),

      getTranslation: (tweetId) => get().translations[tweetId],

      deleteTranslation: (tweetId) =>
        set((state) => {
          const { [tweetId]: deleted, ...rest } = state.translations;
          return { translations: rest };
        }),

      // UI状态相关方法
      setShowTranslations: (show) => set({ showTranslations: show }),
      setShowTranslationButton: (show) => set({ showTranslationButton: show }),
      setEditingTweetId: (tweetId) => set({ editingTweetId: tweetId }),
      setTweetElRef: (ref) => set({ tweetElRef: ref }),
      setTweet: (tweet) => set({ tweet }),

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

export const useTranslationUI = () => {
  const showTranslations = useTranslationStore((state) => state.showTranslations);
  const editingTweetId = useTranslationStore((state) => state.editingTweetId);
  const toggleTranslations = useTranslationStore((state) => state.setShowTranslations);
  const setEditingTweetId = useTranslationStore((state) => state.setEditingTweetId);
  return { showTranslations, editingTweetId, toggleTranslations, setEditingTweetId };
};