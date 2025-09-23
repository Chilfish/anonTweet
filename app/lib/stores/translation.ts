import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Entity } from '../react-tweet/utils';
import type { Tweet } from '../react-tweet/api';

// 分隔符预设模板接口
interface SeparatorTemplate {
  id: string;
  name: string;
  html: string;
}

// 翻译设置接口
interface TranslationSettings {
  enabled: boolean;
  customSeparator: string;
  selectedTemplateId: string;
  separatorTemplates: SeparatorTemplate[];
  customTemplates: SeparatorTemplate[];
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
  screenshoting: boolean;

  tweet: Tweet | null,

  // 设置相关方法
  updateSettings: (settings: Partial<TranslationSettings>) => void;
  resetSettings: () => void;
  selectTemplate: (templateId: string) => void;
  updateTemplate: (templateId: string, updates: Partial<SeparatorTemplate>) => void;
  addTemplate: (template: Omit<SeparatorTemplate, 'id'>) => void;
  deleteTemplate: (templateId: string) => void;
  addCustomTemplate: (template: Omit<SeparatorTemplate, 'id'>) => string;
  updateCustomTemplate: (templateId: string, updates: Partial<SeparatorTemplate>) => void;
  deleteCustomTemplate: (templateId: string) => void;

  // 翻译内容相关方法
  setTranslation: (tweetId: string, content: Entity[]) => void;
  getTranslation: (tweetId: string) => Entity[] | undefined;
  deleteTranslation: (tweetId: string) => void;

  // UI状态相关方法
  setShowTranslations: (show: boolean) => void;
  setScreenshoting: (screenshoting: boolean) => void;
  setEditingTweetId: (tweetId: string | null) => void;
  setShowTranslationButton: (show: boolean) => void;
  setTweetElRef: (ref: HTMLDivElement) => void;

  setTweet: (tweet: Tweet) => void,

  // 工具方法
  hasTextContent: (text?: string) => boolean;
}

// 默认分隔符模板
const defaultTemplates: SeparatorTemplate[] = [
  {
    id: 'preset-google',
    name: '谷歌翻译风格',
    html: `<div style="margin-top: 4px; color: #1d9bf0;">
    <b style="font-weight: bold; font-size: small;">由 谷歌 翻译自 日语</b>
    <hr style="margin: 3px; border-top-width: 2px;">
  </div>`
  }
];

// 默认设置
const defaultSettings: TranslationSettings = {
  enabled: true,
  customSeparator: defaultTemplates[0].html,
  selectedTemplateId: defaultTemplates[0].id,
  separatorTemplates: defaultTemplates,
  customTemplates: [],
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
      screenshoting: false,

      // 设置相关方法
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () =>
        set((state) => ({
          settings: { ...defaultSettings },
        })),

      selectTemplate: (templateId) =>
        set((state) => {
          const template = state.settings.separatorTemplates.find(t => t.id === templateId) ||
                          state.settings.customTemplates.find(t => t.id === templateId);
          if (template) {
            return {
              settings: {
                ...state.settings,
                selectedTemplateId: templateId,
                customSeparator: template.html,
              },
            };
          }
          return state;
        }),

      updateTemplate: (templateId, updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            separatorTemplates: state.settings.separatorTemplates.map(template =>
              template.id === templateId ? { ...template, ...updates } : template
            ),
          },
        })),

      addTemplate: (template) =>
        set((state) => {
          const newId = `custom-${Date.now()}`;
          const newTemplate = { ...template, id: newId };
          return {
            settings: {
              ...state.settings,
              separatorTemplates: [...state.settings.separatorTemplates, newTemplate],
            },
          };
        }),

      deleteTemplate: (templateId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            separatorTemplates: state.settings.separatorTemplates.filter(t => t.id !== templateId),
            selectedTemplateId: state.settings.selectedTemplateId === templateId 
              ? 'google' 
              : state.settings.selectedTemplateId,
          },
        })),

      addCustomTemplate: (template) => {
        const newId = `custom-${Date.now()}`;
        const newTemplate = { ...template, id: newId };
        set((state) => ({
          settings: {
            ...state.settings,
            customTemplates: [...state.settings.customTemplates, newTemplate],
          },
        }));
        return newId;
      },

      updateCustomTemplate: (templateId, updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            customTemplates: state.settings.customTemplates.map(template =>
              template.id === templateId ? { ...template, ...updates } : template
            ),
          },
        })),

      deleteCustomTemplate: (templateId) =>
        set((state) => {
          const newCustomTemplates = state.settings.customTemplates.filter(t => t.id !== templateId);
          const allTemplates = [...state.settings.separatorTemplates, ...newCustomTemplates];
          const newSelectedId = state.settings.selectedTemplateId === templateId 
            ? allTemplates[0]?.id || 'google'
            : state.settings.selectedTemplateId;
          const selectedTemplate = allTemplates.find(t => t.id === newSelectedId);
          return {
            settings: {
              ...state.settings,
              customTemplates: newCustomTemplates,
              selectedTemplateId: newSelectedId,
              customSeparator: selectedTemplate?.html || state.settings.customSeparator,
            },
          };
        }),

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
      setScreenshoting: (screenshoting) => set({ screenshoting }),

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
      version: 2,
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);
