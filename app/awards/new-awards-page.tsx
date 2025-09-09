"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Trophy, Award, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type TeamAward = {
  id: string;
  team_id: string;
  team_name: string;
  team_logo: string | null;
  award_type: string;
  season_number: number;
  year: number;
  description: string | null;
};

type PlayerAward = {
  id: string;
  player_id: string;
  gamer_tag_id: string;
  team_id: string | null;
  team_name: string | null;
  team_logo: string | null;
  award_type: string;
  season_number: number;
  year: number;
  description: string | null;
  player_avatar: string | null;
};

type Season = {
  id: number;
  name: string;
  number: number;
};

export default function AwardsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamAwards, setTeamAwards] = useState<TeamAward[]>([]);
  const [playerAwards, setPlayerAwards] = useState<PlayerAward[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch team awards
        const { data: teamAwardsData, error: teamAwardsError } = await supabase
          .from("team_awards")
          .select(`
            id,
            team_id,
            teams:team_id (name, logo_url),
            award_type,
            season_number,
            year,
            description
          `)
          .order("year", { ascending: false })
          .order("season_number", { ascending: false });

        if (teamAwardsError) throw teamAwardsError;

        const formattedTeamAwards: TeamAward[] = (teamAwardsData || []).map((award: any) => ({
          id: award.id,
          team_id: award.team_id,
          team_name: award.teams?.name || "Unknown Team",
          team_logo: award.teams?.logo_url || null,
          award_type: award.award_type,
          season_number: award.season_number,
          year: award.year,
          description: award.description,
        }));

        // Fetch player awards
        const { data: playerAwardsData, error: playerAwardsError } = await supabase
          .from("player_awards")
          .select(`
            id,
            player_id,
            players:player_id (gamer_tag_id, avatar_url),
            team_id,
            teams:team_id (name, logo_url),
            award_type,
            season_number,
            year,
            description
          `)
          .order("year", { ascending: false })
          .order("season_number", { ascending: false });

        if (playerAwardsError) throw playerAwardsError;

        const formattedPlayerAwards: PlayerAward[] = (playerAwardsData || []).map((award: any) => ({
          id: award.id,
          player_id: award.player_id,
          gamer_tag_id: award.players?.gamer_tag_id || "Unknown Player",
          team_id: award.team_id,
          team_name: award.teams?.name || null,
          team_logo: award.teams?.logo_url || null,
          award_type: award.award_type,
          season_number: award.season_number,
          year: award.year,
          description: award.description,
          player_avatar: award.players?.avatar_url || null,
        }));

        // Extract unique seasons
        const allSeasons: Season[] = [
          ...new Set([
            ...formattedTeamAwards.map((a) => a.season_number),
            ...formattedPlayerAwards.map((a) => a.season_number),
          ]),
        ]
          .sort((a, b) => b - a)
          .map((seasonNumber) => ({
            id: seasonNumber,
            name: `Season ${seasonNumber}`,
            number: seasonNumber,
          }));

        setTeamAwards(formattedTeamAwards);
        setPlayerAwards(formattedPlayerAwards);
        setSeasons(allSeasons);
      } catch (err) {
        console.error("Error fetching awards:", err);
        setError("Failed to load awards. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load awards. Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, toast]);

  // Filter awards based on selected season and year
  const filteredTeamAwards = teamAwards.filter((award) => {
    const seasonMatch = selectedSeason === "all" || award.season_number === Number(selectedSeason);
    const yearMatch = selectedYear === "all" || award.year === Number(selectedYear);
    return seasonMatch && yearMatch;
  });

  const filteredPlayerAwards = playerAwards.filter((award) => {
    const seasonMatch = selectedSeason === "all" || award.season_number === Number(selectedSeason);
    const yearMatch = selectedYear === "all" || award.year === Number(selectedYear);
    return seasonMatch && yearMatch;
  });

  // Group awards by type
  const teamAwardsByType = filteredTeamAwards.reduce<Record<string, TeamAward[]>>((acc, award) => {
    if (!acc[award.award_type]) {
      acc[award.award_type] = [];
    }
    acc[award.award_type].push(award);
    return acc;
  }, {});

  const playerAwardsByType = filteredPlayerAwards.reduce<Record<string, PlayerAward[]>>((acc, award) => {
    if (!acc[award.award_type]) {
      acc[award.award_type] = [];
    }
    acc[award.award_type].push(award);
    return acc;
  }, {});

  // Get available years
  const availableYears = [
    ...new Set([
      ...teamAwards.map((award) => award.year),
      ...playerAwards.map((award) => award.year),
    ]),
  ].sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/30 p-8">
        <div className="container mx-auto">
          <Skeleton className="h-12 w-64 mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-6 border rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/30">
        <div className="text-center p-8 max-w-2xl">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/30">
      <div className="container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">League Awards</h1>
          <p className="text-lg text-muted-foreground">Celebrating excellence in the league</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-center">
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium mb-2" htmlFor="season">
              Filter by Season
            </label>
            <select
              id="season"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full p-2 border rounded-md bg-white dark:bg-slate-800"
            >
              <option value="all">All Seasons</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.number}>
                  {season.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-64">
            <label className="block text-sm font-medium mb-2" htmlFor="year">
              Filter by Year
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full p-2 border rounded-md bg-white dark:bg-slate-800"
            >
              <option value="all">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Team Awards */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Trophy className="mr-2 text-yellow-500" /> Team Awards
          </h2>
          {Object.keys(teamAwardsByType).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(teamAwardsByType).map(([awardType, awards]) => (
                <div key={awardType} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold">{awardType}</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {awards.map((award) => (
                      <div key={award.id} className="flex items-center space-x-4">
                        {award.team_logo ? (
                          <Image
                            src={award.team_logo}
                            alt={award.team_name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium">{award.team_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Season {award.season_number} • {award.year}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
              <p className="text-muted-foreground">No team awards found for the selected filters.</p>
            </div>
          )}
        </div>

        {/* Player Awards */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Award className="mr-2 text-blue-500" /> Player Awards
          </h2>
          {Object.keys(playerAwardsByType).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(playerAwardsByType).map(([awardType, awards]) => (
                <div key={awardType} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold">{awardType}</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {awards.map((award) => (
                      <div key={award.id} className="flex items-center space-x-4">
                        {award.player_avatar ? (
                          <Image
                            src={award.player_avatar}
                            alt={award.gamer_tag_id}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                            <Award className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium">{award.gamer_tag_id}</h4>
                          {award.team_name && (
                            <p className="text-sm text-muted-foreground">
                              {award.team_name} • Season {award.season_number} • {award.year}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
              <p className="text-muted-foreground">No player awards found for the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
