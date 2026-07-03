import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export const ScheduleCard = ({ post, onClick }: { post: any, onClick: () => void }) => {
  return (
    <Card className="cursor-pointer hover:bg-muted/50" onClick={onClick}>
      <CardContent className="p-3">
        <div className="font-semibold">{post.type}</div>
        <div className="text-sm text-muted-foreground">{post.caption}</div>
      </CardContent>
    </Card>
  );
};
