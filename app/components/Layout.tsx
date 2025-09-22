import { Outlet, useSearchParams } from "react-router";
import { PageHeader } from "./PageHeader";

export default function Layout() {

    const [searchParams] = useSearchParams();
    const plain = searchParams.get('plain') === 'true';

    if (plain) {
        return <Outlet />
    }

    return (
        <div className="container mx-auto px-2 py-8 flex flex-col justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <PageHeader />

            <div className="flex flex-col items-center justify-center space-y-6">
                <Outlet />
            </div>
        </div>
    )
}
