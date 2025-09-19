import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export function BackButton() {
  return (
    <Button
      className="flex items-center gap-2"
      asChild
    >
      <Link
        to="/"
      >
        <ArrowLeft className="h-4 w-4" />
        返回输入
      </Link>
    </Button>
  );
}