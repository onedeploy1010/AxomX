import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferralCardProps {
  refCode: string | undefined;
}

export function ReferralCard({ refCode }: ReferralCardProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Copied to clipboard" });
  };

  const referralLink = refCode ? `${window.location.origin}?ref=${refCode}` : "--";

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Referral Link</span>
            <Button
              size="sm"
              className="text-[10px] h-6"
              onClick={() => copyToClipboard(referralLink)}
              data-testid="button-copy-referral"
            >
              <Link2 className="mr-1 h-3 w-3" /> Generate
            </Button>
          </div>
          <div className="text-xs font-mono text-muted-foreground truncate">{referralLink}</div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Referral Code</span>
            <Button
              size="sm"
              className="text-[10px] h-6"
              onClick={() => copyToClipboard(refCode || "")}
              data-testid="button-copy-code"
            >
              <Copy className="mr-1 h-3 w-3" /> Copy
            </Button>
          </div>
          <div className="text-xs font-mono text-muted-foreground" data-testid="text-ref-code">
            {refCode || "--"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
