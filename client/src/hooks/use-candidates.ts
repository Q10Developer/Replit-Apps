import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { candidateStatusEnum, type CandidateStatus } from "@shared/schema";

export function useCandidates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all candidates
  const {
    data: candidates = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["/api/candidates"],
  });

  // Update candidate status
  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: CandidateStatus;
    }) => {
      try {
        // Validate status
        candidateStatusEnum.parse(status);
        
        const res = await apiRequest("POST", `/api/candidates/${id}/status`, { status });
        return await res.json();
      } catch (error) {
        throw new Error("Invalid status value");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Status updated",
        description: "Candidate status has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Update candidate notes
  const updateNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const res = await apiRequest("POST", `/api/candidates/${id}/notes`, { notes });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Notes updated",
        description: "Candidate notes have been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update notes",
        variant: "destructive",
      });
    },
  });

  return {
    candidates,
    isLoading,
    isError,
    error,
    updateStatus,
    updateNotes,
  };
}
