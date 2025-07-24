// lib/hooks/useFetcher.ts

export const fetcher = async (url: string) => {
    const res = await fetch(url);
    
    if (!res.ok && res.status !== 401) {
      throw new Error('Failed to fetch');
    }
    
    return res.json();
  };