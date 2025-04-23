import { apiRequest } from './queryClient';

/**
 * Helper function to make requests to the Python API endpoints
 * 
 * @param method HTTP method to use
 * @param endpoint API endpoint (without the /python-api prefix)
 * @param data Optional data to send with the request
 * @returns Promise with the response data
 */
export async function pythonApiRequest<T = any>(
  method: string,
  endpoint: string,
  data?: unknown,
): Promise<T> {
  // Ensure endpoint starts with a slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Make the request to the Python API via our proxy
  const response = await apiRequest(method, `/python-api${path}`, data);
  return response.json();
}

/**
 * Custom hook to upload a CSV file to the Python backend for processing
 * 
 * @param options Optional configuration options
 * @returns Object with upload function and state
 */
export async function uploadCsvToProcess(
  file: File,
  position: string,
  onProgress?: (progress: number) => void,
): Promise<any> {
  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('position', position);
  
  // Simulate progress for better UX
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += 5;
    if (progress > 90) {
      clearInterval(progressInterval);
    } else if (onProgress) {
      onProgress(progress);
    }
  }, 300);
  
  try {
    // Use fetch directly for FormData
    const response = await fetch('/python-api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    // Clear progress simulation
    clearInterval(progressInterval);
    if (onProgress) onProgress(100);
    
    // Handle response
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    // Clear progress simulation on error
    clearInterval(progressInterval);
    throw error;
  }
}

/**
 * Function to export candidates data from the Python backend
 * 
 * @param filters Optional filters for the export
 * @returns URL for downloading the exported file
 */
export function getExportUrl(filters?: { position?: string; status?: string }): string {
  // Build query parameters
  const params = new URLSearchParams();
  if (filters?.position) params.append('position', filters.position);
  if (filters?.status) params.append('status', filters.status);
  
  // Return the download URL
  return `/python-api/exports${params.toString() ? '?' + params.toString() : ''}`;
}