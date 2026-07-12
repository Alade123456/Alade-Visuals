import React, { useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

export function useSupabaseArraySync<T extends { id: string }>(
  tableName: string,
  state: T[],
  setState: React.Dispatch<React.SetStateAction<T[]>>,
  isAuthenticated: boolean
) {
  const previousState = useRef<T[] | null>(null);

  // 1. Initial Load from Supabase
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let isMounted = true;
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase.from(tableName).select('*').eq('user_id', user.id);
        if (error) {
          console.error(`Error loading ${tableName}:`, error);
          return;
        }
        
        if (isMounted && data && data.length > 0) {
          setState(data as T[]);
          previousState.current = data as T[];
        } else if (isMounted && data && data.length === 0 && previousState.current === null) {
          if (state.length > 0) {
             previousState.current = []; // trigger diff upload
          } else {
             previousState.current = [];
          }
        }
      } catch (err) {
        console.warn('Supabase sync error (offline?):', err);
      }
    };
    
    loadData();
    return () => { isMounted = false; };
  }, [isAuthenticated, tableName, setState]);

  // 2. Diff and Sync to Supabase
  useEffect(() => {
    if (!isAuthenticated || previousState.current === null) return;
    
    const syncDiff = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const prevMap = new Map(previousState.current!.map(item => [item.id, item]));
        const currMap = new Map(state.map(item => [item.id, item]));

        // Check for added or updated items
        for (const [id, item] of currMap) {
          const prevItem = prevMap.get(id);
          if (!prevItem) {
            await supabase.from(tableName).insert({ ...item, user_id: user.id });
          } else if (JSON.stringify(prevItem) !== JSON.stringify(item)) {
            await supabase.from(tableName).update(item).eq('id', id).eq('user_id', user.id);
          }
        }

        // Check for deleted items
        for (const [id] of prevMap) {
          if (!currMap.has(id as string)) {
            await supabase.from(tableName).delete().eq('id', id as string).eq('user_id', user.id);
          }
        }

        previousState.current = JSON.parse(JSON.stringify(state)); // deep copy
      } catch (err) {
        console.warn('Supabase sync error (offline?):', err);
      }
    };

    syncDiff();
  }, [state, isAuthenticated, tableName]);
}

export function useSupabaseObjectSync<T extends object>(
  tableName: string,
  state: T,
  setState: React.Dispatch<React.SetStateAction<T>>,
  isAuthenticated: boolean,
  pkColumn: string = 'user_id'
) {
  const previousState = useRef<T | null>(null);

  // 1. Initial Load
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let isMounted = true;
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase.from(tableName).select('*').eq(pkColumn, user.id).single();
        if (error && error.code !== 'PGRST116') { // PGRST116 is not found
          console.error(`Error loading ${tableName}:`, error);
          return;
        }
        
        if (isMounted && data) {
          setState(data as T);
          previousState.current = data as T;
        } else if (isMounted && !data && previousState.current === null) {
          previousState.current = {} as T; // trigger diff
        }
      } catch (err) {
        console.warn('Supabase sync error (offline?):', err);
      }
    };
    
    loadData();
    return () => { isMounted = false; };
  }, [isAuthenticated, tableName, setState, pkColumn]);

  // 2. Diff and Sync
  useEffect(() => {
    if (!isAuthenticated || previousState.current === null) return;
    
    const syncDiff = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (JSON.stringify(previousState.current) !== JSON.stringify(state)) {
          await supabase.from(tableName).upsert({ ...state, [pkColumn]: user.id });
          previousState.current = JSON.parse(JSON.stringify(state));
        }
      } catch (err) {
        console.warn('Supabase sync error (offline?):', err);
      }
    };

    syncDiff();
  }, [state, isAuthenticated, tableName, pkColumn]);
}
