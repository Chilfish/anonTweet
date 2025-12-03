import type { DragEndEvent } from '@dnd-kit/core'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ImagePlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '~/lib/utils'

// 内部封装的图片对象，包含用于 DnD 的唯一 ID 和预览地址
interface ImageItem {
  id: string
  file: File
  preview: string
}

interface ImageUploaderProps {
  value: File[]
  onChange: (files: File[]) => void
  maxCount?: number
}

// 可排序的单张图片组件
function SortableImage({
  item,
  onRemove,
}: {
  item: ImageItem
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging }
    = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative aspect-square rounded-lg border bg-background overflow-hidden touch-none select-none',
        isDragging && 'opacity-50 ring-2 ring-primary',
      )}
      {...attributes}
      {...listeners}
    >
      <img
        src={item.preview}
        alt="preview"
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
      <button
        type="button"
        onClick={(e) => {
          // 阻止事件冒泡，防止触发拖拽或外层点击
          e.stopPropagation()
          e.preventDefault()
          onRemove()
        }}
        className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function ImageUploader({ value, onChange, maxCount = 9 }: ImageUploaderProps) {
  // 内部维护带 ID 的状态，用于 DnD
  const [items, setItems] = useState<ImageItem[]>([])

  // 当外部 value 变空时（例如表单重置），同步清空内部状态
  useEffect(() => {
    if (value.length === 0 && items.length > 0) {
      // 清理旧的 URL
      items.forEach(item => URL.revokeObjectURL(item.preview))
      setItems([])
    }
  }, [value, items])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id)
      return

    setItems((items) => {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      const newItems = arrayMove(items, oldIndex, newIndex)
      // 同步回父组件
      onChange(newItems.map(i => i.file))
      return newItems
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files)
      return

    const newFiles = Array.from(e.target.files)
    // 剩余可添加数量
    const remaining = maxCount - items.length
    const filesToAdd = newFiles.slice(0, remaining)

    if (filesToAdd.length === 0)
      return

    const newItems = filesToAdd.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`, // 生成唯一ID
      file,
      preview: URL.createObjectURL(file),
    }))

    const nextItems = [...items, ...newItems]
    setItems(nextItems)
    onChange(nextItems.map(i => i.file))

    // 清空 input value 允许重复选择同一文件
    e.target.value = ''
  }

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const target = prev.find(i => i.id === id)
      if (target)
        URL.revokeObjectURL(target.preview) // 释放内存

      const nextItems = prev.filter(i => i.id !== id)
      onChange(nextItems.map(i => i.file))
      return nextItems
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map(item => (
            <SortableImage
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item.id)}
            />
          ))}

          {/* 上传按钮 (当未达到最大数量时显示) */}
          {items.length < maxCount && (
            <label className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:bg-muted hover:border-muted-foreground/50">
              <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                <ImagePlus className="h-6 w-6" />
                <span>
                  {items.length}
                  {' '}
                  /
                  {' '}
                  {maxCount}
                </span>
              </div>
              <input
                type="file"
                className="sr-only" // 隐藏原生 input
                multiple
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileSelect}
              />
            </label>
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}
