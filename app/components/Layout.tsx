import { Outlet, useSearchParams } from "react-router";
import { PageHeader } from "./PageHeader";

export function LayoutComponent({ children }: { children?: React.ReactNode }) {
    return (
        <div className="w-full mx-auto px-2 py-8 flex flex-col justify-center min-h-screen  ">
            <PageHeader />

            <div className="flex flex-col items-center justify-center space-y-6">
                {children ? children : <Outlet />}
            </div>
        </div>
    )
}

export default function Layout() {
    const [searchParams] = useSearchParams();
    const plain = searchParams.get('plain') === 'true';

    if (plain) {
        return <Outlet />
    }

    return (
        <LayoutComponent>
            <Outlet />
        </LayoutComponent>
    )
}
