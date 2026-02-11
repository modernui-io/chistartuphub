import { useMemo } from 'react';
import { useInvestorPipeline } from './useInvestorPipeline';

export const usePipelineAnnotations = () => {
  const pipeline = useInvestorPipeline();

  const annotations = useMemo(() => {
    const map = new Map();
    for (const item of pipeline.pipelineItems) {
      map.set(String(item.investor_id), {
        tag: item.tag,
        notes: item.notes,
        stage: item.stage,
      });
    }
    return map;
  }, [pipeline.pipelineItems]);

  return { annotations, isLoading: pipeline.isLoading };
};
