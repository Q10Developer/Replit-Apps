import { useState } from "react";
import FileUploader from "@/components/upload/FileUploader";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

const UploadCVs = () => {
  // Fetch upload history
  const { data: uploads, isLoading } = useQuery({
    queryKey: ["/api/uploads"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload CVs</h1>
        <p className="text-gray-600">
          Upload CSV files containing candidate information for automated ranking and processing.
        </p>
      </div>

      {/* Upload Section */}
      <FileUploader maxSizeMB={10} />

      {/* CSV Template Info */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-3">CSV Template Format</h2>
          <p className="text-gray-600 mb-4">
            Your CSV file should include the following columns:
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Column
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Required
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Example
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">name</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Full name of the candidate</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Yes</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">John Smith</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">email</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Email address</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Yes</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">john.smith@example.com</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">position</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Job position they're applying for</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Yes</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Frontend Developer</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">skills</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Comma-separated list of skills</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Yes</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">React, TypeScript, CSS</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">experience</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    Semi-colon separated list of experiences, each with company|role|years format
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">No</td>
                  <td className="px-4 py-2 whitespace-wrap text-sm text-gray-500 max-w-sm">
                    TechCorp|Senior Frontend Developer|2020-Present; WebSolutions|Frontend Developer|2018-2020
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <Separator className="my-6" />
          
          <h3 className="text-md font-semibold mb-2">Sample CSV Content:</h3>
          <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
            name,email,position,skills,experience<br/>
            "John Smith","john.smith@example.com","Frontend Developer","React,TypeScript,CSS","TechCorp|Senior Frontend Developer|2020-Present;WebSolutions|Frontend Developer|2018-2020"<br/>
            "Maria Johnson","maria.j@example.com","Data Analyst","Python,SQL,Excel","DataCo|Data Analyst|2019-Present"
          </pre>
        </CardContent>
      </Card>

      {/* Upload History */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Upload History</h2>
          
          {isLoading ? (
            <p className="text-gray-500">Loading upload history...</p>
          ) : !uploads || uploads.length === 0 ? (
            <p className="text-gray-500">No upload history available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filename
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Records
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Successful
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Failed
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploads.map((upload: any) => (
                    <tr key={upload.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {upload.filename}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {format(parseISO(upload.processedAt), "MMM d, yyyy h:mm a")}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {upload.totalRecords}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-green-600 font-medium">{upload.successfulRecords}</span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span className={upload.failedRecords > 0 ? "text-red-600 font-medium" : "text-gray-500"}>
                          {upload.failedRecords}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadCVs;
