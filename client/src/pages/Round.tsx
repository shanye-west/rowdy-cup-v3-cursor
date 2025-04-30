import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import RoundHeader from "@/components/RoundHeader";
import MatchesList from "@/components/MatchesList";
import { useParams } from "wouter";
import { getQueryFn } from "@/lib/queryClient";


export default function Round({ id }: { id: number }) {
  const { data: round, isLoading: isRoundLoading } = useQuery({
    queryKey: [`/api/rounds/${id}`],
    queryFn: getQueryFn(),
  });

  const { data: matches, isLoading: isMatchesLoading } = useQuery({
    queryKey: [`/api/rounds/${id}/matches`],
    queryFn: getQueryFn(),
  });

  const isLoading = isRoundLoading || isMatchesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!round) {
    return <div>Round not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <RoundHeader round={round} />
      <Card className="mt-6">
        <CardContent className="pt-6">
          <MatchesList matches={matches || []} />
        </CardContent>
      </Card>
    </div>
  );
}