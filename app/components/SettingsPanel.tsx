import { Monitor, Moon, SettingsIcon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '~/lib/stores/theme';
import { useTranslationSettings, useTranslationStore } from '~/lib/stores/translation';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

export const SettingsPanel = () => {
  const { settings, updateSettings, resetSettings } = useTranslationSettings();
  const { setShowTranslations, setShowTranslationButton, showTranslationButton, showTranslations } = useTranslationStore()
  const { theme, setTheme } = useTheme();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  function toggleTranslations() {
    setShowTranslations(showTranslations ? false : true);
    setShowTranslationButton(showTranslationButton ? false : true);
  }

  return (
    <div className="flex items-center gap-3">
      {/* 显示/隐藏翻译按钮 */}
      <Button
        size="sm"
        onClick={toggleTranslations}
        className="h-8 px-3 text-sm font-medium transition-all duration-200"
      >
        {showTranslations ? "隐藏翻译" : "开始翻译"}
      </Button>

      {/* 翻译设置对话框 */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
          >
            <SettingsIcon className="size-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">设置</DialogTitle>
          </DialogHeader>

          {/* 主题设置 */}
          <Card className="gap-0">
            <CardContent className="space-y-4 px-4">
              <Label>
                <h3 className="font-bold">主题</h3>
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="flex items-center gap-2"
                >
                  <Sun className="size-4" />
                  浅色
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="flex items-center gap-2"
                >
                  <Moon className="size-4" />
                  深色
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="size-4" />
                  系统
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 自定义分隔符 */}
          <Card className="gap-0">
            <CardContent className="space-y-4 px-4">
              <Label htmlFor="separator-html">
                <h3 className="font-bold">自定义分隔符</h3>
              </Label>
              <Textarea
                value={settings.customSeparator}
                onChange={(e) => updateSettings({ customSeparator: e.target.value })}
                placeholder="输入自定义分隔符HTML"
                className="text-sm"
                id="separator-html"
              />

              <div className=" mt-1 space-y-2">
                <div className='text-xs'>
                  预览：
                </div>
                <p>正文：Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
                <div
                  dangerouslySetInnerHTML={{ __html: settings.customSeparator }}
                />
                <p className='font-bold'>译文：Lorem Ipsum 只是印刷和排版行业的虚拟文本。</p>
              </div>

            </CardContent>
          </Card>

          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

