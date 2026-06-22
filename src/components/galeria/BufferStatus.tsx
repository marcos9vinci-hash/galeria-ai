import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Database, RefreshCw, Layers, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export function BufferStatus() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/buffer/profiles');
      const data = await response.json();
      if (data.data?.profiles && Array.isArray(data.data.profiles)) {
        setProfiles(data.data.profiles);
      } else if (data.data?.account?.organizations) {
        // Fallback for nested structure if server doesn't flatten correctly
        const channels = data.data.account.organizations.flatMap((org: any) => org.channels || []);
        setProfiles(channels);
      } else if (data.error) {
        setError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Database className="w-4 h-4 text-[#2c4bff]" />
          Canais Buffer
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchProfiles} disabled={loading}>
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-[10px] text-destructive overflow-hidden text-ellipsis">{error}</p>}
        <div className="space-y-2">
          {profiles.length > 0 ? profiles.map((p) => (
            <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-accent/30 text-xs">
              {p.avatar ? (
                <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-full" />
              ) : (
                <User className="w-5 h-5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{p.service}</p>
              </div>
            </div>
          )) : !loading && <p className="text-[10px] text-muted-foreground">Nenhum canal encontrado.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
