import type { Route } from './+types/not-found'
import { redirect } from 'react-router'
import { ErrorDisplay } from '~/components/error-boundary'

export const meta: Route.MetaFunction = () => [{ title: 'Not Found' }]

export async function loader({ params }: Route.LoaderArgs) {
  const path = params['*']
  const isNotANumber = Number.isNaN(Number(path))
  if (!isNotANumber) {
    return redirect(`/tweets/${path}`)
  }
  throw new Response('Not found', { status: 404 })
}

export async function action() {
  throw new Response('Not found', { status: 404 })
}

export default function NotFound() {
  return <ErrorBoundary />
}

export function ErrorBoundary() {
  return (
    <ErrorDisplay
      message="Oops! Page Not Found."
      detail="It seems like the page you're looking for does not exist or might have been removed."
    />
  )
}
