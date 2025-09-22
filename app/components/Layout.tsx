import { useState, type JSX } from 'react';
import { InfoIcon, Sparkles } from 'lucide-react';
import { Outlet, useSearchParams } from 'react-router';
import { cn } from '~/lib/utils';
import { PageHeader } from './PageHeader';
import { Button } from './ui/button';

interface LinkProps {
  to: string;
  className?: string;
  children?: JSX.Element | string;
}

const Linker = ({ to, className, children }: LinkProps) => (
  <a
    href={to}
    className={cn('inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline mx-1', className)}
    target='_blank'
    rel='noopener noreferrer'
  >
    {children}
  </a>
);

const Footer = ({ className, ...props }: { className?: string }) => (
  <footer className={cn('w-full text-center text-sm text-muted-foreground', className)} {...props}>
    <p>
      <span>Made by</span>
      <Linker to='https://space.bilibili.com/259486090'>@Chilfish</Linker>
      <span>其他作品：</span>
    </p>
    <ul className='inline-flex flex-wrap items-center justify-center w-full text-xs'>
      <Linker to='https://tweet.chilfish.top/memo/240y_k'>女声优特推&ins存档站</Linker>/
      <Linker to='https://nishio.chilfish.top/zh'>西尾文明暦</Linker>/
      <Linker to='https://replive.chilfish.top'>西尾夕香 replive 记录</Linker>/
      <Linker to='https://oshitabi.chilfish.top/'>推し旅 AR 镜头</Linker>
    </ul>
  </footer>
);

export function LayoutComponent({ children }: { children?: React.ReactNode }) {
  const [showFooter, setShowFooter] = useState(false);

  return (
    <div className='relative w-full mx-auto px-2 sm:px-16 pt-8 pb-4 flex flex-col justify-center min-h-screen overflow-hidden'>
      {/* 背景装饰 */}
      <div className='absolute inset-0 -z-10'>
        {/* 主背景渐变 */}
        <div className='absolute inset-0 bg-gradient-to-br from-background via-background to-accent/5' />
        
        {/* 动态光点 */}
        <div className='absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse' />
        <div className='absolute top-3/4 right-1/4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl animate-pulse delay-1000' />
        <div className='absolute top-1/2 left-3/4 w-20 h-20 bg-pink-500/10 rounded-full blur-xl animate-pulse delay-2000' />
        
        {/* 网格背景 */}
        <div className='absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20' />
      </div>

      {/* 顶部装饰星星 */}
      <div className='absolute top-8 right-8 text-primary/30 animate-pulse'>
        <Sparkles className='size-6' />
      </div>
      <div className='absolute top-16 left-8 text-purple-500/30 animate-pulse delay-500'>
        <Sparkles className='size-4' />
      </div>
      <div className='absolute top-32 right-1/3 text-pink-500/30 animate-pulse delay-1000'>
        <Sparkles className='size-3' />
      </div>

      <div className='mb-auto'></div>
      
      {/* 主内容区域添加微妙的背景 */}
      <div className='relative z-10'>
        <PageHeader />
      </div>

      <main className='relative z-10 flex flex-col items-center justify-center mb-6'>
         {children ? children : <Outlet />}
      </main>

      <div className='relative z-10 flex items-center mt-auto'>
        <Footer
          className={cn('transition-all duration-300 flex-1', {
            'opacity-0': !showFooter,
            'opacity-100': showFooter,
          })}
        />

        <Button 
          variant='ghost' 
          className='text-muted-foreground hover:text-primary transition-colors duration-200 hover:scale-105 transform' 
          onClick={() => setShowFooter(!showFooter)}
        >
          <InfoIcon className='size-5' />
        </Button>
      </div>
    </div>
  );
}

export default function Layout() {
  const [searchParams] = useSearchParams();
  const plain = searchParams.get('plain') === 'true';

  if (plain) {
    return <Outlet />;
  }

  return (
    <LayoutComponent>
      <Outlet />
    </LayoutComponent>
  );
}
