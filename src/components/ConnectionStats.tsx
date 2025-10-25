interface ConnectionMetrics {
  total: number;
  thisMonth: number;
  topCity: string | null;
  topCityCount?: number;
  recentContact: {
    name: string;
    date: string;
  } | null;
}

interface ConnectionStatsProps {
  metrics: ConnectionMetrics;
  loading?: boolean;
}

const ConnectionStats = ({ metrics, loading }: ConnectionStatsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card animate-pulse">
            <div className="h-4 bg-muted rounded w-20 mb-2"></div>
            <div className="h-8 bg-muted rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Total Connections",
      value: metrics.total.toLocaleString(),
      subtext: "All-time",
      color: "text-primary"
    },
    {
      label: "This Month",
      value: metrics.thisMonth.toLocaleString(),
      subtext: "Last 30 days",
      color: "text-accent"
    },
    {
      label: "Top City",
      value: metrics.topCity || "N/A",
      subtext: metrics.topCityCount ? `${metrics.topCityCount} connections` : "",
      color: "text-primary-glow"
    },
    {
      label: "Most Recent",
      value: metrics.recentContact?.name || "None yet",
      subtext: metrics.recentContact?.date 
        ? new Date(metrics.recentContact.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : "",
      color: "text-foreground"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <p className="text-xs uppercase text-muted-foreground tracking-wide mb-2">
            {stat.label}
          </p>
          <p className={`text-2xl font-bold mb-1 ${stat.color}`}>
            {stat.value}
          </p>
          {stat.subtext && (
            <p className="text-xs text-muted-foreground">
              {stat.subtext}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConnectionStats;
