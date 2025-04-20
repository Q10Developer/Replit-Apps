import { FileText, UserCheck, Briefcase, Clock } from "lucide-react";
import StatisticsCard from "@/components/ui/statistics-card";
import FileUploader from "@/components/upload/FileUploader";
import CandidateTable from "@/components/candidates/CandidateTable";
import CandidateDetail from "@/components/candidates/CandidateDetail";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

const Dashboard = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/stats'],
  });

  // Handle view candidate
  const handleViewCandidate = (candidate: any) => {
    setSelectedCandidate(candidate);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div>
          <Link href="/upload">
            <Button className="inline-flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatisticsCard
          title="Total CVs Processed"
          value={isLoadingStats ? "Loading..." : stats?.totalCVs || 0}
          icon={FileText}
          iconBgColor="bg-primary-100"
          iconColor="text-primary-600"
        />
        <StatisticsCard
          title="Shortlisted Candidates"
          value={isLoadingStats ? "Loading..." : stats?.shortlistedCandidates || 0}
          icon={UserCheck}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatisticsCard
          title="Active Positions"
          value={isLoadingStats ? "Loading..." : stats?.activePositions || 0}
          icon={Briefcase}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatisticsCard
          title="Time Saved"
          value={isLoadingStats ? "Loading..." : stats?.timeSaved || "0 hrs"}
          icon={Clock}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Upload Section */}
      <FileUploader />

      {/* Recent Results */}
      <CandidateTable onViewCandidate={handleViewCandidate} />

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

export default Dashboard;
