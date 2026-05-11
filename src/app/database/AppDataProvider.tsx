import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { openAppDatabase } from '@/shared/persistence/db';
import { CategoryRepository } from '@/features/categories/data/categoryRepository';
import { MomentRepository } from '@/features/moments/data/momentRepository';

export type AppRepositories = {
  categories: CategoryRepository;
  moments: MomentRepository;
};

const RepoContext = createContext<AppRepositories | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [repos, setRepos] = useState<AppRepositories | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = await openAppDatabase();
      if (cancelled) return;
      setRepos({
        categories: new CategoryRepository(db),
        moments: new MomentRepository(db),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!repos) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <RepoContext.Provider value={repos}>{children}</RepoContext.Provider>;
}

export function useRepositories(): AppRepositories {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useRepositories must be used within AppDataProvider');
  return ctx;
}
