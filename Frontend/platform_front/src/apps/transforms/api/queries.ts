import { useQuery, useMutation } from '@tanstack/react-query';
import { TransformsAPI } from './transforms-api';

export const useTransformDefinitions = () => {
    return useQuery({
        queryKey: ['transform-definitions'],
        queryFn: TransformsAPI.list,
    });
};

export const useTransformDefinition = (id: string) => {
    return useQuery({
        queryKey: ['transform-definition', id],
        queryFn: () => TransformsAPI.get(id),
        enabled: !!id,
    });
};

export const useExecuteTransform = () => {
    return useMutation({
        mutationFn: (id: string) => TransformsAPI.execute(id),
    });
};

export const useTransformRun = (id: string) => {
    return useQuery({
        queryKey: ['transform-run', id],
        queryFn: () => TransformsAPI.getRun(id),
        enabled: !!id,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (data?.status === 'pending' || data?.status === 'running') {
                return 2000;
            }
            return false;
        }
    });
};
