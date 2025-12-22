import { useState } from 'react';
import { useApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useExpertRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const api = useApi();
  const { toast } = useToast();

  const sendExpertRequest = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.post('/experts/request', payload);
      toast.success('Request sent successfully');
      return { success: true, data: res.data };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to send request';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  return { sendExpertRequest, isLoading };
};

export default useExpertRequest;
