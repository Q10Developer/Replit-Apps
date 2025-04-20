import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import AvatarName from "@/components/ui/avatar-name";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CandidateDetailProps {
  candidate: any;
  isOpen: boolean;
  onClose: () => void;
}

const CandidateDetail = ({ candidate, isOpen, onClose }: CandidateDetailProps) => {
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (candidate) {
      setNotes(candidate.notes || "");
    }
  }, [candidate]);

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async () => {
      if (!candidate) return;
      const res = await apiRequest("POST", `/api/candidates/${candidate.id}/notes`, { notes });
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

  // Status change mutation
  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!candidate) return;
      const res = await apiRequest("POST", `/api/candidates/${candidate.id}/status`, { status });
      return await res.json();
    },
    onSuccess: (data, status) => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Status updated",
        description: `Candidate has been ${status === "shortlisted" ? "approved" : "rejected"}`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    },
  });

  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-lg font-medium text-gray-900">
              Candidate Profile
            </DialogTitle>
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              Score: {candidate.score}%
            </span>
          </div>
        </DialogHeader>
        
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <AvatarName name={candidate.name} size="lg" />
            <div className="ml-4">
              <h4 className="text-lg font-bold">{candidate.name}</h4>
              <p className="text-sm text-gray-500">{candidate.position}</p>
              <p className="text-sm text-gray-500">{candidate.email}</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="py-4">
          <h4 className="font-medium text-gray-800 mb-2">Skills Analysis</h4>
          <div className="space-y-2">
            {Object.entries(candidate.skills)
              .sort(([, a]: any, [, b]: any) => b - a)
              .map(([skill, score]: [string, any]) => (
                <div key={skill}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{skill}</span>
                    <span className="text-sm font-medium text-gray-700">{score}%</span>
                  </div>
                  <Progress
                    value={score}
                    className="h-2 mb-2"
                    indicatorClassName={
                      score >= 90
                        ? "bg-green-500"
                        : score >= 75
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }
                  />
                </div>
              ))}
          </div>
        </div>
        
        <Separator />
        
        {candidate.experience && candidate.experience.length > 0 && (
          <>
            <div className="py-4">
              <h4 className="font-medium text-gray-800 mb-2">Experience</h4>
              <div className="space-y-3">
                {candidate.experience.map((exp: any, idx: number) => (
                  <div key={idx}>
                    <div className="text-sm font-medium">
                      {exp.role} at {exp.company}
                    </div>
                    <div className="text-sm text-gray-500">{exp.years}</div>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}
        
        <div className="py-4">
          <h4 className="font-medium text-gray-800 mb-2">Notes</h4>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-gray-700 border rounded-lg"
            rows={2}
            placeholder="Add notes about this candidate..."
          />
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={() => statusMutation.mutate("rejected")}
              disabled={candidate.status === "rejected"}
            >
              Reject
            </Button>
            <Button
              variant="default"
              onClick={() => {
                updateNotesMutation.mutate();
                statusMutation.mutate("shortlisted");
              }}
              disabled={candidate.status === "shortlisted"}
            >
              Approve
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateDetail;
