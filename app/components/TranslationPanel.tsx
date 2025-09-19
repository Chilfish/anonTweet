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

