import { useQuery } from '@tanstack/react-query';
import { fetchTags } from '@/services/tags.service';

export function useTagsList() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });
}
