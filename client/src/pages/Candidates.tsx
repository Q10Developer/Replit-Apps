import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CandidateTable from "@/components/candidates/CandidateTable";
import CandidateDetail from "@/components/candidates/CandidateDetail";
import { useQuery } from "@tanstack/react-query";

const Candidates = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch candidates
  const { data: allCandidates = [], isLoading } = useQuery({
    queryKey: ['/api/candidates'],
  });

  // Filter candidates based on active tab
  const candidates = allCandidates.filter((candidate: any) => {
    if (activeTab === "all") return true;
    return candidate.status === activeTab;
  });

  // Count candidates by status
  const shortlistedCount = allCandidates.filter((c: any) => c.status === "shortlisted").length;
  const reviewCount = allCandidates.filter((c: any) => c.status === "review").length;
  const rejectedCount = allCandidates.filter((c: any) => c.status === "rejected").length;
  const pendingCount = allCandidates.filter((c: any) => c.status === "pending").length;

  // Handle view candidate
  const handleViewCandidate = (candidate: any) => {
    setSelectedCandidate(candidate);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Candidates</h1>
        <p className="text-gray-600">
          Manage and review candidates based on their ranking and status.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                All Candidates
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                  {allCandidates.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="shortlisted">
                Shortlisted
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                  {shortlistedCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="review">
                Review
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">
                  {reviewCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                  {pendingCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                  {rejectedCount}
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="text-center p-10">
                  <p className="text-gray-500">Loading candidates...</p>
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center p-10">
                  <p className="text-gray-500">No candidates found in this category.</p>
                </div>
              ) : (
                <CandidateTable onViewCandidate={handleViewCandidate} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <CandidateDetail
          candidate={selectedCandidate}
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Candidates;
