import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Check,
  X,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AvatarName from "@/components/ui/avatar-name";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CandidateTableProps {
  onViewCandidate: (candidate: any) => void;
}

const CandidateTable = ({ onViewCandidate }: CandidateTableProps) => {
  const [selectedPosition, setSelectedPosition] = useState<string>("All Positions");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch candidates and positions
  const { data: candidates = [], isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["/api/candidates"],
  });

  const { data: positions = [], isLoading: isLoadingPositions } = useQuery({
    queryKey: ["/api/positions"],
  });

  // Status change mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("POST", `/api/candidates/${id}/status`, { status });
      return await res.json();
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

  // Filter candidates by selected position
  const filteredCandidates = candidates.filter((candidate: any) => {
    if (selectedPosition === "All Positions") return true;
    return candidate.position === selectedPosition;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + itemsPerPage);

  // Handle export
  const handleExport = async () => {
    try {
      // Create URL for export with filters
      let exportUrl = "/api/exports";
      
      if (selectedPosition !== "All Positions") {
        exportUrl += `?position=${encodeURIComponent(selectedPosition)}`;
      }
      
      // Redirect to the export URL which will download the CSV
      window.location.href = exportUrl;
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export candidates",
        variant: "destructive",
      });
    }
  };

  // Status Badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, string> = {
      shortlisted: "bg-green-100 text-green-800",
      review: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
      pending: "bg-gray-100 text-gray-800",
    };

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${variants[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Handle status change
  const handleStatusChange = (candidateId: number, newStatus: "shortlisted" | "rejected") => {
    statusMutation.mutate({ id: candidateId, status: newStatus });
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Candidates</h3>
        <div className="flex space-x-3">
          <div className="relative inline-block text-left">
            <Select
              value={selectedPosition}
              onValueChange={setSelectedPosition}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Positions">All Positions</SelectItem>
                {positions.map((position: any) => (
                  <SelectItem key={position.id} value={position.title}>
                    {position.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="inline-flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skills Match
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingCandidates ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    Loading candidates...
                  </TableCell>
                </TableRow>
              ) : paginatedCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    No candidates found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCandidates.map((candidate: any) => (
                  <TableRow key={candidate.id} className="hover:bg-gray-50">
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <AvatarName name={candidate.name} size="md" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {candidate.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{candidate.position}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{candidate.score}%</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        {Object.entries(candidate.skills)
                          .sort(([, a]: any, [, b]: any) => b - a)
                          .slice(0, 2)
                          .map(([skill, score]: [string, any]) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className={`px-2 text-xs ${
                                score >= 85
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {skill}
                            </Badge>
                          ))}
                        {Object.keys(candidate.skills).length > 2 && (
                          <Badge variant="outline" className="px-2 text-xs bg-blue-100 text-blue-800">
                            +{Object.keys(candidate.skills).length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={candidate.status} />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onViewCandidate(candidate)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleStatusChange(candidate.id, "shortlisted")}
                          className="text-green-600 hover:text-green-900"
                          disabled={candidate.status === "shortlisted"}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleStatusChange(candidate.id, "rejected")}
                          className="text-red-600 hover:text-red-900"
                          disabled={candidate.status === "rejected"}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {filteredCandidates.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(startIndex + itemsPerPage, filteredCandidates.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredCandidates.length}</span> candidates
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                    let pageNumber: number;
                    
                    // Logic to handle which page numbers to show
                    if (totalPages <= 5) {
                      pageNumber = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = idx + 1;
                      if (idx === 4) pageNumber = totalPages;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + idx;
                    } else {
                      pageNumber = currentPage - 2 + idx;
                    }
                    
                    return (
                      <Button
                        key={idx}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="icon"
                        onClick={() => setCurrentPage(pageNumber)}
                        className="relative inline-flex items-center px-4 py-2"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateTable;
