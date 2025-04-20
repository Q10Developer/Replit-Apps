import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Download, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const Reports = () => {
  const [timeRange, setTimeRange] = useState("all");
  
  // Fetch candidates data
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['/api/candidates'],
  });

  // Filter by time range (not implemented)
  const filteredCandidates = candidates;

  // Process data for position chart
  const positionData = filteredCandidates.reduce((acc: any, candidate: any) => {
    const position = candidate.position;
    if (!acc[position]) {
      acc[position] = { name: position, count: 0 };
    }
    acc[position].count++;
    return acc;
  }, {});

  const positionChartData = Object.values(positionData);

  // Process data for status chart
  const statusData = [
    { 
      name: "Shortlisted", 
      value: filteredCandidates.filter((c: any) => c.status === "shortlisted").length,
      color: "#10B981" // green
    },
    { 
      name: "Review", 
      value: filteredCandidates.filter((c: any) => c.status === "review").length,
      color: "#F59E0B" // yellow
    },
    { 
      name: "Pending", 
      value: filteredCandidates.filter((c: any) => c.status === "pending").length,
      color: "#6B7280" // gray
    },
    { 
      name: "Rejected", 
      value: filteredCandidates.filter((c: any) => c.status === "rejected").length,
      color: "#EF4444" // red
    }
  ];

  // Process data for skill match chart
  const scoreRanges = [
    { name: "90-100%", range: [90, 100], count: 0 },
    { name: "80-89%", range: [80, 89], count: 0 },
    { name: "70-79%", range: [70, 79], count: 0 },
    { name: "60-69%", range: [60, 69], count: 0 },
    { name: "0-59%", range: [0, 59], count: 0 }
  ];

  filteredCandidates.forEach((candidate: any) => {
    const score = candidate.score;
    for (const range of scoreRanges) {
      if (score >= range.range[0] && score <= range.range[1]) {
        range.count++;
        break;
      }
    }
  });

  // Export report data
  const handleExportReport = () => {
    window.location.href = "/api/exports";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600">
            Analytics and insights about your candidate data.
          </p>
        </div>
        <div className="flex space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="day">Today</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-10">
          <p className="text-gray-500">Loading reports data...</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-gray-500">No data available for reports.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidates by Position */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Candidates by Position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={positionChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Candidates" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Candidates by Status */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Candidates by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="hsl(var(--chart-1))"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Score Distribution */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={scoreRanges}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--chart-2))" name="Candidates" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Total Candidates</p>
                    <p className="text-2xl font-bold">{filteredCandidates.length}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Average Score</p>
                    <p className="text-2xl font-bold">
                      {filteredCandidates.length > 0
                        ? Math.round(
                            filteredCandidates.reduce(
                              (sum: number, c: any) => sum + c.score,
                              0
                            ) / filteredCandidates.length
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Shortlist Rate</p>
                    <p className="text-2xl font-bold">
                      {filteredCandidates.length > 0
                        ? Math.round(
                            (filteredCandidates.filter(
                              (c: any) => c.status === "shortlisted"
                            ).length /
                              filteredCandidates.length) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Top Position</p>
                    <p className="text-2xl font-bold">
                      {positionChartData.length > 0
                        ? positionChartData.sort((a: any, b: any) => b.count - a.count)[0].name
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reports;
