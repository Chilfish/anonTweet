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
    const { tweetElRef, tweet, setShowTranslationButton, setScreenshoting, showTranslations } = useTranslationStore();

    async function onSaveAsImage() {
        if (!tweetElRef || !tweet) {
            console.log('tweetElRef or tweet is null', {tweetElRef, tweet});
            return;
        }

        setShowTranslationButton(false);
        setScreenshoting(true); 

        await new Promise(resolve => requestAnimationFrame(resolve));

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
        } else {
            console.log('png is null', {png, tweetElRef, tweet});
            toast.error('图片保存失败');
        }
        // 恢复翻译按钮显示
        setScreenshoting(false);
        if (showTranslations) {
            setShowTranslationButton(true);
        }
    }

    return (
        <Button
            size="sm"
            variant="secondary"
            onClick={onSaveAsImage}
        >
            保存为图片
        </Button>
    )
}