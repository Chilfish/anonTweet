import type { ReactNode } from 'react'
import type {
  NavItemCollapsible,
  NavItemLink,
  NavItemUnion,
} from './navigation'
import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Badge } from '~/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '~/components/ui/sidebar'

function isNavLink(item: NavItemUnion): item is NavItemLink {
  return !item.items
}

function isActiveLink(currentPath: string, targetUrl?: string): boolean {
  if (!targetUrl)
    return false

  // Full match
  if (currentPath === targetUrl)
    return true

  // Ignore query parameters match
  if (currentPath.split('?')[0] === targetUrl)
    return true

  // Only match if targetUrl is a parent path
  const cleanCurrentPath = currentPath.split('?')[0]
  const isParentPath = cleanCurrentPath?.startsWith(`/${targetUrl}/`)

  if (isParentPath) {
    return true
  }

  return false
}

function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>
}

function SidebarMenuLink({
  item,
  href,
}: {
  item: NavItemLink
  href: string
}) {
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link to={item.url} onClick={() => setOpenMobile(false)} />}
        isActive={isActiveLink(href, item.url)}
        tooltip={item.title}
      >

        {item.icon && <item.icon />}
        <span>{item.title}</span>
        {item.badge && <NavBadge>{item.badge}</NavBadge>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarMenuCollapsible({
  item,
  href,
}: {
  item: NavItemCollapsible
  href: string
}) {
  const { setOpenMobile } = useSidebar()

  // Check if the current path is in this group or matches the group link
  const isGroupActive = Boolean(
    (item.url && isActiveLink(href, item.url))
    || item.items.some(subItem => isActiveLink(href, subItem.url)),
  )

  return (
    <Collapsible
      render={<SidebarMenuItem />}
      defaultOpen={isGroupActive}
      className="group/collapsible"
    >

      <CollapsibleTrigger render={<SidebarMenuButton tooltip={item.title} />}>

        {item.icon && <item.icon />}
        <span>{item.title}</span>
        {item.badge && <NavBadge>{item.badge}</NavBadge>}
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="CollapsibleContent">
        <SidebarMenuSub>
          {item.items.map(subItem => (
            <SidebarMenuSubItem key={subItem.title}>
              <SidebarMenuSubButton
                render={<Link to={subItem.url} onClick={() => setOpenMobile(false)} />}
                isActive={isActiveLink(href, subItem.url)}
              >
                {subItem.icon && <subItem.icon />}
                <span>{subItem.title}</span>
                {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}

function SidebarMenuCollapsedDropdown({
  item,
  href,
}: {
  item: NavItemCollapsible
  href: string
}) {
  // Check if the current path is in this group or matches the group link
  const isGroupActive = Boolean(
    (item.url && isActiveLink(href, item.url))
    || item.items.some(subItem => isActiveLink(href, subItem.url)),
  )

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isGroupActive}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={4}>
          <DropdownMenuLabel>
            {item.title}
            {' '}
            {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map(sub => (
            <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
              <Link
                to={sub.url}
                className={isActiveLink(href, sub.url) ? 'bg-secondary' : ''}
              >
                {sub.icon && <sub.icon />}
                <span className="max-w-52 text-wrap">{sub.title}</span>
                {sub.badge && (
                  <span className="ml-auto text-xs">{sub.badge}</span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export function NavGroup({
  title,
  items,
}: {
  title?: string
  items: NavItemUnion[]
}) {
  const { state } = useSidebar()
  const { pathname: href } = useLocation()

  return (
    <SidebarGroup>
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item: NavItemUnion) => {
          const key = `${item.title}-${item.url ?? ''}`

          if (isNavLink(item))
            return <SidebarMenuLink key={key} item={item} href={href} />

          if (state === 'collapsed') {
            return (
              <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />
            )
          }

          return <SidebarMenuCollapsible key={key} item={item} href={href} />
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
