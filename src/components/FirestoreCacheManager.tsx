
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Database, Trash2, RefreshCw, HardDrive } from 'lucide-react';
import { cleanupCache, getStorageStats } from '@/utils/supabase';
import { migrateLocalStorageToFirestore, checkAndPerformMigration } from '@/utils/data-migration';
import { useToast } from '@/hooks/use-toast';

export const FirestoreCacheManager = () => {
  const [stats, setStats] = useState<{ used: number, total: number, items: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();
  
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const firestoreStats = await getStorageStats();
      setStats(firestoreStats);
    } catch (error) {
      console.error('Error fetching storage stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch storage statistics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStats();
    
    // Check if we need to perform migration
    const checkMigration = async () => {
      const shouldMigrate = await checkAndPerformMigration();
      if (shouldMigrate) {
        toast({
          title: 'Data Migration Complete',
          description: 'Your locally stored data has been migrated to Firestore',
        });
        fetchStats();
      }
    };
    
    checkMigration();
  }, []);
  
  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      await cleanupCache();
      toast({
        title: 'Cache Cleaned',
        description: 'Successfully cleaned up stale cached data',
      });
      fetchStats();
    } catch (error) {
      console.error('Error cleaning cache:', error);
      toast({
        title: 'Error',
        description: 'Failed to clean cache',
        variant: 'destructive',
      });
    } finally {
      setIsCleaning(false);
    }
  };
  
  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      const count = await migrateLocalStorageToFirestore();
      toast({
        title: 'Migration Complete',
        description: `Migrated ${count} items to Firestore`,
      });
      fetchStats();
    } catch (error) {
      console.error('Error during migration:', error);
      toast({
        title: 'Error',
        description: 'Failed to migrate data',
        variant: 'destructive',
      });
    } finally {
      setIsMigrating(false);
    }
  };
  
  const usagePercentage = stats ? Math.min(100, (stats.used / stats.total) * 100) : 0;
  const formattedUsed = stats ? formatBytes(stats.used) : '0 B';
  const formattedTotal = stats ? formatBytes(stats.total) : '0 B';
  
  return (
    <Card className="bg-background border-white/10">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-accent" />
          <CardTitle className="text-white text-xl">Firestore Cache</CardTitle>
        </div>
        <CardDescription className="text-white/70">
          Cloud storage for app data and cached content
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between mb-1 text-sm text-white/70">
            <span>Storage Usage</span>
            <span>{formattedUsed} / {formattedTotal}</span>
          </div>
          
          <Progress value={usagePercentage} className="h-2" />
          
          <div className="flex justify-between text-sm text-white/70">
            <span>Cache Items</span>
            <span>{stats?.items || 0} items</span>
          </div>
          
          <div className="p-3 bg-white/5 rounded-md text-sm text-white/90">
            <HardDrive className="h-4 w-4 inline mr-2 text-accent" />
            Your data is now stored securely in the cloud while maintaining offline access.
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2 flex-wrap">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchStats} 
          disabled={isLoading}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCleanup} 
          disabled={isCleaning || !stats || stats.items === 0}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isCleaning ? 'Cleaning...' : 'Clean Cache'}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleMigration} 
          disabled={isMigrating}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <Database className="h-4 w-4 mr-2" />
          {isMigrating ? 'Migrating...' : 'Migrate Local Data'}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default FirestoreCacheManager;
