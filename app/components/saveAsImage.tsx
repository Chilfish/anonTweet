import { domToPng } from 'modern-screenshot'
import { useTranslationStore } from '~/lib/stores/translation';
import { Button } from './ui/button';
import { toast } from 'sonner';

function saveAsImage(png: string, fileName: string) {
    const a = document.createElement('a');
    a.href = png;
    a.download = fileName + '.png';
    a.click();
    URL.revokeObjectURL(a.href);
}

export function SaveAsImageButton() {
    const { tweetElRef, tweet, setShowTranslationButton } = useTranslationStore();

    async function onSaveAsImage() {
        if (!tweetElRef || !tweet) {
            return;
        }

        setShowTranslationButton(false);

        const png = await domToPng(tweetElRef, {
            quality: 1,
            scale: 2,
        });
        if (png) {
            const now = new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            })
            const fileName = tweet.user.screen_name + '-' + tweet.id_str + '-' + now;
            saveAsImage(png, fileName);
            toast.success('图片保存成功');
        }
        // 恢复翻译按钮显示
        setShowTranslationButton(true);
    }

    return (
        <Button
            size="sm"
            onClick={onSaveAsImage}
        >
            保存图片
        </Button>
    )
}