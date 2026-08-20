import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription } from '~/components/ui/empty'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { MediaImage } from '~/components/ui/media'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { PreviewCard, PreviewCardPopup, PreviewCardTrigger } from '~/components/ui/preview-card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { Spinner } from '~/components/ui/spinner'
import { Switch } from '~/components/ui/switch'
import { Toggle } from '~/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'

/**
 * ui 在用原语补全 story（review 阶段二 item 3 后半）——「被使用即覆盖」。
 * 覆盖在用清单：button/alert/avatar/badge/card/checkbox/dialog/dropdown-menu/empty/
 * input/label/media/popover/preview-card/scroll-area/select/separator/skeleton/spinner/
 * switch/toggle/tooltip。交互态（菜单打开/弹窗）由 Storybook 面板操作。
 */

const meta = {
  title: 'UI/Primitives',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Buttons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
}

export const AlertVariants: Story = {
  render: () => (
    <div className="flex w-[420px] flex-col gap-3">
      <Alert>
        <AlertTitle>默认提示</AlertTitle>
        <AlertDescription>用于中性信息提示。</AlertDescription>
      </Alert>
      <Alert variant="error">
        <AlertTitle>错误提示</AlertTitle>
        <AlertDescription>用于错误信息，醒目色块。</AlertDescription>
      </Alert>
    </div>
  ),
}

export const CardDemo: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>卡片标题</CardTitle>
        <CardDescription>卡片描述信息</CardDescription>
      </CardHeader>
      <CardContent>卡片主体内容区域。</CardContent>
    </Card>
  ),
}

export const FormControls: Story = {
  render: () => (
    <div className="flex w-[360px] flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="demo-input">昵称</Label>
        <Input id="demo-input" placeholder="输入昵称" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="demo-select">语言</Label>
        <Select value={{ label: '中文', value: 'zh' }} onValueChange={() => {}}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={{ label: '中文', value: 'zh' }}>中文</SelectItem>
            <SelectItem value={{ label: '日本語', value: 'ja' }}>日本語</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={false} onCheckedChange={() => {}} />
          记住我
        </label>
        <Switch checked onCheckedChange={() => {}} />
        <Toggle pressed={false} onPressedChange={() => {}}>粗体</Toggle>
      </div>
    </div>
  ),
}

export const Feedback: Story = {
  render: () => (
    <div className="flex w-[360px] flex-col gap-4">
      <div className="flex items-center gap-2">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading…
      </div>
      <Empty>
        <EmptyContent>
          <EmptyDescription>暂无数据</EmptyDescription>
        </EmptyContent>
      </Empty>
    </div>
  ),
}

export const MediaStates: Story = {
  render: () => (
    <div className="grid w-[360px] grid-cols-2 gap-3">
      <div className="aspect-[4/3]">
        <MediaImage
          src="https://picsum.photos/seed/media/400/300"
          alt="示例图片"
        />
      </div>
      <div className="flex items-center justify-center text-xs text-muted-foreground">
        错误图：下方显示占位
      </div>
      <div className="aspect-[4/3]">
        <MediaImage
          src="https://invalid.example.invalid/broken.jpg"
          alt="broken"
          errorFallback={<div className="flex size-full items-center justify-center text-xs">加载失败</div>}
        />
      </div>
    </div>
  ),
}

export const Overlays: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Hover</Button>} />
        <TooltipContent>提示气泡</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline">菜单</Button>} />
        <DropdownMenuContent>
          <DropdownMenuItem>选项一</DropdownMenuItem>
          <DropdownMenuItem>选项二</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover>
        <PopoverTrigger render={<Button variant="outline">Popover</Button>} />
        <PopoverContent className="w-48 p-3 text-sm">弹出内容</PopoverContent>
      </Popover>

      <Dialog>
        <DialogTrigger render={<Button variant="outline">弹窗</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>对话框</DialogTitle>
            <DialogDescription>描述文本</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
}

export const MetadataBits: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Badge</Badge>
      <Avatar>
        <AvatarImage src="https://picsum.photos/seed/avatar/100/100" alt="avatar" />
        <AvatarFallback>CF</AvatarFallback>
      </Avatar>
      <Separator orientation="vertical" className="h-8" />
      <PreviewCard>
        <PreviewCardTrigger render={<Button variant="outline">预览卡</Button>} />
        <PreviewCardPopup className="w-64 p-3">
          <p className="text-sm font-medium">链接预览</p>
        </PreviewCardPopup>
      </PreviewCard>
      <ScrollArea className="h-20 w-48 border rounded-md p-2">
        <div className="space-y-1 text-xs">
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i}>
              滚动行
              {i + 1}
            </p>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
}
