import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Settings, Languages, Edit3, Save, X, Trash2, SettingsIcon, LanguagesIcon } from 'lucide-react';
import { useTranslationStore, useTranslationSettings } from '~/lib/stores/translation';
import type { EnrichedTweet, EnrichedQuotedTweet } from '~/lib/react-tweet/utils';

export const TranslationPanel = () => {
  const { settings, updateSettings, resetSettings } = useTranslationSettings();
  const showTranslations = useTranslationStore((state) => state.showTranslations);
  const toggleTranslations = useTranslationStore((state) => state.toggleTranslations);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {/* 显示/隐藏翻译按钮 */}
      <Button
        variant={showTranslations ? "default" : "outline"}
        size="sm"
        onClick={toggleTranslations}
        className="h-8 px-3 text-sm font-medium transition-all duration-200"
      >
        {showTranslations ? "隐藏翻译" : "显示翻译"}
      </Button>

      {/* 翻译设置对话框 */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <SettingsIcon className="size-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">翻译设置</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 自定义分隔符 */}
            <Card className="p-4 space-y-4">
              <Label htmlFor="separator-html" className="text-sm font-normal">
                <h3 className="font-medium text-gray-900">自定义分隔符</h3>
              </Label>
              <Textarea
                value={settings.customSeparator}
                onChange={(e) => updateSettings({ customSeparator: e.target.value })}
                placeholder="输入自定义分隔符HTML"
                className="text-sm"
              />

              <div className="text-xs text-gray-500 mt-1">
                预览：
                <div
                  dangerouslySetInnerHTML={{ __html: settings.customSeparator }}
                />
              </div>
            </Card>

            {/* 操作按钮 */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={resetSettings}
                className="text-sm"
              >
                重置为默认
              </Button>

              <Button
                onClick={() => setIsSettingsOpen(false)}
                className="text-sm"
              >
                完成
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// 翻译编辑器组件
interface TranslationEditorProps {
  tweetId: string;
  originalTweet: EnrichedTweet | EnrichedQuotedTweet;
  className?: string;
}

export const TranslationEditor: React.FC<TranslationEditorProps> = ({
  tweetId,
  originalTweet,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [entityTranslations, setEntityTranslations] = useState<Array<{
    type: 'hashtag' | 'mention' | 'url' | 'symbol';
    originalText: string;
    translatedText: string;
  }>>([]);

  const translations = useTranslationStore((state) => state.translations);
  const setTranslation = useTranslationStore((state) => state.setTranslation);
  const { settings } = useTranslationSettings();
  const isTranslationEnabled = settings.enableTranslation;
  const hasTextContent = useTranslationStore((state) => state.hasTextContent);

  const existingTranslation = translations[tweetId];

  // 获取推文中的可翻译entities
  const getTranslatableEntities = () => {
    if (Array.isArray(originalTweet.entities)) {
      return originalTweet.entities.filter(entity =>
        entity.type === 'hashtag' || entity.type === 'symbol'
      );
    }
    return [];
  };

  // 检查是否应该显示翻译编辑器
  const shouldShowEditor = () => {
    // 全局翻译开关关闭
    if (!isTranslationEnabled) return false;

    // 纯图片推文检测 - 使用更严格的检测逻辑
    if (!hasTextContent(originalTweet.text)) return false;

    return true;
  };

  // 如果不应该显示编辑器，返回null
  if (!shouldShowEditor()) {
    return null;
  }

  const handleOpen = () => {
    setEditText(existingTranslation?.text || '');

    // 初始化entities翻译
    const translatableEntities = getTranslatableEntities();
    const existingEntityTranslations = existingTranslation?.entities || [];

    const initialEntityTranslations = translatableEntities.map(entity => {
      const existing = existingEntityTranslations.find(
        et => et.originalText === entity.text && et.type === entity.type
      );
      return {
        type: entity.type as 'hashtag' | 'mention' | 'url' | 'symbol',
        originalText: entity.text,
        translatedText: existing?.translatedText || '',
      };
    });

    setEntityTranslations(initialEntityTranslations);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (editText.trim()) {
      const filteredEntityTranslations = entityTranslations.filter(
        et => et.translatedText.trim() !== ''
      );

      setTranslation(tweetId, {
        text: editText.trim(),
        entities: filteredEntityTranslations.length > 0 ? filteredEntityTranslations : undefined
      });
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    const deleteTranslation = useTranslationStore.getState().deleteTranslation;
    deleteTranslation(tweetId);
    setIsOpen(false);
  };

  const handleEntityTranslationChange = (index: number, translatedText: string) => {
    const updated = [...entityTranslations];
    updated[index].translatedText = translatedText;
    setEntityTranslations(updated);
  };

  const translatableEntities = getTranslatableEntities();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={"ghost"}
          size="icon"
          onClick={handleOpen}
          className={`${className} text-gray-500 ml-auto`}
        >
          <LanguagesIcon className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            翻译推文
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 原文显示 */}
          <div>
            <Label className="text-sm font-medium text-gray-700">原文</Label>
            <Card className="mt-2">
              <CardContent>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {originalTweet.text}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 翻译输入 */}
          <div>
            <Label htmlFor="translation" className="text-sm font-medium text-gray-700">
              翻译
            </Label>
            <Textarea
              id="translation"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="输入翻译内容..."
              className="mt-2 min-h-[120px] resize-none"
            />
          </div>

          {/* Entities翻译 */}
          {translatableEntities.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700">
                标签和符号翻译 (可选)
              </Label>
              <div className="mt-2 space-y-2">
                {entityTranslations.map((entityTranslation, index) => (
                  <div key={`${entityTranslation.type}-${entityTranslation.originalText}`} className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 min-w-0 flex-shrink-0">
                      {entityTranslation.originalText}:
                    </span>
                    <Input
                      value={entityTranslation.translatedText}
                      onChange={(e) => handleEntityTranslationChange(index, e.target.value)}
                      placeholder={`${entityTranslation.originalText}`}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-between pt-4">
            <div>
              {existingTranslation && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  删除翻译
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!editText.trim()}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                保存
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};