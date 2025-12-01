import {
  CircleGaugeIcon,
  HomeIcon,
  LogInIcon,
  LogOutIcon,
  UserCogIcon,
} from 'lucide-react'
import { Link, useSubmit } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { useAuthUser } from '~/hooks/use-auth-user'
import { isAnonUser } from '~/lib/config'
import { getAvatarUrl } from '~/lib/utils'

export function UserNav() {
  const { user } = useAuthUser()
  const submit = useSubmit()
  const { avatarUrl, placeholderUrl } = getAvatarUrl(user.image, user.name)
  const initials = user?.name?.slice(0, 2)
  const alt = user?.name ?? 'User avatar'
  const avatar = avatarUrl || placeholderUrl
  const isLoggedIn = !isAnonUser(user)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 rounded-full">
          <Avatar className="size-8">
            <AvatarImage src={avatar} alt={alt} />
            <AvatarFallback className="font-bold text-xs uppercase">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" forceMount>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={avatar} alt={alt} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-muted-foreground text-xs">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
        >
          <Link
            to="/"
          >
            <HomeIcon />
            首页
          </Link>
        </DropdownMenuItem>
        {
          isLoggedIn && (
            <DropdownMenuItem
              asChild
            >
              <Link
                to="/settings/account"
              >
                <UserCogIcon />
                账号设置
              </Link>
            </DropdownMenuItem>
          )
        }
        {user.role === 'admin' && (
          <DropdownMenuItem
            asChild
          >
            <Link
              to="/admin"
            >
              <CircleGaugeIcon />
              管理员面板
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />

        {isLoggedIn ? (
          <DropdownMenuItem
            asChild
          >

            <Link
              to="/auth/sign-out"
            >
              <LogOutIcon />
              退出登录
            </Link>
          </DropdownMenuItem>
        )
          : (
              <DropdownMenuItem
                asChild
              >
                <Link
                  to="/auth/sign-in"
                >
                  <LogInIcon />
                  登录
                </Link>
              </DropdownMenuItem>
            )}

      </DropdownMenuContent>
    </DropdownMenu>
  )
}
